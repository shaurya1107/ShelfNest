const API_BASE = '/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('shelfnest_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeaders() {
  const headers = {};
  const token = localStorage.getItem('shelfnest_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: getHeaders(),
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (data) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const getMe = () => request('/auth/me');

export const updateProfile = (data) =>
  request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });

export const getUser = (id) => request(`/auth/user/${id}`);

// Items
export const getItems = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/items${qs ? '?' + qs : ''}`);
};

export const getMyItems = () => request('/items/mine');

export const getItem = (id) => request(`/items/${id}`);

export const createItem = (data) =>
  request('/items', { method: 'POST', body: JSON.stringify(data) });

export const updateItem = (id, data) =>
  request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteItem = (id) =>
  request(`/items/${id}`, { method: 'DELETE' });

// Bookings
export const getBookings = (role = 'borrower') => request(`/bookings?role=${role}`);

export const createBooking = (data) =>
  request('/bookings', { method: 'POST', body: JSON.stringify(data) });

export const approveBooking = (id) =>
  request(`/bookings/${id}/approve`, { method: 'PUT' });

export const rejectBooking = (id) =>
  request(`/bookings/${id}/reject`, { method: 'PUT' });

export const activateBooking = (id, pickup_image_url) =>
  request(`/bookings/${id}/activate`, { method: 'PUT', body: JSON.stringify({ pickup_image_url }) });

export const completeBooking = (id, return_image_url) =>
  request(`/bookings/${id}/complete`, { method: 'PUT', body: JSON.stringify({ return_image_url }) });

export const cancelBooking = (id) =>
  request(`/bookings/${id}/cancel`, { method: 'PUT' });

// Reviews
export const createReview = (data) =>
  request('/reviews', { method: 'POST', body: JSON.stringify(data) });

export const getUserReviews = (userId) => request(`/reviews/user/${userId}`);

// Upload
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
};
