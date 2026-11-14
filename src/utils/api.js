const originalFetch = window.fetch;

// Endpoints where a 401/403 means "bad credentials", NOT "session expired"
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/change-password', // 401 here = "current password incorrect", not session expiry
];

window.fetch = async function(url, options = {}) {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const modifiedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await originalFetch(url, modifiedOptions);

  console.log(`API Call: ${url} - Status: ${response.status}`);

  const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
  const isPublic = PUBLIC_ENDPOINTS.some(p => urlStr.includes(p));

  // Only auto-logout on 401/403 for AUTHENTICATED endpoints
  if ((response.status === 401 || response.status === 403) && !isPublic) {
    
    // Clone the response so we can read the backend's message without consuming the body
    const clonedRes = response.clone();
    let errorMessage = '';
    try {
      const data = await clonedRes.json();
      errorMessage = data.message || '';
    } catch (e) {
      // Ignore if response body isn't valid JSON
    }

    // ONLY clear the session if the token is actually bad/expired
    const isTokenError = errorMessage === 'Invalid or expired token.' || 
                         errorMessage === 'Access denied. No token provided.';

    if (isTokenError) {
      console.log('Token expired! Clearing session.');
      sessionStorage.clear();
      localStorage.clear();
      window.dispatchEvent(new CustomEvent('sessionExpired'));
      throw new Error('Session expired');
    }
    
    // If it's a role permission issue (e.g., Faculty hitting Admin route), 
    // we do NOT clear the session. We let the response fall through so the 
    // specific component (like ADashboard.js) can catch the 403 and show an error.
  }

  return response;
};

export default window.fetch;