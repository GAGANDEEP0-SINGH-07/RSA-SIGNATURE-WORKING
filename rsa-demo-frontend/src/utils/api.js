/**
 * Centralized API URL management for the frontend.
 * Ensures URLs are consistent and valid across different environments.
 */

const getApiBase = () => {
    // Default to localhost if environment variable is missing
    let base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    
    // Remove trailing slash if present to avoid dual-slashes
    base = base.replace(/\/$/, '');
    
    // Ensure the /api suffix exists
    if (!base.endsWith('/api')) {
        base += '/api';
    }
    
    return base;
};

export const API_BASE = getApiBase();

/**
 * Derives the Socket.io base URL from the API base URL.
 * Example: https://backend.com/api -> https://backend.com
 */
export const SOCKET_BASE = API_BASE.replace(/\/api$/, '');
