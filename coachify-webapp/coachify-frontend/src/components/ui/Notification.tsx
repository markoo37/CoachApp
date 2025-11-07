import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // Customizable duration
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 4000 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`min-w-[320px] max-w-md w-full shadow-xl rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-10 overflow-hidden ${
        type === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'
      }`}>
        <div className="p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {type === 'success' ? (
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-base font-semibold ${type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                    {type === 'success' ? 'Success!' : 'Error'}
                  </p>
                  <p className={`text-sm mt-1 ${type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {message}
                  </p>
                </div>
                <button
                  className={`ml-4 rounded-md inline-flex ${type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'success' ? 'focus:ring-green-500' : 'focus:ring-red-500'} transition-colors`}
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;