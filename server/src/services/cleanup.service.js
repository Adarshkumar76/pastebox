import { File } from "../models/file.models.js";
import { GuestFile } from "../models/guestFile.models.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import AWS from "aws-sdk";

/**
 * Permanently deletes an object from the AWS S3 bucket.
 * @param {string} fileName - File name or S3 key
 * @returns {Promise<boolean>}
 */
export const purgeS3Object = async (fileName) => {
  if (!fileName) return false;

  // Clean key - ensure it's under file-share-app/
  const s3Key = fileName.startsWith("file-share-app/")
    ? fileName
    : `file-share-app/${fileName}`;

  const bucket = process.env.AWS_BUCKET_NAME;

  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    await s3Client.send(command);
    console.log(`🗑️ [S3-Purge] Successfully deleted: "${s3Key}" from bucket "${bucket}"`);
    return true;
  } catch (v3Err) {
    console.error(`⚠️ [S3-Purge] V3 delete failed, attempting V2 fallback for "${s3Key}":`, v3Err.message);
    try {
      const s3V2 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });

      await s3V2.deleteObject({
        Bucket: bucket,
        Key: s3Key,
      }).promise();

      console.log(`🗑️ [S3-Purge-v2] Fallback deleted: "${s3Key}"`);
      return true;
    } catch (v2Err) {
      console.error(`❌ [S3-Purge] Failed to delete "${s3Key}" from S3:`, v2Err.message);
      return false;
    }
  }
};

/**
 * Sweeps MongoDB collections and purges any records whose expiresAt <= now.
 */
export const purgeExpiredFiles = async () => {
  const now = new Date();

  try {
    // 1. Purge expired user files
    const expiredUserFiles = await File.find({
      expiresAt: { $ne: null, $lte: now },
    });

    for (const file of expiredUserFiles) {
      console.log(`⏰ [Auto-Purge] Expired file found: "${file.name}" (expired: ${file.expiresAt}). Purging...`);
      await purgeS3Object(file.name);
      await File.findByIdAndDelete(file._id);
    }

    // 2. Purge expired guest files
    const expiredGuestFiles = await GuestFile.find({
      expiresAt: { $ne: null, $lte: now },
    });

    for (const file of expiredGuestFiles) {
      console.log(`⏰ [Auto-Purge] Expired guest file found: "${file.name}" (expired: ${file.expiresAt}). Purging...`);
      await purgeS3Object(file.name);
      await GuestFile.findByIdAndDelete(file._id);
    }

    const total = expiredUserFiles.length + expiredGuestFiles.length;
    if (total > 0) {
      console.log(`✅ [Auto-Purge] Successfully purged ${total} expired file(s) from S3 and MongoDB.`);
    }
  } catch (err) {
    console.error("❌ [Auto-Purge] Error during cleanup sweep:", err.message);
  }
};

/**
 * Initializes the recurring cleanup background timer.
 * @param {number} intervalMs - Polling interval in ms (default 30,000 = 30 seconds)
 */
export const startAutoCleanupJob = (intervalMs = 30000) => {
  console.log(`🕒 [Auto-Purge] Job scheduled (running every ${intervalMs / 1000}s)`);
  // Run on startup
  purgeExpiredFiles();
  // Run repeatedly
  setInterval(purgeExpiredFiles, intervalMs);
};

