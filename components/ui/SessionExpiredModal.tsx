/**
 * SessionExpiredModal - Shows when the user's session has expired.
 * 
 * Appears when a 401 response is received from the API after user was logged in.
 * Provides clear messaging and a button to go to login.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface SessionExpiredModalProps {
    className?: string;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ className }) => {
    const navigate = useNavigate();
    const { sessionExpired, clearSessionExpired } = useAuth();

    const handleGoToLogin = () => {
        clearSessionExpired();
        navigate('/login?session_expired=true');
    };

    if (!sessionExpired) return null;

    return (
        <Modal
            isOpen={sessionExpired}
            onClose={handleGoToLogin}
            title=""
            className={cn('max-w-md', className)}
        >
            <div className="flex flex-col items-center text-center py-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Session Expired
                </h2>

                {/* Message */}
                <p className="text-slate-600 mb-6 max-w-sm">
                    Your session has expired for security reasons. Please sign in again to continue.
                </p>

                {/* Action Button */}
                <button
                    onClick={handleGoToLogin}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                    <LogIn size={18} />
                    Sign In
                </button>
            </div>
        </Modal>
    );
};

export default SessionExpiredModal;
