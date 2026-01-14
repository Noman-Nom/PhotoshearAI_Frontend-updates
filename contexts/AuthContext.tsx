
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthStatus } from '../types';
import { api, setAuthToken, getAuthToken } from '../utils/api';
import { mapUserFromApi } from '../utils/mappers';
import { getSubdomain, redirectToSubdomain, isOnMainDomain } from '../utils/subdomain';

type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (token: string) => Promise<{ needsProfileCompletion: boolean }>;
  completeOAuthProfile: (data: { companyName: string; companyUrl: string; phone: string }) => Promise<void>;
  setOauthPassword: (password: string) => Promise<void>;
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
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const CURRENT_USER_KEY = 'auth_user';
const ACTIVE_PENDING_EMAIL_KEY = 'active_pending_email';
const PENDING_RESET_KEY = 'photmo_pending_reset_v1';
const RESET_STEP_KEY = 'photmo_reset_step_v1';
const OAUTH_PROFILE_PENDING_KEY = 'photmo_oauth_profile_pending_v1';

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
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState<boolean>(() => {
    return localStorage.getItem(OAUTH_PROFILE_PENDING_KEY) === 'true';
  });

  const setResetStep = useCallback((step: ResetStep) => {
    setResetStepState(step);
    localStorage.setItem(RESET_STEP_KEY, step);
  }, []);

  const login = useCallback(async (data: any) => {
    setStatus(AuthStatus.LOADING);
    try {
      // Extract subdomain from current URL
      const currentSubdomain = getSubdomain();
      
      // Add subdomain to login request
      const loginData = {
        ...data,
        subdomain: currentSubdomain
      };
      
      const resp = await api.post('/api/v1/auth/login', loginData, false);
      if (resp?.token) setAuthToken(resp.token);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
        
        // Store isOwner flag in user object
        if (resp.isOwner !== undefined) {
          mappedUser.isOwner = resp.isOwner;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
        }
      }
      
      // Handle redirect after login
      if (resp?.subdomain) {
        // If logged in from app.fotoshareai.com, redirect to user's org subdomain with workspaces route
        if (isOnMainDomain()) {
          setStatus(AuthStatus.SUCCESS);
          // Redirect to subdomain with workspaces route
          const protocol = window.location.protocol;
          window.location.href = `${protocol}//${resp.subdomain}.fotoshareai.com/#/workspaces`;
          return; // Stop execution, redirect will happen
        }
        // If on specific subdomain, stay there (no redirect needed)
      }
      
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, []);

  const googleLogin = useCallback(async (token: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      const resp = await api.post('/api/v1/auth/google/login', { token }, false);
      if (resp?.token) setAuthToken(resp.token);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      }
      const pending = !!resp?.needs_profile_completion;
      setNeedsProfileCompletion(pending);
      if (pending) {
        localStorage.setItem(OAUTH_PROFILE_PENDING_KEY, 'true');
      } else {
        localStorage.removeItem(OAUTH_PROFILE_PENDING_KEY);
      }
      setStatus(AuthStatus.SUCCESS);
      return { needsProfileCompletion: pending };
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, []);

  const completeOAuthProfile = useCallback(async (data: { companyName: string; companyUrl: string; phone: string }) => {
    setStatus(AuthStatus.LOADING);
    try {
      const resp = await api.post('/api/v1/auth/complete-profile', {
        company_name: data.companyName,
        company_url: data.companyUrl,
        phone: data.phone
      }, true);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      }
      setNeedsProfileCompletion(false);
      localStorage.removeItem(OAUTH_PROFILE_PENDING_KEY);
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, []);

  const setOauthPassword = useCallback(async (password: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      await api.post('/api/v1/auth/set-password', { password }, true);
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, []);

  const register = useCallback(async (data: any) => {
    setStatus(AuthStatus.LOADING);
    try {
      const payload = {
        email: data.email,
        first_name: data.firstName ?? data.first_name,
        last_name: data.lastName ?? data.last_name,
        password: data.password,
        company_name: data.companyName ?? data.company_name,
        company_url: data.url ?? data.companyUrl ?? data.company_url,
        country: data.country,
        phone: data.phone,
        is_invitation: data.isInvitation ?? data.is_invitation ?? false
      };
      await api.post('/api/v1/auth/signup', payload, false);
      setPendingUserEmail(data.email);
      localStorage.setItem(ACTIVE_PENDING_EMAIL_KEY, data.email);
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, []);

  const updateUserProfile = useCallback((data: Partial<User>) => {
    setUser(prev => {
      const updated = { ...(prev || {}) } as User;
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          (updated as any)[key] = value;
        }
      });
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      if (!pendingUserEmail) throw new Error('No registration in progress for this email.');
      const resp = await api.post('/api/v1/auth/verify-otp', { email: pendingUserEmail, otp }, false);
      if (resp?.token) setAuthToken(resp.token);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      }
      setPendingUserEmail(null);
      localStorage.removeItem(ACTIVE_PENDING_EMAIL_KEY);
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, [pendingUserEmail]);

  const resendOtp = useCallback(async () => {
    if (!pendingUserEmail) throw new Error('No active email for verification.');
    await api.post('/api/v1/auth/resend-otp', { email: pendingUserEmail }, false);
  }, [pendingUserEmail]);

  // Forgot Password Logic
  const forgotPasswordSendOtp = useCallback(async (email: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      await api.post('/api/v1/auth/forgot-password', { email }, false);
      localStorage.setItem(PENDING_RESET_KEY, JSON.stringify({ email }));
      setResetEmail(email);
      setResetStep('OTP');
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, [setResetStep]);

  const verifyResetOtp = useCallback(async (otp: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      const stored = localStorage.getItem(PENDING_RESET_KEY);
      if (!stored) throw new Error('Reset session expired.');
      const data = JSON.parse(stored);
      const resp = await api.post('/api/v1/auth/verify-reset-otp', { email: data.email, otp }, false);
      localStorage.setItem(PENDING_RESET_KEY, JSON.stringify({ email: data.email, reset_token: resp.reset_token }));
      setResetStep('PASSWORD');
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, [setResetStep]);

  const resetPassword = useCallback(async (newPassword: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      const stored = localStorage.getItem(PENDING_RESET_KEY);
      if (!stored) throw new Error('Reset session expired.');
      const { email, reset_token } = JSON.parse(stored);
      await api.post('/api/v1/auth/reset-password', { email, new_password: newPassword, reset_token }, false);
      localStorage.removeItem(PENDING_RESET_KEY);
      localStorage.removeItem(RESET_STEP_KEY);
      setResetEmail(null);
      setResetStepState('EMAIL');
      setStatus(AuthStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    api.post('/api/v1/auth/logout', undefined, true).catch(() => undefined);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(ACTIVE_PENDING_EMAIL_KEY);
    localStorage.removeItem(PENDING_RESET_KEY);
    localStorage.removeItem(RESET_STEP_KEY);
    localStorage.removeItem(OAUTH_PROFILE_PENDING_KEY);
    setPendingUserEmail(null);
    setResetEmail(null);
    setResetStepState('EMAIL');
    setNeedsProfileCompletion(false);
    setStatus(AuthStatus.IDLE);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    setStatus(AuthStatus.LOADING);
    api.get('/api/v1/auth/me', true)
      .then((resp) => {
        if (resp) {
          const mappedUser = mapUserFromApi(resp);
          setUser(mappedUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
        }
        setStatus(AuthStatus.SUCCESS);
      })
      .catch(() => {
        setAuthToken(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        setUser(null);
        localStorage.removeItem(OAUTH_PROFILE_PENDING_KEY);
        setNeedsProfileCompletion(false);
        setStatus(AuthStatus.ERROR);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        googleLogin,
        completeOAuthProfile,
        setOauthPassword,
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
        resetStep,
        needsProfileCompletion
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
