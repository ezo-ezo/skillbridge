const path = require('path');
const fs = require('fs');
const config = require('../utils/config');

// Uploads go to S3 when S3_BUCKET is set, otherwise to server/uploads (local development).
// Stored URLs stay `/uploads/<file>` either way; `GET /uploads/:file` serves or redirects.
const s3Enabled = !!config.s3.bucket;
const localDir = path.join(__dirname, '..', '..', 'uploads');

let client;
let sdk;
function s3() {
  if (!client) {
    sdk = { ...require('@aws-sdk/client-s3'), ...require('@aws-sdk/s3-request-presigner') };
    client = new sdk.S3Client({ region: config.s3.region });
  }
  return client;
}

async function saveFile(filename, file) {
  if (!s3Enabled) {
    await fs.promises.mkdir(localDir, { recursive: true });
    await fs.promises.writeFile(path.join(localDir, filename), file.buffer);
    return;
  }
  const c = s3();
  await c.send(new sdk.PutObjectCommand({ Bucket: config.s3.bucket, Key: filename, Body: file.buffer, ContentType: file.mimetype }));
}

// Short-lived signed link to a stored file, or null when files are on local disk.
async function signedUrl(filename) {
  if (!s3Enabled) return null;
  const c = s3();
  return sdk.getSignedUrl(c, new sdk.GetObjectCommand({ Bucket: config.s3.bucket, Key: filename }), { expiresIn: config.s3.urlTtlSeconds });
}

module.exports = { s3Enabled, localDir, saveFile, signedUrl };
