import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request } from 'express';
import path from 'path';
import crypto from 'crypto';

// Validate environment variables
if (!process.env.AWS_ACCESS_KEY_ID) throw new Error('AWS_ACCESS_KEY_ID is required');
if (!process.env.AWS_SECRET_ACCESS_KEY) throw new Error('AWS_SECRET_ACCESS_KEY is required');
if (!process.env.AWS_REGION) throw new Error('AWS_REGION is required');
if (!process.env.AWS_BUCKET_NAME) throw new Error('AWS_BUCKET_NAME is required');

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 bucket name
export const bucketName = process.env.AWS_BUCKET_NAME;

// Function to generate a presigned URL for fetching objects
export const generatePresignedUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

// Define storage for multer-s3
const s3Storage = multerS3({
  s3: s3Client,
  bucket: bucketName,
  metadata: (_req: Request, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (_req: Request, file, cb) => {
    // Generate a unique file name to prevent collisions
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  },
});

// File filter function to restrict file types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, PDFs, and common document types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};

// Create multer uploader instances for different use cases
// General uploader with 5MB limit
export const upload = multer({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Product image uploader with 10MB limit
export const productImageUpload = multer({
  storage: s3Storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only accept image types for product images
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for product images'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Helper function to delete a file from S3
export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Extract the file key from a full S3 URL
export const getKeyFromUrl = (url: string): string | null => {
  try {
    // Parse the URL to extract the path which contains the key
    const urlObj = new URL(url);
    // The path starts with a '/', so we remove it
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};