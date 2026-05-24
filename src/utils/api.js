const originalFetch = window.fetch;

window.fetch = async function(url, options = {}) {
  const token = sessionStorage.getItem('token');
  
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
  
  if (response.status === 401 || response.status === 403) {
    console.log('Token expired! Clearing session.');
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('sessionExpired'));
    throw new Error('Session expired');
  }
  
  return response;
};

export default window.fetch;