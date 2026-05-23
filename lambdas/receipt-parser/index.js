const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { GetSecretValueCommand, SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');
const { randomBytes } = require('crypto');

const s3Client = new S3Client({});
const dynamodbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const secretsClient = new SecretsManagerClient({});

const bucket = process.env.S3_BUCKET;
const tableName = process.env.DYNAMODB_TABLE;
const secretName = process.env.CLAUDE_API_KEY_SECRET;

let cachedApiKey = null;

const getClaudeApiKey = async () => {
  if (cachedApiKey) {
    return cachedApiKey;
  }
  try {
    const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretName }));
    const secretString = response.SecretString;
    // Parse JSON if it's a JSON string, otherwise use as-is
    try {
      const secretJson = JSON.parse(secretString);
      cachedApiKey = secretJson.ANTHROPIC_API_KEY || secretString;
    } catch {
      cachedApiKey = secretString;
    }
    return cachedApiKey;
  } catch (error) {
    console.error('Failed to retrieve Claude API key from Secrets Manager:', error);
    throw error;
  }
};

const buildExpenseId = () => {
  const time = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${time}-${random}`;
};

const downloadS3Object = async (key) => {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`Failed to download S3 object ${key}:`, error);
    throw error;
  }
};

const getS3ObjectMetadata = async (key) => {
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    return response.Metadata || {};
  } catch (error) {
    console.error(`Failed to retrieve metadata for S3 object ${key}:`, error);
    throw error;
  }
};

const callClaudeVision = async (imageBuffer, apiKey) => {
  const base64Image = imageBuffer.toString('base64');
  
  const requestBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "store or restaurant name",
  "amount": "numeric amount (without currency symbol)",
  "currency": "currency code (e.g., USD, EUR)",
  "date": "ISO 8601 date format (YYYY-MM-DD)",
  "category": "one of: Food, Travel, Utilities, Office, Other"
}

If you cannot clearly identify a field, use a reasonable default:
- merchant: "Unknown"
- amount: 0
- currency: "USD"
- date: today's date in YYYY-MM-DD format
- category: "Other"

Return ONLY the raw JSON object. Do not wrap it in markdown, code fences, or backticks. No explanation, no preamble.`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} ${errorText}`);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    if (!content) {
      throw new Error('No content in Claude response');
    }

    const cleaned = content
    .replace(/^```json\s*/i, '')  // strip opening ```json
    .replace(/^```\s*/i, '')       // strip opening ``` (no language tag)
    .replace(/```\s*$/i, '')       // strip closing ```
    .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to call Claude vision API:', error);
    throw error;
  }
};

const parseReceiptImage = async (imageBuffer, apiKey) => {
  try {
    const parsed = await callClaudeVision(imageBuffer, apiKey);
    
    // Normalize parsed data
    return {
      merchant: String(parsed.merchant || 'Unknown').trim(),
      amount: parseFloat(parsed.amount || 0),
      currency: String(parsed.currency || 'USD').toUpperCase(),
      date: String(parsed.date || new Date().toISOString().slice(0, 10)),
      category: ['Food', 'Travel', 'Utilities', 'Office', 'Other'].includes(parsed.category)
        ? parsed.category
        : 'Other',
    };
  } catch (error) {
    console.error('Failed to parse receipt image:', error);
    throw error;
  }
};

const saveExpenseToDynamoDB = async (userId, receiptS3Key, parsedData) => {
  const expenseId = buildExpenseId();
  const item = {
    PK: userId,
    SK: expenseId,
    expenseId,
    merchant: parsedData.merchant,
    amount: parsedData.amount,
    currency: parsedData.currency,
    date: parsedData.date,
    category: parsedData.category,
    receiptS3Key,
    createdAt: new Date().toISOString(),
    source: 'auto-parsed',
  };

  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    await dynamodb.send(command);
    console.log(`Saved expense ${expenseId} for user ${userId}`);
    return item;
  } catch (error) {
    console.error('Failed to save expense to DynamoDB:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  console.log('Receipt parser Lambda invoked with event:', JSON.stringify(event));

  try {
    if (!bucket || !tableName || !secretName) {
      console.error('Missing required environment variables');
      return { statusCode: 500, body: 'Missing environment configuration' };
    }

    // Extract S3 object details from the event
    const s3Records = event.Records?.filter((r) => r.s3) || [];
    if (!s3Records.length) {
      console.error('No S3 records found in event');
      return { statusCode: 400, body: 'No S3 records in event' };
    }

    const apiKey = await getClaudeApiKey();
    const results = [];

    for (const record of s3Records) {
      const key = record.s3.object.key;
      console.log(`Processing receipt: ${key}`);

      try {
        // Get S3 object metadata to retrieve user ID
        const metadata = await getS3ObjectMetadata(key);
        const userId = metadata['user-id'];

        if (!userId) {
          console.warn(`No user-id metadata found for ${key}, skipping`);
          continue;
        }

        // Download the receipt image from S3
        const imageBuffer = await downloadS3Object(key);

        // Parse the receipt using Claude vision
        const parsedData = await parseReceiptImage(imageBuffer, apiKey);

        // Save the parsed expense to DynamoDB
        const expense = await saveExpenseToDynamoDB(userId, key, parsedData);
        results.push({ key, expense, status: 'success' });
        console.log(`Successfully processed receipt ${key}`);
      } catch (error) {
        console.error(`Error processing receipt ${key}:`, error);
        results.push({ key, status: 'failed', error: error.message });
      }
    }

    console.log('Receipt parsing batch completed:', JSON.stringify(results));
    return { statusCode: 200, body: JSON.stringify(results) };
  } catch (error) {
    console.error('Unexpected error in receipt parser handler:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
