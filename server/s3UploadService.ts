import { Express, Request, Response } from 'express';
import {
  upload, 
  productImageUpload,
  generatePresignedUrl,
  deleteFileFromS3,
  getKeyFromUrl
} from './s3Config';
import { isAuthenticated } from './auth';

/**
 * Register S3 file upload routes
 * @param app - Express application
 */
export function registerS3UploadRoutes(app: Express) {
  // General file upload endpoint
  app.post('/api/s3/upload', isAuthenticated, upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // The file object from multer-s3 includes the S3 location and key
      const fileData = req.file as Express.MulterS3.File;
      
      return res.status(200).json({
        message: 'File uploaded successfully',
        url: fileData.location,
        key: fileData.key,
        mimetype: fileData.mimetype,
        size: fileData.size
      });
    } catch (error) {
      console.error('S3 upload error:', error);
      return res.status(500).json({ message: 'Upload failed', error: String(error) });
    }
  });

  // Product image upload endpoint with higher size limit and image-only restriction
  app.post('/api/s3/upload/product-image', isAuthenticated, productImageUpload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      
      // The file object from multer-s3 includes the S3 location and key
      const fileData = req.file as Express.MulterS3.File;
      
      return res.status(200).json({
        message: 'Product image uploaded successfully',
        url: fileData.location,
        key: fileData.key,
        mimetype: fileData.mimetype,
        size: fileData.size
      });
    } catch (error) {
      console.error('S3 product image upload error:', error);
      return res.status(500).json({ message: 'Upload failed', error: String(error) });
    }
  });

  // Multiple files upload
  app.post('/api/s3/upload/multiple', isAuthenticated, upload.array('files', 10), (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      // The files array from multer-s3 includes the S3 location and key for each file
      const filesData = req.files as Express.MulterS3.File[];
      
      const uploadedFiles = filesData.map(file => ({
        url: file.location,
        key: file.key,
        mimetype: file.mimetype,
        size: file.size,
        originalname: file.originalname
      }));
      
      return res.status(200).json({
        message: `${uploadedFiles.length} files uploaded successfully`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('S3 multiple files upload error:', error);
      return res.status(500).json({ message: 'Upload failed', error: String(error) });
    }
  });

  // Get a presigned URL for a file
  app.get('/api/s3/signed-url/:key', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      if (!key) {
        return res.status(400).json({ message: 'File key is required' });
      }
      
      // Generate a signed URL with a 1 hour expiration
      const url = await generatePresignedUrl(key);
      
      return res.status(200).json({ url });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return res.status(500).json({ message: 'Error generating signed URL', error: String(error) });
    }
  });

  // Delete a file from S3
  app.delete('/api/s3/files', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { url, key } = req.body;
      
      if (!url && !key) {
        return res.status(400).json({ message: 'Either file URL or key is required' });
      }
      
      // If URL is provided, extract the key
      const fileKey = key || (url ? getKeyFromUrl(url) : null);
      
      if (!fileKey) {
        return res.status(400).json({ message: 'Invalid file URL or key' });
      }
      
      const deleted = await deleteFileFromS3(fileKey);
      
      if (deleted) {
        return res.status(200).json({ message: 'File deleted successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to delete file' });
      }
    } catch (error) {
      console.error('S3 file deletion error:', error);
      return res.status(500).json({ message: 'File deletion failed', error: String(error) });
    }
  });
}