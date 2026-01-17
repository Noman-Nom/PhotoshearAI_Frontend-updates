/**
 * Authentication API service.
 * 
 * Centralizes all auth-related API calls with proper TypeScript types.
 */
import { api, setAuthToken, getAuthToken, GOOGLE_CLIENT_ID } from '../utils/api';
import { User } from '../types';
import { mapUserFromApi } from '../utils/mappers';
import { getSubdomain } from '../utils/subdomain';

// =============================================================================
// Request Types
// =============================================================================

export interface LoginRequest {
    email: string;
    password: string;
    subdomain?: string | null;
}

export interface SignupRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    company_name: string;
    company_url: string;
    country: string;
    phone: string;
    is_invitation?: boolean;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResendOtpRequest {
    email: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyResetOtpRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    new_password: string;
    reset_token: string;
}

export interface GoogleLoginRequest {
    token: string;
}

export interface CompleteOAuthProfileRequest {
    company_name: string;
    company_url: string;
    phone: string;
}

export interface SetPasswordRequest {
    password: string;
}

// =============================================================================
// Response Types
// =============================================================================

export interface LoginResponse {
    user: any; // Raw API response, will be mapped to User
    token: string;
    subdomain: string;
    isOwner: boolean;
}

export interface SignupResponse {
    status: string;
    email: string;
}

export interface VerifyOtpResponse {
    user: any;
    token: string;
}

export interface GoogleLoginResponse {
    user: any;
    token: string;
    is_new_user: boolean;
    needs_profile_completion: boolean;
}

export interface CompleteOAuthProfileResponse {
    user: any;
}

export interface VerifyResetOtpResponse {
    status: string;
    reset_token: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Authenticate user with email and password.
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
    const subdomain = request.subdomain ?? getSubdomain();
    const payload = {
        email: request.email,
        password: request.password,
        subdomain,
    };
    return api.post('/api/v1/auth/login', payload, false);
}

/**
 * Register a new user account.
 */
export async function signup(request: SignupRequest): Promise<SignupResponse> {
    return api.post('/api/v1/auth/signup', request, false);
}

/**
 * Verify signup OTP.
 */
export async function verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return api.post('/api/v1/auth/verify-otp', request, false);
}

/**
 * Resend signup OTP.
 */
export async function resendOtp(request: ResendOtpRequest): Promise<void> {
    await api.post('/api/v1/auth/resend-otp', request, false);
}

/**
 * Request password reset OTP.
 */
export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await api.post('/api/v1/auth/forgot-password', request, false);
}

/**
 * Verify password reset OTP.
 */
export async function verifyResetOtp(request: VerifyResetOtpRequest): Promise<VerifyResetOtpResponse> {
    return api.post('/api/v1/auth/verify-reset-otp', request, false);
}

/**
 * Reset password with reset token.
 */
export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
    await api.post('/api/v1/auth/reset-password', request, false);
}

/**
 * Authenticate with Google OAuth.
 */
export async function googleLogin(request: GoogleLoginRequest): Promise<GoogleLoginResponse> {
    return api.post('/api/v1/auth/google/login', request, false);
}

/**
 * Complete OAuth profile.
 */
export async function completeOAuthProfile(request: CompleteOAuthProfileRequest): Promise<CompleteOAuthProfileResponse> {
    return api.post('/api/v1/auth/complete-profile', request, true);
}

/**
 * Set password for OAuth user.
 */
export async function setPassword(request: SetPasswordRequest): Promise<void> {
    await api.post('/api/v1/auth/set-password', request, true);
}

/**
 * Get current authenticated user info.
 */
export async function getCurrentUser(): Promise<any> {
    return api.get('/api/v1/auth/me', true);
}

/**
 * Logout current user.
 */
export async function logout(): Promise<void> {
    try {
        await api.post('/api/v1/auth/logout', undefined, true);
    } catch {
        // Ignore errors - we still want to clear local state
    }
}
