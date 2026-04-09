import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessToast = ({ visible, message, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
        <button onClick={onClose} className="ml-auto text-green-500 hover:text-green-700">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;
