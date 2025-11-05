// src/services/api.js

const API_URL = 'https://foundit-full-stack.onrender.com';

// --- Helper to get the auth token from localStorage ---
const getToken = () => localStorage.getItem('userToken');

// --- Helper for authenticated fetch requests ---
const authFetch = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Exponential backoff retry logic
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Try to parse the response body, even if an error status
            const contentType = response.headers.get("content-type");
            const data = contentType && contentType.includes("application/json") 
                ? await response.json() 
                : { message: response.statusText || `Request failed with status ${response.status}` };

            if (!response.ok) {
                // If it's a 401/403 and not the final retry, throw error to trigger retry.
                // If it's a non-retryable error (e.g., 400, 404), break loop or just let it fail.
                throw new Error(data.message || `API Error: ${response.status}`);
            }
            return data;
        } catch (error) {
            lastError = error;
            if (i < MAX_RETRIES - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // After all retries fail
    throw new Error(lastError.message || 'Request failed after multiple retries.');
};

// --- AUTH SERVICE (Replaces Firebase Auth) ---
const apiAuth = {
    login: async (email, password) => {
        const result = await authFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('userToken', result.token);
        return result;
    },
    
    register: async (email, password, name) => {
        const result = await authFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name })
        });
        localStorage.setItem('userToken', result.token);
        return result;
    },

    adminLogin: async (email, password) => {
        const result = await authFetch('/api/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('userToken', result.token);
        localStorage.setItem('adminSession', 'true');
        localStorage.setItem('adminEmail', result.email);
        return result;
    },

    getCurrentUser: () => {
        if (!getToken()) return Promise.resolve(null);
        return authFetch('/api/auth/me').catch(err => {
            console.error('Token validation failed, logging out:', err);
            apiAuth.logout();
            return null;
        });
    },

    logout: () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminEmail');
        return Promise.resolve();
    }
};


// --- DB/DATA SERVICE (Replaces Firestore) ---
const apiDb = {
    // User/Profile Operations
    getUserProfile: () => authFetch('/api/users/profile'),
    
    updateUserProfile: (profileData) => authFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    }),
    
    // Item Operations
    addItem: (itemData) => authFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(itemData)
    }),

    getMyItems: () => authFetch('/api/items/my'),

    getPublicItems: () => authFetch('/api/items/public'),

    deleteItem: (itemId) => authFetch(`/api/items/${itemId}`, { 
        method: 'DELETE' 
    }),

    // Admin Operations
    getAllItems: () => authFetch('/api/items'),
    
    getAllUsers: () => authFetch('/api/users'),
    
    // Chat Operations
    startChat: (data) => authFetch('/api/chats/start', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    getChatDetails: (chatId) => authFetch(`/api/chats/${chatId}`), 

    updateChatStatus: (chatId, action, reason = null) => authFetch(`/api/chats/${chatId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ action, reason })
    }),

    sendMessage: (chatId, text, senderEmail) => authFetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, senderEmail })
    }),
    
    // Report Operations (Admin only)
    getAllReports: async () => {
        try {
            const response = await authFetch('/api/chats/reports');
            return response;
        } catch (error) {
            console.error('Get All Reports Error:', error);
            throw error;
        }
    },

    processReport: async (reportId, action, data) => {
        try {
            const response = await authFetch(`/api/chats/reports/${reportId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    action,
                    ...data
                })
            });
            return response;
        } catch (error) {
            console.error('Process Report Error:', error);
            throw error;
        }
    },
};


export { apiAuth, apiDb };
