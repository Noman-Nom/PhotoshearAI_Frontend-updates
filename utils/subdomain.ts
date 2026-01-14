/**
 * Utility functions for handling subdomains in multi-organization architecture
 */

/**
 * Extract subdomain from current URL
 * @returns subdomain string or null if on main domain
 * 
 * Examples:
 * - app.fotoshareai.com → null
 * - acme.fotoshareai.com → "acme"
 * - localhost:5173 → null
 */
export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Development: localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Main domain
  if (hostname === 'app.fotoshareai.com' || hostname === 'fotoshareai.com') {
    return null;
  }
  
  // Extract subdomain from *.fotoshareai.com
  if (hostname.endsWith('.fotoshareai.com')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // First part is the subdomain
    }
  }
  
  return null;
}

/**
 * Redirect to a specific organization's subdomain
 * @param subdomain - Organization subdomain to redirect to
 */
export function redirectToSubdomain(subdomain: string): void {
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Development: use localhost with subdomain query param
  if (window.location.hostname === 'localhost') {
    // For development, we can't use real subdomains, so redirect to home
    window.location.href = `${protocol}//localhost:${port}`;
    return;
  }
  
  // Production: redirect to actual subdomain
  window.location.href = `https://${subdomain}.fotoshareai.com`;
}

/**
 * Check if current URL is on a specific subdomain
 * @param subdomain - Subdomain to check
 * @returns true if on specified subdomain
 */
export function isOnSubdomain(subdomain: string): boolean {
  return getSubdomain() === subdomain;
}

/**
 * Check if on main domain (app.fotoshareai.com or localhost)
 * @returns true if on main domain
 */
export function isOnMainDomain(): boolean {
  return getSubdomain() === null;
}

/**
 * Get base API URL based on current subdomain
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
  // Always use the same backend API regardless of subdomain
  // The backend will determine org context from JWT token
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
}
