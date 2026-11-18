import React, { useState, useRef } from 'react';
import { Upload, X, Check, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { SchoolService } from '../../services/school.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface SchoolLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl?: string | null;
  onLogoUpdated: (newLogoUrl: string) => void;
}

export const SchoolLogoUploadModal: React.FC<SchoolLogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onLogoUpdated,
}) => {
  const { updateUserSchool } = useAuth();
  const { success, error } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize logo cleanly
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png');
          setPreviewUrl(compressed);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!previewUrl) {
      error('Please select or upload a school logo first.');
      return;
    }

    setIsSaving(true);
    try {
      await SchoolService.updateSchoolLogo(previewUrl);
      updateUserSchool({ logoUrl: previewUrl });
      onLogoUpdated(previewUrl);
      success('School logo updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Failed to update school logo:', err);
      error(err.response?.data?.message || 'Failed to update school logo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Upload School Logo
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updates branding on ID cards, invoices, and reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-indigo-500 cursor-pointer transition bg-gray-50 dark:bg-gray-900/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Click to select school emblem / logo
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports PNG, JPG, SVG, WebP (Transparent PNG recommended)
            </p>
          </div>

          {previewUrl && (
            <div className="flex items-center gap-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="w-16 h-16 rounded-xl bg-white p-1.5 border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={previewUrl}
                  alt="School Logo Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Logo Ready
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Will render prominently across all CR80 student ID cards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !previewUrl}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save & Apply Logo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
