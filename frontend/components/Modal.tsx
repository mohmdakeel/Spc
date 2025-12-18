'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit?: () => void;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  showFooter?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  size = 'md',
  loading = false,
  showFooter = true,
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl', // wider for details/long form
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[80vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-orange-200 bg-orange-50">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer */}
        {showFooter && onSubmit && (
          <div className="flex justify-end space-x-2 p-4 border-t border-orange-200 bg-orange-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
            >
              {loading && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {submitText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
