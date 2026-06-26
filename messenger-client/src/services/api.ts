console.log('🔵🔵🔵 ЗАГРУЖЕН  API.TS 🔵🔵🔵');
import axios from 'axios';
import type { StickerPack } from '../types';



const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

api.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('moon_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.sessionToken) {
        config.headers['Authorization'] = `Bearer ${user.sessionToken}`;
      }
    } catch (e) {
      console.error('Error parsing user from sessionStorage', e);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Сессия недействительна — выход');
      sessionStorage.removeItem('moon_user');
      window.dispatchEvent(new Event('session-expired'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/Auth/register', data),
  login: (data: any) => api.post('/Auth/login', data),
  updateProfile: (data: any) => api.put('/Auth/profile', data),
};

export const chatApi = {
  createChat: (data: any) => api.post('/chat/create', data),
  joinChat: (data: any) => api.post('/chat/join', data),
  getMyChats: (userId: number) => api.get(`/chat/my-chats/${userId}`),
  getMessages: (chatId: number) => api.get(`/chat/messages/${chatId}`),
  leaveChat: (data: { chatId: number; userId: number }) => api.post('/chat/leave', data),
  getChatMembers: (chatId: number) => api.get(`/chat/members/${chatId}`),
  updateChatInfo: (data: any) => api.put('/chat/update', data),
};

export const stickerApi = {
  getPacks: () => axios.get<StickerPack[]>('http://localhost:5000/api/stickers/packs'),  
  createPack: (data: { name: string; coverUrl: string }) => 
    axios.post('http://localhost:5000/api/stickers/packs', data),  
  addSticker: (data: { packId: number; imageUrl: string; emoji?: string }) => 
    axios.post('http://localhost:5000/api/stickers/stickers', data),  
  uploadSticker: (file: File) => fileApi.upload(file) 
};

export const fileApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const userStr = sessionStorage.getItem('moon_user');
    const token = userStr ? JSON.parse(userStr).sessionToken : '';

    const response = await fetch('http://localhost:5000/api/file/upload', {  
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('moon_user');
        window.dispatchEvent(new Event('session-expired'));
      }
      throw new Error('Upload failed');
    }
    const data = await response.json();
    return data;
  }
};