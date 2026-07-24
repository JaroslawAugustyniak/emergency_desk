'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import imageCompression from 'browser-image-compression';
import Swal from 'sweetalert2';

interface Photo {
  id: number;
  url: string;
  created_at: string;
}

interface PhotoUploadSectionProps {
  orderId: number;
  photos: Photo[];
  token: string;
  onPhotosUpdated: (photos: Photo[]) => void;
  isTechnician: boolean;
}

export default function PhotoUploadSection({
  orderId,
  photos,
  token,
  onPhotosUpdated,
  isTechnician,
}: PhotoUploadSectionProps) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      throw new Error('Failed to compress image');
    }
  };

  const handleFiles = async (files: FileList) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      await Swal.fire({
        title: 'Error',
        text: 'Please select image files',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      for (const file of imageFiles) {
        const compressedFile = await compressImage(file);
        formData.append('photos[]', compressedFile);
      }

      const response = await fetch(`/api/orders/${orderId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t('photosUploadError'));
      }

      const data = await response.json();
      onPhotosUpdated(data.data || []);

      await Swal.fire({
        title: t('photosUploaded'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('photosUploadError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDelete = async (photoId: number) => {
    const result = await Swal.fire({
      title: t('deletePhoto'),
      text: tCommon('confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tCommon('yes'),
      cancelButtonText: tCommon('no'),
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('photoDeleteError'));
      }

      const updatedPhotos = photos.filter((p) => p.id !== photoId);
      onPhotosUpdated(updatedPhotos);

      await Swal.fire({
        title: t('photoDeletedSuccess'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Delete error:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('photoDeleteError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        {t('repairPhotos')}
      </h3>

      {isTechnician && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {isUploading ? t('photosUploading') : t('dragDropPhotos')}
          </button>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt="Repair photo"
                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  // Lightbox will be handled by parent component
                }}
              />
              {isTechnician && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  title={t('deletePhoto')}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center text-gray-500">
          {t('noPhotos')}
        </div>
      )}
    </div>
  );
}
