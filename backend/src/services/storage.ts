import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getSignedUrlV3 } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
});

const BUCKET = process.env.AWS_S3_BUCKET || 'creativity-assets';

// Generate a signed URL for private S3 objects (expires in 7 days)
export async function getSignedUrl(s3Key: string, expiresInSeconds: number = 604800): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });
  return await getSignedUrlV3(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function uploadImageFromUrl(imageUrl: string, userId: string): Promise<string> {
  try {
    console.log('[Storage] Downloading image from URL:', imageUrl.substring(0, 100) + '...');

    // Download image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);
    const key = `creatives/${userId}/${uuidv4()}.png`;

    console.log('[Storage] Image downloaded, size:', buffer.length, 'bytes');
    console.log('[Storage] Uploading to S3 bucket:', BUCKET);
    console.log('[Storage] S3 key:', key);

    // Upload to S3 (private by default)
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      })
    );

    console.log('[Storage] Upload successful');

    // Return S3 key (not URL) - will generate signed URL when needed
    return key;
  } catch (error) {
    console.error('[Storage] Error uploading image:', error);
    throw error;
  }
}

export async function uploadImage(buffer: Buffer, userId: string, contentType: string): Promise<string> {
  try {
    const extension = contentType.split('/')[1] || 'png';
    const key = `creatives/${userId}/${uuidv4()}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // Return S3 key (not URL) - will generate signed URL when needed
    return key;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
