import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
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
    leaveChat: (data: { chatId: number; userId: number }) => api.post('/chat/leave', data),
  getChatMembers: (chatId: number) => api.get(`/chat/members/${chatId}`), 
  updateChatInfo: (data: any) => api.put('/chat/update', data), 
};

export const fileApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:5001/api/file/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data; 
  }
};