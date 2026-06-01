class ApiError extends Error {
  constructor(mensaje, status, data) {
    super(mensaje);
    this.status = status;
    this.data = data;
  }
}

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('gilih_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      Auth.logout();
    }
    throw new ApiError(data.mensaje || 'Error en la petición', response.status, data);
  }

  return data;
}

const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body || {}) }),
};
