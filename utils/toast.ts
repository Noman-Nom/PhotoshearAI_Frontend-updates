/**
 * Simple toast notification utility
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

const toastColors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-orange-500',
};

export const showToast = ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
  const toastEl = document.createElement('div');
  toastEl.className = `fixed top-4 right-4 ${toastColors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 font-bold text-sm animate-in slide-in-from-top-5 fade-in duration-300`;
  toastEl.textContent = message;
  toastEl.style.maxWidth = '400px';
  
  document.body.appendChild(toastEl);
  
  setTimeout(() => {
    toastEl.classList.add('animate-out', 'slide-out-to-top-5', 'fade-out');
    setTimeout(() => {
      document.body.removeChild(toastEl);
    }, 300);
  }, duration);
};
