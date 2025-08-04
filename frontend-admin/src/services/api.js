import axios from 'axios';

// URL dasar dari backend API Anda. Sesuaikan jika perlu.
const API_URL = 'http://localhost/proyek-undangan/backend/api/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Penting untuk mengirim cookie session
});

// Interceptor untuk menangani response
api.interceptors.response.use(
  response => response,
  error => {
    // Jika error adalah 401 (Unauthorized), redirect ke halaman login
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('isAuthenticated');
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

// Fungsi-fungsi untuk setiap endpoint

// Auth
export const login = (credentials) => api.post('/login', credentials);
export const logout = () => api.post('/logout');
export const checkSession = () => api.get('/check-session');

// Templates (TAMBAHKAN BLOK INI)
export const getTemplates = () => api.get('/templates');

// Invitations
export const getInvitations = () => api.get('/invitations');
export const getInvitationById = (id) => api.get(`/invitations/${id}`);
export const createInvitation = (data) => api.post('/invitations', data);
export const updateInvitation = (id, data) => api.put(`/invitations/${id}`, data);
export const deleteInvitation = (id) => api.delete(`/invitations/${id}`);

// Guests
export const getGuests = (invitationId) => api.get(`/guests/${invitationId}`);
export const addGuest = (data) => api.post('/guests', data);
export const deleteGuest = (invitationId, guestId) => api.delete(`/guests/${invitationId}/${guestId}`);
export const importGuests = (invitationId, guestList) => {
  // Endpoint ini akan kita pastikan benar di router.php
  return api.post(`/guests/import`, { 
    invitation_id: invitationId,
    guests: guestList // Kirim sebagai array 'guests'
  });
};


// RSVPs
export const getRsvps = (invitationId) => api.get(`/rsvps/${invitationId}`);
export const exportRsvps = (invitationId, format) => api.get(`/rsvps/${invitationId}/export?format=${format}`, { responseType: 'blob' });

// Upload
export const uploadFile = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export default api;