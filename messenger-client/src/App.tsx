import React, { useState, useEffect, useRef, useCallback } from 'react';
import { authApi, chatApi, fileApi } from './services/api';
import type { User, ChatRoom, Message, ChatMember, StickerPack } from './types';
import { HubConnectionBuilder, HttpTransportType, HubConnectionState, HubConnection } from '@microsoft/signalr';
import './App.css';


interface SignalRMessageDto {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  imageUrl?: string;
  stickerUrl?: string;
  sentAt: string;
}

interface JoinChatResponse {
  success: boolean;
  message: string;
  messages: SignalRMessageDto[];
}

interface SendMessageResponse {
  success: boolean;
  message: string;
  messageId?: number;
}


const DEFAULT_STICKER_PACKS: StickerPack[] = [
  {
    id: 1,
    name: 'Коты',
    coverUrl: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
    stickers: [
      { id: 1, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995574.png', emoji: '😺' },
      { id: 2, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995512.png', emoji: '😸' },
      { id: 3, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995515.png', emoji: '😹' },
      { id: 4, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995516.png', emoji: '😻' },
      { id: 5, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995518.png', emoji: '😼' },
      { id: 6, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995520.png', emoji: '😽' },
      { id: 7, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995522.png', emoji: '🙀' },
      { id: 8, stickerPackId: 1, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995524.png', emoji: '😿' },
    ]
  },
  {
    id: 2,
    name: 'Эмоции',
    coverUrl: 'https://cdn-icons-png.flaticon.com/512/4910/4910636.png',
    stickers: [
      { id: 9, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/4910/4910636.png', emoji: '❤️' },
      { id: 10, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040669.png', emoji: '🔥' },
      { id: 11, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040675.png', emoji: '👍' },
      { id: 12, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040681.png', emoji: '🎉' },
      { id: 13, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040687.png', emoji: '😎' },
      { id: 14, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040693.png', emoji: '💀' },
      { id: 15, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040696.png', emoji: '🤡' },
      { id: 16, stickerPackId: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2040/2040700.png', emoji: '👻' },
    ]
  },
  {
    id: 3,
    name: 'Еда',
    coverUrl: 'https://cdn-icons-png.flaticon.com/512/3174/3174218.png',
    stickers: [
      { id: 17, stickerPackId: 3, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3174/3174218.png', emoji: '🍕' },
      { id: 18, stickerPackId: 3, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3174/3174228.png', emoji: '🍔' },
      { id: 19, stickerPackId: 3, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3174/3174238.png', emoji: '🍟' },
      { id: 20, stickerPackId: 3, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3174/3174248.png', emoji: '🌮' },
    ]
  }
];

const FALLBACK_AVATAR = 'https://svgsilh.com/svg/2426371.svg';
const FALLBACK_CHAT_AVATAR = 'https://i.pinimg.com/736x/39/41/2a/39412a88ee11e656dbf45099958ea76d.jpg';
const FALLBACK_MEMBER_AVATAR = 'https://avatars.mds.yandex.net/i?id=de30cef3f8f5e4653bedb0e4e4b08286_l-4518571-images-thumbs&n=13';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
const [connection, setConnection] = useState<HubConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);


  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [stickerPacks] = useState<StickerPack[]>(DEFAULT_STICKER_PACKS);
  const [activePackId, setActivePackId] = useState<number>(DEFAULT_STICKER_PACKS[0]?.id || 1);

  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [chatAvatarFile, setChatAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    username: '', password: '', accessCode: '', chatName: '',
    bio: '', avatarUrl: '', description: ''
  });

  const activeChatRef = useRef<ChatRoom | null>(null);
  const userRef = useRef<User | null>(null);
  const stickerPanelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
 const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { connectionRef.current = connection; }, [connection]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stickerPanelRef.current && !stickerPanelRef.current.contains(e.target as Node)) {
        setShowStickerPanel(false);
      }
    };
    if (showStickerPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStickerPanel]);

  
  useEffect(() => {
    const savedUser = sessionStorage.getItem('moon_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.sessionToken) {
          setUser(parsedUser);
          setView('dashboard');
        }
      } catch {
        sessionStorage.removeItem('moon_user');
        setView('login');
      }
    }
  }, []);


  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null); setView('login');
      sessionStorage.removeItem('moon_user');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);


  useEffect(() => {
  

    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5000/chathub', {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 1500, 3000, 5000, 8000])
      .build();


    newConnection.on('ReceiveMessage', (msg: SignalRMessageDto) => {
      setMessages(prev => {
       
        const tempIndex = prev.findIndex(m => m.id < 0 && m.senderId === msg.senderId && m.content === msg.content);
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = { ...msg, stickerUrl: msg.stickerUrl } as Message;
          return updated;
        }
        
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg as Message];
      });
   }); 
    
    newConnection.on('UserStatusChanged', (userId: number, isOnline: boolean) => {
      setChatMembers(prev => prev.map(m => m.userId === userId ? { ...m, isOnline } : m));
    });

    newConnection.on('UserJoinedChat', (_: number, username: string) => {
      addSystemMessage(`${username} присоединился к чату`);
    });

    newConnection.on('UserLeftChat', (_: number, username: string) => {
      addSystemMessage(`${username} покинул чат`);
    });

    newConnection.onreconnecting(() => setConnectionStatus('reconnecting'));
    
    newConnection.onreconnected(async () => {
      setConnectionStatus('connected');
      const currentUser = userRef.current;
      if (currentUser && newConnection.state === HubConnectionState.Connected) {
  
        await newConnection.invoke('UserConnected', currentUser.userId, currentUser.sessionToken);
        
        
        const active = activeChatRef.current;
        if (active) {
          await newConnection.invoke('JoinChat', active.id, currentUser.userId);
        }
      }
      loadChats();
    });

    newConnection.onclose(() => setConnectionStatus('disconnected'));

    setConnection(newConnection);
    connectionRef.current = newConnection;

    newConnection.start()
      .then(async () => {
        setConnectionStatus('connected');
        if (user && newConnection.state === HubConnectionState.Connected) {
          await newConnection.invoke('UserConnected', user.userId, user.sessionToken);
          loadChats();
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('SignalR start error:', err);
      });

    return () => {
      if (newConnection.state === HubConnectionState.Connected) newConnection.stop();
    };

  }, [user]);

  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), 
      content, 
      sentAt: new Date().toISOString(),
      senderId: 0, 
      senderName: 'Система', 
      senderAvatar: null
    } as any]);
  };

  const loadChats = async () => {
    if (!user) return;
    try {
      const res = await chatApi.getMyChats(user.userId);
      setChats(res.data);
    } catch (e) { console.error(e); }
  };

  const loadChatMembers = async (chatId: number) => {
    try {
      const res = await chatApi.getChatMembers(chatId);
      let members: ChatMember[] = res.data;
      
    
      if (connectionRef.current?.state === HubConnectionState.Connected) {
        try {
          const onlineIds: number[] = await connectionRef.current.invoke('GetOnlineUsersInChat', chatId);
          members = members.map(m => ({ ...m, isOnline: onlineIds.includes(m.userId) }));
        } catch (err) { console.error("Error getting online users:", err); }
      }
      setChatMembers(members);
    } catch (e) { console.error("Ошибка загрузки участников:", e); }
  };

  const selectChat = useCallback(async (chat: ChatRoom) => {
    if (!connectionRef.current || !userRef.current) return;

  
    if (activeChatRef.current) {
      await connectionRef.current.invoke('LeaveChatFromHub', activeChatRef.current.id, userRef.current.userId);
    }

    setActiveChat(chat);
    setMessages([]); 
    setShowStickerPanel(false);

    try {

      const response = await connectionRef.current.invoke<JoinChatResponse>('JoinChat', chat.id, userRef.current.userId);
      
      if (response && response.success && response.messages) {
        setMessages(response.messages);
      }
      
      loadChatMembers(chat.id);
    } catch (err) {
      console.error('JoinChat failed:', err);
    }
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionRef.current || !activeChatRef.current || !userRef.current || (!newMessage.trim() && !imageFile)) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      try {
        const res = await fileApi.upload(imageFile);
        imageUrl = res.url;
      } catch { alert('Ошибка загрузки файла'); return; }
    }


    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId, 
      content: newMessage.trim(), 
      imageUrl, 
      sentAt: new Date().toISOString(),
      senderName: userRef.current.username, 
      senderAvatar: userRef.current.avatarUrl, 
      senderId: userRef.current.userId
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage(''); 
    setImageFile(null);

    try {
   
      await connectionRef.current.invoke<SendMessageResponse>(
        'SendMessage', 
        activeChatRef.current.id, 
        userRef.current.userId, 
        tempMsg.content, 
        imageUrl, 
        null 
      );
    } catch {
      
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Не удалось отправить сообщение');
    }
  };

  const sendSticker = async (stickerUrl: string) => {
    if (!connectionRef.current || !activeChatRef.current || !userRef.current) return;

    const tempId = -Date.now() - 1;
    const tempMsg: Message = {
      id: tempId, 
      content: '', 
      stickerUrl, 
      sentAt: new Date().toISOString(),
      senderName: userRef.current.username, 
      senderAvatar: userRef.current.avatarUrl, 
      senderId: userRef.current.userId
    };

    setMessages(prev => [...prev, tempMsg]);
    setShowStickerPanel(false);

    try {
      await connectionRef.current.invoke<SendMessageResponse>(
        'SendMessage', 
        activeChatRef.current.id, 
        userRef.current.userId, 
        '', 
        null, 
        stickerUrl 
      );
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Не удалось отправить стикер');
    }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    if (!confirm('Выйти из чата?')) return;
    
    if (connection?.state === HubConnectionState.Connected) {
      await connection.invoke('LeaveChatFromHub', activeChat.id, user.userId);
    }
    try {
      await chatApi.leaveChat({ chatId: activeChat.id, userId: user.userId });
      setActiveChat(null); 
      setMessages([]); 
      loadChats(); 
      setShowChatInfoModal(false);
    } catch { alert('Ошибка выхода'); }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authApi.login({ username: formData.username, password: formData.password });
      const u = { ...res.data, sessionToken: res.data.sessionToken };
      setUser(u); sessionStorage.setItem('moon_user', JSON.stringify(u)); setView('dashboard');
    } catch (err: any) { alert(err.response?.data || 'Ошибка входа'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authApi.register({ username: formData.username, password: formData.password, bio: formData.bio, avatarUrl: formData.avatarUrl });
      const u = { ...res.data, sessionToken: res.data.sessionToken };
      setUser(u); sessionStorage.setItem('moon_user', JSON.stringify(u)); setView('dashboard');
    } catch { alert('Ошибка регистрации'); }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let avatarUrl = null;
    if (chatAvatarFile) { try { const r = await fileApi.upload(chatAvatarFile); avatarUrl = r.url; } catch {} }
    try {
      await chatApi.createChat({ accessCode: formData.accessCode, name: formData.chatName, userId: user.userId, avatarUrl: avatarUrl || FALLBACK_CHAT_AVATAR, description: formData.description });
      setShowCreateModal(false); loadChats();
      setFormData({ ...formData, accessCode: '', chatName: '', description: '' });
      setChatAvatarFile(null);
    } catch { alert('Ошибка создания чата'); }
  };

  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await chatApi.joinChat({ accessCode: formData.accessCode, userId: user.userId });
      setShowJoinModal(false); loadChats();
      setFormData({ ...formData, accessCode: '' });
    } catch { alert('Чат не найден'); }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    try {
      await authApi.updateProfile({ userId: user.userId, username: formData.username, bio: formData.bio, avatarUrl: formData.avatarUrl });
      setUser({ ...user, username: formData.username, bio: formData.bio, avatarUrl: formData.avatarUrl });
      setShowProfileModal(false);
    } catch { alert('Ошибка обновления'); }
  };

  const handleLogout = () => {
    if (activeChat && user && connection?.state === HubConnectionState.Connected) {
      connection.invoke('LeaveChatFromHub', activeChat.id, user.userId);
    }
    setUser(null); setView('login'); sessionStorage.removeItem('moon_user');
    if (connection) connection.stop();
  };

  const activePack = stickerPacks.find(p => p.id === activePackId);

  
  if (view === 'login') {
    return (
      <div className="space-container">
        <div className="auth-box">
          <h1 className="logo">MOON</h1>
          <h2>Вход</h2>
          <form onSubmit={handleLogin}>
            <input placeholder="Имя пользователя" onChange={e => setFormData({ ...formData, username: e.target.value })} />
            <input type="password" placeholder="Пароль" onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <button type="submit">Войти</button>
          </form>
          <p onClick={() => setView('register')}>Нет аккаунта? Зарегистрироваться</p>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="space-container">
        <div className="auth-box">
          <h1 className="logo">MOON</h1>
          <h2>Регистрация</h2>
          <form onSubmit={handleRegister}>
            <input placeholder="Имя пользователя" onChange={e => setFormData({ ...formData, username: e.target.value })} />
            <input type="password" placeholder="Пароль" onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <input placeholder="Описание" onChange={e => setFormData({ ...formData, bio: e.target.value })} />
            <input placeholder="Ссылка для аватарки" onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })} />
            <button type="submit">Зарегистрироваться</button>
          </form>
          <p onClick={() => setView('login')}>Есть аккаунт? Войти</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo-small">MOON</h1>
          <div className="user-info" onClick={() => {
            setFormData({
              username: user?.username || '', password: '', accessCode: '', chatName: '',
              bio: user?.bio || '', avatarUrl: user?.avatarUrl || '', description: ''
            });
            setShowProfileModal(true);
          }}>
            <img src={user?.avatarUrl || FALLBACK_AVATAR} alt="avatar" className="avatar-small"
              onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
            <span>{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>

        <div className="chat-actions">
          <button onClick={() => setShowCreateModal(true)}>+ Создать чат</button>
          <button onClick={() => setShowJoinModal(true)}>Присоединиться к чату</button>
        </div>
      </aside>

<div className="chat-list">
  {chats.map(chat => (
    <div key={chat.id} className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`} onClick={() => selectChat(chat)}>
      <img src={chat.avatarUrl || FALLBACK_CHAT_AVATAR} alt={chat.name} className="chat-avatar"
        onError={(e) => { e.currentTarget.src = FALLBACK_CHAT_AVATAR; }} />
      <div className="chat-name">{chat.name}</div>
    </div>
  ))}
</div>

      <main className="chat-area">
        {activeChat ? (
          <>
            <header className="chat-header">
              <img src={activeChat.avatarUrl || FALLBACK_CHAT_AVATAR} alt={activeChat.name}
                className="chat-header-avatar"
                onError={(e) => { e.currentTarget.src = FALLBACK_CHAT_AVATAR; }}
                onClick={() => { loadChatMembers(activeChat.id); setShowChatInfoModal(true); }}
                style={{ cursor: 'pointer' }} />
              <h2>{activeChat.name}</h2>
              <span className="code-display">Пароль: {activeChat.accessCode}</span>
              <span className={`connection-status ${connectionStatus}`}>
                {connectionStatus === 'connected' && '🟢 Онлайн'}
                {connectionStatus === 'reconnecting' && '🟡 Переподключение...'}
                {connectionStatus === 'disconnected' && '🔴 Оффлайн'}
              </span>
            </header>

            <div className="messages-list">
              {messages.map(msg => {
                const isSystem = (msg as any).isSystemMessage === true || msg.senderId === 0;
                const isSticker = !!msg.stickerUrl;

                if (isSticker) {
                  return (
                    <div key={msg.id} className={`message sticker-message ${msg.senderId === user?.userId ? 'own' : 'other'}`}>
                      <img src={msg.stickerUrl} alt="sticker" className="sticker-image"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <span className="sticker-sender">
                        {msg.senderId === user?.userId ? 'Вы' : msg.senderName}
                      </span>
                    </div>
                  );
                }

                if (isSystem) {
                  return (
                    <div key={msg.id} className="message system">
                      <div className="msg-content">
                        {msg.content && <p>{msg.content}</p>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`message ${msg.senderId === user?.userId ? 'own' : 'other'}`}>
                    <div className="msg-meta">
                      <img src={msg.senderAvatar || FALLBACK_AVATAR} alt="" className="msg-avatar"
                        onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
                      <span className="msg-sender">{msg.senderName}</span>
                    </div>
                    <div className="msg-content">
                      {msg.content && <p>{msg.content}</p>}
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="attachment" className="msg-image"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <span className="msg-time">{new Date(msg.sentAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-wrapper" style={{ position: 'relative' }}>
              {showStickerPanel && (
                <div className="sticker-panel" ref={stickerPanelRef}>
                  <div className="sticker-panel-header">
                    <h4>Стикеры</h4>
                    <button type="button" onClick={() => setShowStickerPanel(false)}>✕</button>
                  </div>

                  <div className="sticker-packs-tabs">
                    {stickerPacks.map(pack => (
                      <div key={pack.id}
                        className={`sticker-pack-tab ${activePackId === pack.id ? 'active' : ''}`}
                        onClick={() => setActivePackId(pack.id)}
                        title={pack.name}>
                        <img src={pack.coverUrl} alt={pack.name}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ))}
                  </div>

                  <div className="sticker-grid">
                    {activePack && activePack.stickers.length > 0 ? (
                      activePack.stickers.map(sticker => (
                        <div key={sticker.id} className="sticker-item"
                          onClick={() => sendSticker(sticker.imageUrl)}
                          title={sticker.emoji || 'Стикер'}>
                          <img src={sticker.imageUrl} alt={sticker.emoji || 'sticker'}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      ))
                    ) : (
                      <div className="sticker-empty">Нет стикеров в этом наборе</div>
                    )}
                  </div>
                </div>
              )}

              <form className="message-input-area" onSubmit={sendMessage}>
                <button type="button" className="sticker-toggle-btn"
                  onClick={() => setShowStickerPanel(!showStickerPanel)}
                  title="Стикеры">
                  😀
                </button>

                <input type="text" value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Напишите сообщение..." />
                <input type="file" accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] || null)} />
                <button type="submit">Отправить</button>
              </form>
            </div>
          </>
        ) : (
          <div className="welcome-screen">Выберите чат, чтобы начать обмен сообщениями</div>
        )}
      </main>

      {/* МОДАЛКИ (Вернул оригинальные) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создание нового чата</h3>
            <form onSubmit={handleCreateChat}>
              <input placeholder="Название чата" maxLength={100} required onChange={e => setFormData({ ...formData, chatName: e.target.value })} />
              <textarea placeholder="Описание:" onChange={e => setFormData({ ...formData, description: e.target.value })} />
              <label className="file-upload-label">
                <span>Аватарка</span>
                <input type="file" accept="image/*" onChange={e => setChatAvatarFile(e.target.files?.[0] || null)} />
              </label>
              <input placeholder="10-значный пароль" maxLength={10} minLength={10} required onChange={e => setFormData({ ...formData, accessCode: e.target.value })} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                <button type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Присоединиться к чату</h3>
            <form onSubmit={handleJoinChat}>
              <input placeholder="10-значный пароль" maxLength={10} minLength={10} required onChange={e => setFormData({ ...formData, accessCode: e.target.value })} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoinModal(false)}>Отмена</button>
                <button type="submit">Присоединиться</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Профиль</h3>
            <form onSubmit={handleProfileUpdate}>
              <h5>Имя пользователя:</h5>
              <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              <h5>Описание:</h5>
              <input value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
              <h5>Аватарка:</h5>
              <input value={formData.avatarUrl} onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProfileModal(false)}>Отмена</button>
                <button type="submit">Изменить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChatInfoModal && activeChat && (
        <div className="modal-overlay">
          <div className="modal chat-info-modal">
            <h3>О чате</h3>
            <div className="chat-info-header">
              <h4>Аватарка:</h4>
              <img src={activeChat.avatarUrl || FALLBACK_CHAT_AVATAR} alt={activeChat.name} className="chat-info-avatar"
                onError={(e) => { e.currentTarget.src = FALLBACK_CHAT_AVATAR; }} />
              <h4>Название чата:</h4>
              <h2>{activeChat.name}</h2>
              <p className="chat-description">{activeChat.description || 'Нет описания'}</p>
            </div>
            <div className="chat-members-section">
              <h4>Участники ({chatMembers.length})</h4>
              <div className="members-list">
                {chatMembers.map(member => (
                  <div key={member.userId} className="member-item">
                    <img src={member.avatarUrl || FALLBACK_MEMBER_AVATAR} alt="" className="member-avatar"
                      onError={(e) => { e.currentTarget.src = FALLBACK_MEMBER_AVATAR; }} />
                    <span className="member-name">{member.username}</span>
                    <span className={`status-indicator ${member.isOnline ? 'online' : 'offline'}`}>
                      {member.isOnline ? '    🟢 Онлайн' : '    ⚫ Оффлайн'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleLeaveChat} className="danger-btn">Выйти</button>
              <button type="button" onClick={() => setShowChatInfoModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;