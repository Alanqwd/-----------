import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

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
};