const apiFetch = async (url, options = {}) => {
  const token = sessionStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
  
  if (response.status === 401 || response.status === 403) {
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('sessionExpired'));
    throw new Error('Session expired');
  }
  
  return response;
};

export default apiFetch;