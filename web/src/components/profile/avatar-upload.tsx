"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarUploadProps {
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  currentImage?: string;
  className?: string;
}

export function AvatarUpload({ onUpload, onRemove, currentImage, className }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  // Update preview when currentImage changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Automatically upload when file is selected
    try {
      setIsUploading(true);
      await onUpload(file);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Notify parent component to remove the image
    if (onRemove) {
      onRemove();
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Avatar Display */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border">
              {preview ? (
                <Image
                  src={preview}
                  alt="Profile preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Image
                    src="/default_profile.png"
                    alt="Default profile"
                    width={64}
                    height={64}
                    className="opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Initial state - no file selected */}
            {!selectedFile && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={isUploading}
              >
                {currentImage ? "Change Photo" : "Upload Photo"}
              </Button>
            )}

            {/* File selected but uploading */}
            {selectedFile && isUploading && (
              <div className="text-sm text-muted-foreground text-center">
                Processing image...
              </div>
            )}

            {/* After upload - show replace/remove options */}
            {!selectedFile && currentImage && (
              <div className="flex gap-2">
                <Button
                  onClick={handleReplace}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Replace
                </Button>
                <Button
                  onClick={handleRemove}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive text-center">
              {error}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="text-sm text-muted-foreground text-center">
              Processing image...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
