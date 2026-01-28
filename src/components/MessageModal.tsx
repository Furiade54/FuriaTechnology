import React from 'react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
  isError?: boolean;
}

const MessageModal: React.FC<MessageModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  icon = 'check_circle',
  isError = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isError ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-green-100 text-green-500 dark:bg-green-900/30'}`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            {message}
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
