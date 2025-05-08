import multer from 'multer';
import path from 'path';
import { Express, Request, Response } from 'express';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for image uploads
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Create upload middleware
export const uploadMiddleware = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
});

// Function to register upload routes
export function registerUploadRoutes(app: Express) {
  // Route for image uploads
  app.post('/api/upload', uploadMiddleware.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Get base url
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Return file URL for access from the client
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      return res.status(200).json({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ message: 'Upload failed', error: String(error) });
    }
  });

  // Serve static files from uploads directory
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
}