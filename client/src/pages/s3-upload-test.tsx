import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import S3FileUpload from '@/components/common/S3FileUpload';
import { useToast } from '@/hooks/use-toast';

type UploadedFile = {
  url: string;
  key: string;
  mimetype: string;
  size: number;
};

type FileUploadResult = 
  | UploadedFile 
  | { files: UploadedFile[] };

export default function S3UploadTestPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedProductImage, setUploadedProductImage] = useState<UploadedFile | null>(null);
  const [multipleUploadedFiles, setMultipleUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFileUploadSuccess = (fileData: FileUploadResult) => {
    if ('url' in fileData) {
      setUploadedFiles((prev) => [...prev, fileData]);
    }
  };

  const handleProductImageUploadSuccess = (fileData: FileUploadResult) => {
    if ('url' in fileData) {
      setUploadedProductImage(fileData);
    }
  };

  const handleMultipleFileUploadSuccess = (fileData: FileUploadResult) => {
    if ('files' in fileData) {
      setMultipleUploadedFiles((prev) => [...prev, ...fileData.files]);
      toast({
        title: 'Multiple files uploaded',
        description: `Successfully uploaded ${fileData.files.length} files`,
      });
    }
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: 'Upload failed',
      description: error.message || 'An error occurred during the upload.',
      variant: 'destructive',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>S3 File Upload Test | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">S3 File Upload Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the S3 file upload functionality to store files in the cloud.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* General File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>General File Upload</CardTitle>
              <CardDescription>
                Upload any file type (images, PDFs, documents) up to 5MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <S3FileUpload
                onSuccess={handleFileUploadSuccess}
                onError={handleUploadError}
                endpoint="upload"
                accept="*/*"
                buttonText="Upload Any File"
                maxSizeMB={5}
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium">Uploaded Files</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="border p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm break-all">{file.key}</div>
                            <div className="text-xs text-muted-foreground">{file.mimetype} - {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image Upload</CardTitle>
              <CardDescription>
                Upload product images up to 10MB. Only image files allowed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <S3FileUpload
                onSuccess={handleProductImageUploadSuccess}
                onError={handleUploadError}
                endpoint="upload/product-image"
                accept="image/*"
                buttonText="Upload Product Image"
                maxSizeMB={10}
              />

              {uploadedProductImage && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium">Uploaded Product Image</h3>
                  <div className="border p-3 rounded-md">
                    {uploadedProductImage.mimetype.startsWith('image/') && (
                      <div className="w-full h-48 mb-3 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={uploadedProductImage.url}
                          alt="Product"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm break-all">{uploadedProductImage.key}</div>
                        <div className="text-xs text-muted-foreground">
                          {uploadedProductImage.mimetype} - {(uploadedProductImage.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <a
                        href={uploadedProductImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Multiple Files Upload Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Multiple Files Upload</CardTitle>
            <CardDescription>
              Upload multiple files at once (up to 10 files, 5MB each).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <S3FileUpload
              onSuccess={handleMultipleFileUploadSuccess}
              onError={handleUploadError}
              endpoint="upload/multiple"
              accept="image/*"
              buttonText="Upload Multiple Files"
              maxSizeMB={5}
              multiple={true}
              maxFiles={10}
            />

            {multipleUploadedFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium">Uploaded Multiple Files</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {multipleUploadedFiles.map((file, index) => (
                    <div key={index} className="border p-3 rounded-md">
                      {file.mimetype.startsWith('image/') && (
                        <div className="w-full h-32 mb-3 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={file.url}
                            alt={`File ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="font-medium text-sm truncate">{file.key.split('/').pop()}</div>
                        <div className="text-xs text-muted-foreground">
                          {file.mimetype} - {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}