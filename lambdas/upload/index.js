const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomBytes } = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bucket = process.env.S3_BUCKET;

const buildObjectKey = (filename) => {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now().toString();
  const random = randomBytes(8).toString('hex');
  return `uploads/${timestamp}-${random}-${safeName}`;
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
  const path = event.rawPath || event.path || '';
  
  if (path.includes('presigned-view')) {
    return handlePresignedView(event);
  }
  
  return handlePresignedUrl(event);
};

const handlePresignedUrl = async (event) => {
  try {
    if (!bucket) {
      return jsonResponse(500, { message: 'S3_BUCKET is not configured' });
    }

    const userId = getUserId(event);
    if (!userId) {
      return jsonResponse(401, { message: 'Unauthorized' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const filename = body.filename;
    const contentType = body.contentType || 'application/octet-stream';

    if (!filename) {
      return jsonResponse(400, { message: 'Missing filename' });
    }

    const key = buildObjectKey(filename);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'user-id': userId,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return jsonResponse(200, { uploadUrl, key });
  } catch (error) {
    console.error('Upload handler error:', error);
    return jsonResponse(500, { message: 'Could not generate presigned URL' });
  }
};

const handlePresignedView = async (event) => {
  try {
    if (!bucket) {
      return jsonResponse(500, { message: 'S3_BUCKET is not configured' });
    }

    const userId = getUserId(event);
    if (!userId) {
      return jsonResponse(401, { message: 'Unauthorized' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const s3Key = body.s3Key;

    if (!s3Key) {
      return jsonResponse(400, { message: 'Missing s3Key' });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return jsonResponse(200, { viewUrl });
  } catch (error) {
    console.error('View handler error:', error);
    return jsonResponse(500, { message: 'Could not generate view URL' });
  }
};
