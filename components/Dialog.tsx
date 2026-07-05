import React from 'react';

interface DialogProps {
  isOpen: boolean;
  message: string;
  onConfirm?: () => void;
  onCancel: () => void;
  isAlert?: boolean;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, message, onConfirm, onCancel, isAlert }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border dark:border-slate-700">
        <p className="text-lg mb-6 dark:text-white text-slate-800">{message}</p>
        <div className="flex justify-end gap-3 rtl:space-x-reverse">
          {!isAlert && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded font-medium bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition-colors"
            >
              إلغاء
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              if (isAlert) onCancel();
            }}
            className="px-4 py-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {isAlert ? 'حسناً' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
