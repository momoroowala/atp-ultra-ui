import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Trash2, Upload, FileVideo, Image as ImageIcon, FileText } from 'lucide-react';
import { uploadTaskFile, deleteTaskFile, isImageFile, isVideoFile, isDocumentFile, formatFileSize } from '@/utils/taskFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FileUploadFieldProps {
  fieldName: string;
  label: string;
  required?: boolean;
  helpText?: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

export const FileUploadField = ({
  fieldName,
  label,
  required = false,
  helpText,
  value,
  onChange,
}: FileUploadFieldProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(file => uploadTaskFile(file, user.id));
    
    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUploads = uploadedUrls.filter((url): url is string => url !== null);
      
      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads]);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
      
      if (successfulUploads.length < files.length) {
        toast.error(`${files.length - successfulUploads.length} file(s) failed to upload`);
      }
    } catch (error) {
      toast.error('Error uploading files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (urlToDelete: string) => {
    const success = await deleteTaskFile(urlToDelete);
    if (success) {
      onChange(value.filter(url => url !== urlToDelete));
      toast.success('File deleted');
    } else {
      toast.error('Failed to delete file');
    }
  };

  const getFileName = (url: string): string => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={fieldName} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {helpText && <p className="text-sm text-muted-foreground mb-2">{helpText}</p>}
      
      <div className="space-y-4">
        {value.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {value.map((url, index) => {
              const fileName = getFileName(url);
              const isImage = isImageFile(fileName);
              const isVideo = isVideoFile(fileName);
              const isDocument = isDocumentFile(fileName);

              return (
                <Card key={index} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {isImage ? (
                        <img 
                          src={url} 
                          alt={fileName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : isVideo ? (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <FileVideo className="w-8 h-8 text-muted-foreground" />
                        </div>
                      ) : isDocument ? (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline truncate block"
                      >
                        {fileName}
                      </a>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(url)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        
        <div 
          className="border-2 border-dashed border-primary/50 rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
          onClick={() => document.getElementById(fieldName)?.click()}
        >
          <Input
            id={fieldName}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium mb-1">
              {uploading ? 'Uploading...' : 'Click to upload files'}
            </p>
            <p className="text-xs text-muted-foreground">
              Images, videos, or documents up to 50MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
