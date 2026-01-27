/**
 * Authentication context provider.
 * 
 * Manages auth state, session validation, and cross-subdomain token sync.
 * Uses authApi service for all API calls with proper TypeScript types.
 * Listens for session expiry events from API layer for global 401 handling.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthStatus } from '../types';
import { setAuthToken, getAuthToken, SESSION_EXPIRED_EVENT } from '../utils/api';
import { mapUserFromApi } from '../utils/mappers';
import { getSubdomain, isOnMainDomain } from '../utils/subdomain';
import * as authApi from '../services/authApi';
import { useToast } from './ToastContext';


// =============================================================================
// Types
// =============================================================================

type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  companyName?: string;
  company_name?: string;
  url?: string;
  companyUrl?: string;
  company_url?: string;
  country: string;
  phone: string;
  isInvitation?: boolean;
  is_invitation?: boolean;
}

interface CompleteProfileData {
  companyName: string;
  companyUrl: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (token: string) => Promise<{ needsProfileCompletion: boolean }>;
  completeOAuthProfile: (data: CompleteProfileData) => Promise<void>;
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
  // Session expiry handling
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'auth_user',
  PENDING_EMAIL: 'active_pending_email',
  PENDING_RESET: 'photmo_pending_reset_v1',
  RESET_STEP: 'photmo_reset_step_v1',
  OAUTH_PROFILE_PENDING: 'photmo_oauth_profile_pending_v1',
} as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Clear all auth-related state from localStorage.
 * Used when logging out or when token is invalidated.
 */
function clearLocalAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.PENDING_RESET);
  localStorage.removeItem(STORAGE_KEYS.RESET_STEP);
  localStorage.removeItem(STORAGE_KEYS.OAUTH_PROFILE_PENDING);
}

/**
 * Load user from localStorage on initial render.
 */
function loadStoredUser(): User | null {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

/**
 * Load pending reset email from localStorage.
 */
function loadStoredResetEmail(): string | null {
  try {
    const pending = localStorage.getItem(STORAGE_KEYS.PENDING_RESET);
    return pending ? JSON.parse(pending).email : null;
  } catch {
    return null;
  }
}

// =============================================================================
// Provider
// =============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const { success, error: toastError } = useToast();
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [pendingUserEmail, setPendingUserEmail] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL)
  );
  const [resetEmail, setResetEmail] = useState<string | null>(loadStoredResetEmail);
  const [resetStep, setResetStepState] = useState<ResetStep>(() =>
    (localStorage.getItem(STORAGE_KEYS.RESET_STEP) as ResetStep) || 'EMAIL'
  );
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState<boolean>(() =>
    localStorage.getItem(STORAGE_KEYS.OAUTH_PROFILE_PENDING) === 'true'
  );
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  /**
   * Clear session expired flag (after user acknowledges or navigates to login)
   */
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  /**
   * Clear all auth state (memory + localStorage).
   */
  const clearAllAuthState = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    clearLocalAuthStorage();
    setPendingUserEmail(null);
    setResetEmail(null);
    setResetStepState('EMAIL');
    setNeedsProfileCompletion(false);
    setStatus(AuthStatus.IDLE);
  }, []);

  // Listen for session expiry events from API layer (401 responses)
  useEffect(() => {
    const handleSessionExpired = () => {
      // Only show session expired if user was previously logged in
      if (user) {
        setSessionExpired(true);
        clearAllAuthState();
        toastError('Your session has expired. Please log in again.');
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [user, clearAllAuthState]);

  const setResetStep = useCallback((step: ResetStep) => {
    setResetStepState(step);
    localStorage.setItem(STORAGE_KEYS.RESET_STEP, step);
  }, []);

  const login = useCallback(async (data: LoginData) => {
    setStatus(AuthStatus.LOADING);
    try {
      const currentSubdomain = getSubdomain();
      const resp = await authApi.login({
        email: data.email,
        password: data.password,
        subdomain: currentSubdomain,
      });

      if (resp?.token) setAuthToken(resp.token);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        if (resp.isOwner !== undefined) {
          mappedUser.isOwner = resp.isOwner;
        }
        setUser(mappedUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mappedUser));
      }

      // Handle redirect after login
      if (resp?.subdomain && isOnMainDomain()) {
        setStatus(AuthStatus.SUCCESS);
        const protocol = window.location.protocol;
        window.location.href = `${protocol}//${resp.subdomain}.fotoshareai.com/#/workspaces`;
        return;
      }

      setStatus(AuthStatus.SUCCESS);
      success('Logged in successfully');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Invalid email or password');
      throw err;
    }
  }, [success, toastError]);

  const googleLogin = useCallback(async (token: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      const resp = await authApi.googleLogin({ token });
      if (resp?.token) setAuthToken(resp.token);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mappedUser));
      }
      const pending = !!resp?.needs_profile_completion;
      setNeedsProfileCompletion(pending);
      if (pending) {
        localStorage.setItem(STORAGE_KEYS.OAUTH_PROFILE_PENDING, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.OAUTH_PROFILE_PENDING);
      }
      setStatus(AuthStatus.SUCCESS);
      success('Logged in with Google');
      return { needsProfileCompletion: pending };
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Google sign-in failed');
      throw err;
    }
  }, [success, toastError]);

  const completeOAuthProfile = useCallback(async (data: CompleteProfileData) => {
    setStatus(AuthStatus.LOADING);
    try {
      const resp = await authApi.completeOAuthProfile({
        company_name: data.companyName,
        company_url: data.companyUrl,
        phone: data.phone,
      });
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mappedUser));
      }
      setNeedsProfileCompletion(false);
      localStorage.removeItem(STORAGE_KEYS.OAUTH_PROFILE_PENDING);
      setStatus(AuthStatus.SUCCESS);
      success('Profile updated successfully');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Failed to update profile');
      throw err;
    }
  }, [success, toastError]);

  const setOauthPassword = useCallback(async (password: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      await authApi.setPassword({ password });
      setStatus(AuthStatus.SUCCESS);
      success('Password set successfully');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Failed to set password');
      throw err;
    }
  }, [success, toastError]);

  const register = useCallback(async (data: RegisterData) => {
    setStatus(AuthStatus.LOADING);
    try {
      const payload: authApi.SignupRequest = {
        email: data.email,
        first_name: data.firstName ?? data.first_name ?? '',
        last_name: data.lastName ?? data.last_name ?? '',
        password: data.password,
        company_name: data.companyName ?? data.company_name ?? '',
        company_url: data.url ?? data.companyUrl ?? data.company_url ?? '',
        country: data.country,
        phone: data.phone,
        is_invitation: data.isInvitation ?? data.is_invitation ?? false,
      };
      await authApi.signup(payload);
      setPendingUserEmail(data.email);
      localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, data.email);
      setStatus(AuthStatus.SUCCESS);
      success('Registration successful! Please check your email for OTP.');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Registration failed');
      throw err;
    }
  }, [success, toastError]);

  const updateUserProfile = useCallback((data: Partial<User>) => {
    setUser(prev => {
      const updated = { ...(prev || {}) } as User;
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          (updated as unknown as Record<string, unknown>)[key] = value;
        }
      });
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      if (!pendingUserEmail) throw new Error('No registration in progress for this email.');
      const resp = await authApi.verifyOtp({ email: pendingUserEmail, otp });
      if (resp?.token) setAuthToken(resp.token);
      if (resp?.user) {
        const mappedUser = mapUserFromApi(resp.user);
        setUser(mappedUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mappedUser));
      }
      setPendingUserEmail(null);
      localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
      setStatus(AuthStatus.SUCCESS);
      success('Email verified successfully');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Verification failed');
      throw err;
    }
  }, [pendingUserEmail, success, toastError]);

  const resendOtp = useCallback(async () => {
    if (!pendingUserEmail) throw new Error('No active email for verification.');
    try {
      await authApi.resendOtp({ email: pendingUserEmail });
      success('Verification code resent');
    } catch (err: any) {
      toastError(err?.message || 'Failed to resend OTP');
      throw err;
    }
  }, [pendingUserEmail, success, toastError]);

  // Forgot Password Logic
  const forgotPasswordSendOtp = useCallback(async (email: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      await authApi.forgotPassword({ email });
      localStorage.setItem(STORAGE_KEYS.PENDING_RESET, JSON.stringify({ email }));
      setResetEmail(email);
      setResetStep('OTP');
      setStatus(AuthStatus.SUCCESS);
      success('Reset code sent to your email');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Failed to send reset code');
      throw err;
    }
  }, [setResetStep, success, toastError]);

  const verifyResetOtp = useCallback(async (otp: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_RESET);
      if (!stored) throw new Error('Reset session expired.');
      const data = JSON.parse(stored);
      const resp = await authApi.verifyResetOtp({ email: data.email, otp });
      localStorage.setItem(STORAGE_KEYS.PENDING_RESET, JSON.stringify({
        email: data.email,
        reset_token: resp.reset_token
      }));
      setResetStep('PASSWORD');
      setStatus(AuthStatus.SUCCESS);
      success('OTP verified');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'OTP verification failed');
      throw err;
    }
  }, [setResetStep, success, toastError]);

  const resetPassword = useCallback(async (newPassword: string) => {
    setStatus(AuthStatus.LOADING);
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_RESET);
      if (!stored) throw new Error('Reset session expired.');
      const { email, reset_token } = JSON.parse(stored);
      await authApi.resetPassword({ email, new_password: newPassword, reset_token });
      localStorage.removeItem(STORAGE_KEYS.PENDING_RESET);
      localStorage.removeItem(STORAGE_KEYS.RESET_STEP);
      setResetEmail(null);
      setResetStepState('EMAIL');
      setStatus(AuthStatus.SUCCESS);
      success('Password reset successfully');
    } catch (err: any) {
      setStatus(AuthStatus.ERROR);
      toastError(err?.message || 'Failed to reset password');
      throw err;
    }
  }, [success, toastError]);

  const logout = useCallback(async () => {
    // First, call backend to revoke the session
    await authApi.logout();
    // Clear all local state
    clearAllAuthState();
  }, [clearAllAuthState]);

  // Validate token on mount and when user navigates to this page
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      // No token - ensure we're logged out
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return;
    }

    setStatus(AuthStatus.LOADING);
    authApi.getCurrentUser()
      .then((resp) => {
        if (resp) {
          const mappedUser = mapUserFromApi(resp);
          setUser(mappedUser);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mappedUser));
        }
        setStatus(AuthStatus.SUCCESS);
      })
      .catch(() => {
        // Token is invalid (revoked or expired) - clear everything
        clearAllAuthState();
        setStatus(AuthStatus.ERROR);
      });
  }, [clearAllAuthState]);

  // Cross-subdomain token validation polling
  // Since localStorage doesn't sync across subdomains, we poll the cookie
  // This detects when user logs out from another subdomain
  useEffect(() => {
    let lastToken = getAuthToken();

    const checkTokenChange = () => {
      const currentToken = getAuthToken();

      // Token was removed (logout from another subdomain)
      if (lastToken && !currentToken) {
        clearAllAuthState();
      }
      // Token was added (login from another subdomain)
      else if (!lastToken && currentToken && !user) {
        // Validate the new token
        authApi.getCurrentUser()
          .then((resp) => {
            if (resp) {
              const mappedUser = mapUserFromApi(resp);
              setUser(mappedUser);
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mappedUser));
            }
            setStatus(AuthStatus.SUCCESS);
          })
          .catch(() => {
            setAuthToken(null);
            setStatus(AuthStatus.IDLE);
          });
      }

      lastToken = currentToken;
    };

    // Poll every 2 seconds for cross-subdomain changes
    const interval = setInterval(checkTokenChange, 2000);

    return () => clearInterval(interval);
  }, [user, clearAllAuthState]);

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
        needsProfileCompletion,
        sessionExpired,
        clearSessionExpired,
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
