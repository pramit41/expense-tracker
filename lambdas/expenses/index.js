const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { randomBytes } = require('crypto');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE;

const buildExpenseId = () => {
  const time = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${time}-${random}`;
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

const getUserId = (event) => {
  return event.requestContext?.authorizer?.claims?.sub;
};

exports.handler = async (event) => {
  try {
    if (!tableName) {
      return jsonResponse(500, { message: 'DYNAMODB_TABLE is not configured' });
    }

    const userId = getUserId(event);
    if (!userId) {
      return jsonResponse(401, { message: 'Unauthorized' });
    }

    const method = event.httpMethod;
    if (method === 'GET') {
      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': userId,
        },
      });

      const result = await dynamodb.send(command);
      return jsonResponse(200, result.Items ?? []);
    }

    if (method === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { merchant, amount, currency, date, category, receiptS3Key } = body;

      if (!merchant || amount == null || !currency || !date || !category) {
        return jsonResponse(400, { message: 'Missing required expense fields' });
      }

      const expenseId = buildExpenseId();
      const item = {
        PK: userId,
        SK: expenseId,
        expenseId,
        merchant,
        amount: Number(amount),
        currency,
        date,
        category,
        receiptS3Key: receiptS3Key || null,
        createdAt: new Date().toISOString(),
      };

      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await dynamodb.send(command);
      return jsonResponse(201, { expense: item });
    }

    if (method === 'DELETE') {
      const expenseId = event.pathParameters?.id;
      if (!expenseId) {
        return jsonResponse(400, { message: 'Missing expense id' });
      }

      const command = new DeleteCommand({
        TableName: tableName,
        Key: { PK: userId, SK: expenseId },
      });

      await dynamodb.send(command);
      return jsonResponse(204, {});
    }

    return jsonResponse(405, { message: 'Method not allowed' });
  } catch (error) {
    console.error('Expenses handler error:', error);
    return jsonResponse(500, { message: 'Expense action failed' });
  }
};
