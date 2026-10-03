const originalFetch = window.fetch;

// Endpoints where a 401/403 means "bad credentials", NOT "session expired"
const PUBLIC_ENDPOINTS = [
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
    console.log('Token expired! Clearing session.');
    sessionStorage.clear();
localStorage.clear();
    localStorage.clear();
    window.dispatchEvent(new CustomEvent('sessionExpired'));
    throw new Error('Session expired');
  }

  // For public endpoints, pass the response through untouched
  return response;
};

export default window.fetch;