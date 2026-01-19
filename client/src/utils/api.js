
/**
 * Utility to get cookie value by name
 */
export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

/**
 * Standardized fetch wrapper that includes CSRF token
 */
export const apiFetch = async (url, options = {}) => {
    const method = options.method || 'GET';

    // Only add CSRF for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
        const csrfToken = getCookie('csrf_token');

        if (csrfToken) {
            options.headers = {
                ...options.headers,
                'X-CSRFToken': csrfToken,
            };
        }
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
        // Handle unauthorized - maybe redirect to login or refresh token
        window.location.href = '/login';
    }

    return response;
};
