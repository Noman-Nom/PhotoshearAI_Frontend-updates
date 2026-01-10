
import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, AuthStatus } from '../types';
import { addSimulatedEmail } from '../constants';

type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
  verifyOtp: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  // Forgot Password Flow
  forgotPasswordSendOtp: (email: string) => Promise<void>;
  verifyResetOtp: (otp: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  setResetStep: (step: ResetStep) => void;
  logout: () => void;
  isAuthenticated: boolean;
  pendingUserEmail: string | null;
  resetEmail: string | null;
  resetStep: ResetStep;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USERS_STORAGE_KEY = 'photmo_registered_users_v1';
const PENDING_USERS_KEY = 'photmo_pending_users_v1';
const CURRENT_USER_KEY = 'auth_user';
const ACTIVE_PENDING_EMAIL_KEY = 'active_pending_email';
const PENDING_RESET_KEY = 'photmo_pending_reset_v1';
const RESET_STEP_KEY = 'photmo_reset_step_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [pendingUserEmail, setPendingUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_PENDING_EMAIL_KEY);
  });

  const [resetEmail, setResetEmail] = useState<string | null>(() => {
    try {
      const pending = localStorage.getItem(PENDING_RESET_KEY);
      return pending ? JSON.parse(pending).email : null;
    } catch (e) {
      return null;
    }
  });

  const [resetStep, setResetStepState] = useState<ResetStep>(() => {
    return (localStorage.getItem(RESET_STEP_KEY) as ResetStep) || 'EMAIL';
  });

  const setResetStep = useCallback((step: ResetStep) => {
    setResetStepState(step);
    localStorage.setItem(RESET_STEP_KEY, step);
  }, []);

  const getStoredUsers = (): any[] => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      
      // Ensure the requested dummy user is always available
      const dummyCredentials = {
        id: 'danish_1',
        email: 'Danish@yopmail.com',
        password: 'Danish12@',
        firstName: 'Danish',
        lastName: 'Mukhtar',
        companyName: 'Photmo Inc.',
        companyUrl: 'photmo'
      };

      if (!parsed.some((u: any) => u.email === dummyCredentials.email)) {
        return [dummyCredentials, ...parsed];
      }
      
      return parsed;
    } catch (e) {
      return [];
    }
  };

  const getPendingUsers = (): any[] => {
    try {
      const stored = localStorage.getItem(PENDING_USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const login = useCallback(async (data: any) => {
    setStatus(AuthStatus.LOADING);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const users = getStoredUsers();
        const pendingUsers = getPendingUsers();
        
        const foundUser = users.find(u => u.email === data.email && u.password === data.password);
        if (foundUser) {
          const { password, ...userProfile } = foundUser;
          setUser(userProfile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
          setStatus(AuthStatus.SUCCESS);
          resolve();
          return;
        }

        const foundPending = pendingUsers.find(u => u.email === data.email && u.password === data.password);
        if (foundPending) {
          setPendingUserEmail(foundPending.email);
          localStorage.setItem(ACTIVE_PENDING_EMAIL_KEY, foundPending.email);
          setStatus(AuthStatus.IDLE);
          reject(new Error('VERIFICATION_REQUIRED'));
          return;
        }

        setStatus(AuthStatus.ERROR);
        reject(new Error('Invalid credentials. Please register first.'));
      }, 1000);
    });
  }, []);

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const register = useCallback(async (data: any) => {
    setStatus(AuthStatus.LOADING);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const users = getStoredUsers();
        const pendingUsers = getPendingUsers();
        
        if (users.some(u => u.email === data.email) || pendingUsers.some(u => u.email === data.email)) {
          setStatus(AuthStatus.ERROR);
          reject(new Error('User already exists or is awaiting verification.'));
          return;
        }

        const otp = generateOtp();
        const newPendingUser = {
          ...data,
          otp,
          expiry: Date.now() + 10 * 60 * 1000 
        };

        const updatedPending = [...pendingUsers, newPendingUser];
        localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(updatedPending));
        
        setPendingUserEmail(data.email);
        localStorage.setItem(ACTIVE_PENDING_EMAIL_KEY, data.email);

        // Bypassing OTP for invitations as they are already verified via the invitation link
        if (!data.isInvitation) {
          addSimulatedEmail({
            to: data.email,
            subject: 'Verify your email address',
            body: `Welcome to Photmo! Your verification code is: ${otp}. This code will expire in 10 minutes.`
          });
        }

        setStatus(AuthStatus.SUCCESS);
        resolve();
      }, 1000);
    });
  }, []);

  const updateUserProfile = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
      
      // Update in registered users list too
      const users = getStoredUsers();
      const updatedUsers = users.map(u => u.id === prev.id ? { ...u, ...data } : u);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      return updated;
    });
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    setStatus(AuthStatus.LOADING);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const pendingUsers = getPendingUsers();
        const userToVerifyIdx = pendingUsers.findIndex(u => u.email === pendingUserEmail);
        
        if (userToVerifyIdx === -1) {
          setStatus(AuthStatus.ERROR);
          reject(new Error('No registration in progress for this email.'));
          return;
        }

        const pendingData = pendingUsers[userToVerifyIdx];
        
        if (pendingData.otp === otp) {
          const users = getStoredUsers();
          const newUserProfile: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: pendingData.email,
            firstName: pendingData.firstName,
            lastName: pendingData.lastName,
            companyName: pendingData.companyName,
            companyUrl: pendingData.url
          };
          const newUserRecord = { ...newUserProfile, password: pendingData.password };
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUserRecord]));
          const remainingPending = pendingUsers.filter(u => u.email !== pendingUserEmail);
          localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(remainingPending));
          setUser(newUserProfile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUserProfile));
          setPendingUserEmail(null);
          localStorage.removeItem(ACTIVE_PENDING_EMAIL_KEY);
          setStatus(AuthStatus.SUCCESS);
          resolve();
        } else {
          setStatus(AuthStatus.ERROR);
          reject(new Error('Invalid verification code.'));
        }
      }, 1000);
    });
  }, [pendingUserEmail]);

  const resendOtp = useCallback(async () => {
    if (!pendingUserEmail) throw new Error('No active email for verification.');
    const pendingUsers = getPendingUsers();
    const userIdx = pendingUsers.findIndex(u => u.email === pendingUserEmail);
    if (userIdx === -1) throw new Error('Registration record not found.');
    const newOtp = generateOtp();
    pendingUsers[userIdx].otp = newOtp;
    localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(pendingUsers));
    addSimulatedEmail({
      to: pendingUserEmail,
      subject: 'New Verification Code',
      body: `Your new verification code is: ${newOtp}.`
    });
  }, [pendingUserEmail]);

  // Forgot Password Logic
  const forgotPasswordSendOtp = useCallback(async (email: string) => {
    setStatus(AuthStatus.LOADING);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const users = getStoredUsers();
        const userExists = users.find(u => u.email === email);
        if (!userExists) {
          setStatus(AuthStatus.ERROR);
          reject(new Error('No user found with this email address.'));
          return;
        }
        const otp = generateOtp();
        localStorage.setItem(PENDING_RESET_KEY, JSON.stringify({ email, otp }));
        setResetEmail(email);
        setResetStep('OTP');
        addSimulatedEmail({
          to: email,
          subject: 'Password Reset Verification Code',
          body: `Your password reset code is: ${otp}. If you did not request this, please ignore this email.`
        });
        setStatus(AuthStatus.SUCCESS);
        resolve();
      }, 1000);
    });
  }, [setResetStep]);

  const verifyResetOtp = useCallback(async (otp: string) => {
    setStatus(AuthStatus.LOADING);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const stored = localStorage.getItem(PENDING_RESET_KEY);
        if (!stored) {
          setStatus(AuthStatus.ERROR);
          reject(new Error('Reset session expired.'));
          return;
        }
        const data = JSON.parse(stored);
        if (data.otp === otp) {
          setResetStep('PASSWORD');
          setStatus(AuthStatus.SUCCESS);
          resolve();
        } else {
          setStatus(AuthStatus.ERROR);
          reject(new Error('Invalid reset code.'));
        }
      }, 1000);
    });
  }, [setResetStep]);

  const resetPassword = useCallback(async (newPassword: string) => {
    setStatus(AuthStatus.LOADING);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const stored = localStorage.getItem(PENDING_RESET_KEY);
        if (!stored) {
          setStatus(AuthStatus.ERROR);
          reject(new Error('Reset session expired.'));
          return;
        }
        const { email } = JSON.parse(stored);
        const users = getStoredUsers();
        const userIdx = users.findIndex(u => u.email === email);
        if (userIdx !== -1) {
          users[userIdx].password = newPassword;
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
          
          localStorage.removeItem(PENDING_RESET_KEY);
          localStorage.removeItem(RESET_STEP_KEY);
          setResetEmail(null);
          setResetStepState('EMAIL'); // Reset back to start locally without trigger
          
          setStatus(AuthStatus.SUCCESS);
          resolve();
        } else {
          setStatus(AuthStatus.ERROR);
          reject(new Error('User record missing.'));
        }
      }, 1000);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(ACTIVE_PENDING_EMAIL_KEY);
    localStorage.removeItem(PENDING_RESET_KEY);
    localStorage.removeItem(RESET_STEP_KEY);
    setPendingUserEmail(null);
    setResetEmail(null);
    setResetStepState('EMAIL');
    setStatus(AuthStatus.IDLE);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        updateUserProfile,
        verifyOtp,
        resendOtp,
        forgotPasswordSendOtp,
        verifyResetOtp,
        resetPassword,
        setResetStep,
        logout,
        isAuthenticated: !!user,
        pendingUserEmail,
        resetEmail,
        resetStep
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
