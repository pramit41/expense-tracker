const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

exports.handler = async (event) => {
  try {
    if (!bucket) {
      return jsonResponse(500, { message: 'S3_BUCKET is not configured' });
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
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return jsonResponse(200, { uploadUrl, key });
  } catch (error) {
    console.error('Upload handler error:', error);
    return jsonResponse(500, { message: 'Could not generate presigned URL' });
  }
};
