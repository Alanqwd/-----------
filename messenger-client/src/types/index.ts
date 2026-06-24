export interface User {
  userId: number;
  username: string;
  avatarUrl?: string;
  bio?: string;
  sessionToken?: string; 
}
export interface ChatRoom {
  id: number;
  name: string;
  accessCode: string;
  unreadCount: number;
  avatarUrl?: string; 
  description?: string; 
}

export interface Message {
  id: number;
  content: string;
  imageUrl?: string;
  sentAt: string;
  senderName: string;
  stickerUrl?: string; 
  senderAvatar?: string;
  senderId: number;
}


export interface ChatMember {
  userId: number;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
}
export interface Sticker {
  id: number;
  stickerPackId: number;
  imageUrl: string;
  emoji?: string | null;
}

export interface StickerPack {
  id: number;
  name: string;
  coverUrl: string;
  stickers: Sticker[];
}