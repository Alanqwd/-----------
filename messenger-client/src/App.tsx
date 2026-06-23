import React, { useState, useEffect, useRef } from 'react';
import { authApi, chatApi, fileApi } from './services/api';
import type { User, ChatRoom, Message, ChatMember } from './types';
import { HubConnectionBuilder, HttpTransportType, HubConnectionState } from '@microsoft/signalr';
import './App.css';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [connection, setConnection] = useState<any>(null);
  
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [chatAvatarFile, setChatAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    accessCode: '',
    chatName: '',
    bio: '',
    avatarUrl: '',
    description: ''
  });

  const activeChatRef = useRef<ChatRoom | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

 useEffect(() => {
  const savedUser = sessionStorage.getItem('moon_user');
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
    
      if (parsedUser.sessionToken) {
        chatApi.getMyChats(parsedUser.userId)
          .then(() => {
            setUser(parsedUser);
            setView('dashboard');
          })
          .catch((err) => {
            console.log('Сессия истекла, требуется повторный вход', err);
            sessionStorage.removeItem('moon_user');
            setUser(null);
            setView('login');
          });
      } else {
        sessionStorage.removeItem('moon_user');
        setView('login');
      }
    } catch (e) {
      console.error('Failed to parse saved user', e);
      sessionStorage.removeItem('moon_user');
      setView('login');
    }
  }
}, []);

useEffect(() => {
  const handleSessionExpired = () => {
    console.log('Сессия истекла — выход на экран логина');
    setUser(null);
    setView('login');
    sessionStorage.removeItem('moon_user');
    alert('Ваша сессия истекла. Возможно, вы вошли с другого устройства.');
  };

  window.addEventListener('session-expired', handleSessionExpired);
  return () => window.removeEventListener('session-expired', handleSessionExpired);
}, []);

  useEffect(() => {
    if (!user) return;

    loadChats();

    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5001/chathub', {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets 
      })
      .withAutomaticReconnect()
      .build();

    newConnection.onreconnected(async () => {
      console.log("Переподключено");
      setConnectionStatus('connected');
      
      try {
        if (newConnection.state === HubConnectionState.Connected && userRef.current) {
          await newConnection.invoke('UserConnected', userRef.current.userId, userRef.current.sessionToken);
        }
      } catch (err) {
        const error = err as any;
        if (error instanceof Error && error.message.includes("Invocation canceled")) {
          console.log("UserConnected отменен при переподключении");
          return;
        }
        console.error("Error re-notifying user connection:", error);
      }
      
      if (activeChatRef.current && userRef.current) {
        try {
          if (newConnection.state === HubConnectionState.Connected) {
            await newConnection.invoke('JoinChat', activeChatRef.current.id, userRef.current.userId);
          }
        } catch (err) {
          const error = err as any;
          if (error instanceof Error && error.message.includes("Invocation canceled")) {
            console.log("JoinChat отменен при переподключении");
            return;
          }
          console.error("Ошибка при повторном входе в чат:", error);
        }
      }
      
      loadChats();
    });

    newConnection.onreconnecting(() => {
      console.log("Переподключение...");
      setConnectionStatus('reconnecting');
    });

    newConnection.onclose((error) => {
      console.log("Соединение закрыто:", error?.message);
      setConnectionStatus('disconnected');
    });

    newConnection.on('ReceiveMessage', (msg: Message) => {
      console.log("Получено сообщение:", msg);
      
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) {
          return prev; 
        }
        return [...prev, msg];
      });
      
      if (msg.senderId !== userRef.current?.userId) {
        setChats(prev => prev.map(c => 
          c.id === (msg as any).ChatRoomId 
            ? {...c, unreadCount: c.unreadCount + 1} 
            : c
        ));
      }
    });

    newConnection.on('UpdateUnreadBadge', (chatId: number) => {
      setChats(prev => prev.map(c => 
        c.id === chatId ? {...c, unreadCount: c.unreadCount + 1} : c
      ));
    });
    
    newConnection.on('UnreadCountsUpdated', () => {
      loadChats();
    });

    newConnection.on('UserStatusChanged', (userId: number, isOnline: boolean) => {
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      
      setChatMembers(prev => prev.map(member => 
        member.userId === userId ? {...member, isOnline} : member
      ));
    });

newConnection.on('UserJoinedChat', (userId: number, username: string, avatarUrl: string | null) => {
  console.log(`[Chat] User ${username} joined the chat`);
  
  
  setMessages(prev => [...prev, {
    id: Date.now() + Math.random(), 
    content: `${username} присоединился к чату`,
    sentAt: new Date().toISOString(),
    senderId: 0, 
    senderName: 'Система',
    senderAvatar: null,
    isSystemMessage: true 
  } as any]);
});


newConnection.on('UserLeftChat', (userId: number, username: string, avatarUrl: string | null) => {
  console.log(`[Chat] User ${username} left the chat`);
  
  setMessages(prev => [...prev, {
    id: Date.now() + Math.random(),
    content: `${username} покинул чат`,
    sentAt: new Date().toISOString(),
    senderId: 0,
    senderName: 'Система',
    senderAvatar: null,
    isSystemMessage: true
  } as any]);
});

    newConnection.start()
      .then(async () => {
        console.log("SignalR Connected");
        setConnectionStatus('connected');
        setConnection(newConnection);
        
        if (newConnection.state === HubConnectionState.Connected && user) {
          try {
            await newConnection.invoke('UserConnected', user.userId, user.sessionToken);
            console.log("UserConnected вызван успешно");
          } catch (err) {
            const error = err as any;
            if (error instanceof Error && error.message.includes("Invocation canceled")) {
              console.log("UserConnected отменен (соединение закрылось)");
              return;
            }
            console.error("Error notifying user connection:", error);
            if (error.message.includes("Invalid or expired session")) {
               handleSessionExpiredLogic();
            }
          }
        }
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log("Соединение отменено Strict Mode (это нормально в dev)");
          return;
        }
        console.error("SignalR Connection Error:", err);
        setConnectionStatus('disconnected');
      });

    return () => {
      console.log("Остановка SignalR соединения...");
      if (newConnection) {
        if (newConnection.state === HubConnectionState.Connected || 
            newConnection.state === HubConnectionState.Connecting) {
          newConnection.stop().catch(err => {
            if (err instanceof Error && 
                (err.message.includes("Invocation canceled") || err.name === 'AbortError')) {
              console.log("Соединение уже закрыто");
              return;
            }
            console.error("Error stopping connection:", err);
          });
        }
      }
    };
  }, [user]);

  const handleSessionExpiredLogic = () => {
      setUser(null);
      setView('login');
      sessionStorage.removeItem('moon_user');
      alert('Ваша сессия истекла. Возможно, вы вошли с другого устройства.');
  };

useEffect(() => {
  if (!connection || !activeChat || !user) {
    return;
  }
  
  if (connection.state !== HubConnectionState.Connected) {
    return;
  }

  const joinChat = async () => {
    try {
      console.log(`[JoinChat] Попытка входа в чат: ${activeChat.name} (ID: ${activeChat.id})`);
      await connection.invoke('JoinChat', activeChat.id, user.userId);
      console.log(`[JoinChat] ✅ Успешно вошли в чат: ${activeChat.name}`);
      loadChatMembers(activeChat.id);
    } catch (error) {
      const err = error as any;
      if (err instanceof Error && err.message.includes("Invocation canceled")) {
        console.log("[JoinChat] Отменено (Invocation canceled)");
        return;
      }
      console.error("[JoinChat] Ошибка:", error);
    }
  };

  joinChat();
}, [activeChat, connection, user]); 

  const loadChats = async () => {
    if (user) {
      try {
        const res = await chatApi.getMyChats(user.userId);
        setChats(res.data);
      } catch (e) { console.error(e); }
    }
  };

  const loadChatMembers = async (chatId: number) => {
    try {
      const res = await chatApi.getChatMembers(chatId);
      let members: ChatMember[] = res.data;
      
      if (connection && connection.state === HubConnectionState.Connected) {
        try {
          const onlineUserIds: number[] = await connection.invoke('GetOnlineUsersInChat', chatId);
          members = members.map((m: ChatMember) => ({
            ...m,
            isOnline: onlineUserIds.includes(m.userId)
          }));
        } catch (err) {
          const error = err as any;
          if (error instanceof Error && error.message.includes("Invocation canceled")) {
            console.log("GetOnlineUsersInChat отменен");
            return;
          }
          console.error("Error getting online users:", error);
        }
      }
      
      setChatMembers(members);
    } catch (e) {
      console.error("Ошибка загрузки участников:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await authApi.login({ username: formData.username, password: formData.password });
    
    const userData = { ...res.data, sessionToken: res.data.sessionToken };
    
    setUser(userData);
    sessionStorage.setItem('moon_user', JSON.stringify(userData)); 
    setView('dashboard');
  } catch (err) {
    const error = err as any;
    const errorMessage = error.response?.data || error.message || 'Login failed';
    alert(errorMessage);
  }
};


const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    
    sessionStorage.removeItem('moon_user');
    setUser(null); 

    const res = await authApi.register({ 
      username: formData.username, 
      password: formData.password,
      bio: formData.bio,
      avatarUrl: formData.avatarUrl
    });
    
    const userData = { 
      ...res.data, 
      sessionToken: res.data.sessionToken 
    };
    
    setUser(userData);
    sessionStorage.setItem('moon_user', JSON.stringify(userData));
    setView('dashboard');
  } catch (err) { 
    console.error('Registration failed:', err);
    alert('Registration failed'); 
  }
};

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let avatarUrl = null;
    
    if (chatAvatarFile) {
      try {
        const result = await fileApi.upload(chatAvatarFile);
        avatarUrl = result.url;
      } catch (error) {
        console.error("Ошибка загрузки аватара чата:", error);
      }
    }

    try {
      await chatApi.createChat({
        accessCode: formData.accessCode,
        name: formData.chatName,
        userId: user.userId,
        avatarUrl: avatarUrl || 'https://via.placeholder.com/100?text=Chat',
        description: formData.description
      });
      setShowCreateModal(false);
      loadChats();
      setFormData({...formData, accessCode: '', chatName: '', description: ''});
      setChatAvatarFile(null);
    } catch (err) { alert('Failed to create chat. Code might be taken.'); }
  };

  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await chatApi.joinChat({
        accessCode: formData.accessCode,
        userId: user.userId
      });
      setShowJoinModal(false);
      loadChats();
      setFormData({...formData, accessCode: ''});
    } catch (err) { alert('Chat not found'); }
  };

  const selectChat = async (chat: ChatRoom) => {

  if (activeChat && activeChat.id !== chat.id && user) {
    await leaveChatHub();
  }

  setChats(prev => prev.map(c => 
    c.id === chat.id ? { ...c, unreadCount: 0 } : c
  ));

  setActiveChat(chat);
  
  try {
    const res = await chatApi.getMessages(chat.id);
    setMessages(res.data);


    if (connection && connection.state === HubConnectionState.Connected && user) {
      await connection.invoke('JoinChat', chat.id, user.userId);
    }

    await fetch(`http://localhost:5001/api/chat/mark-as-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.sessionToken}`
      },
      body: JSON.stringify({
        chatId: chat.id,
        userId: user?.userId
      })
    });

  } catch (e) { 
    console.error("Ошибка загрузки сообщений:", e); 
  }
};

const leaveChatHub = async () => {
  if (connection && connection.state === HubConnectionState.Connected && activeChat && user) {
    try {
      await connection.invoke('LeaveChatFromHub', activeChat.id, user.userId);
    } catch (error) {
      console.error("Error leaving chat via Hub:", error);
    }
  }
};

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection || !activeChat || !user || (!newMessage && !imageFile)) return;

    let imageUrl = null;
    
    if (imageFile) {
      try {
        const result = await fileApi.upload(imageFile);
        imageUrl = result.url;
      } catch (error) {
        console.error("Ошибка загрузки файла:", error);
        alert("Не удалось загрузить файл");
        return;
      }
    }

    const tempMessage: Message = {
      id: Date.now(), 
      content: newMessage,
      imageUrl: imageUrl || undefined,
      sentAt: new Date().toISOString(),
      senderName: user.username,
      senderAvatar: user.avatarUrl,
      senderId: user.userId
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setImageFile(null);

    try {
      if (connection.state === HubConnectionState.Disconnected) {
        await connection.start();
      } else if (connection.state === HubConnectionState.Reconnecting) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Таймаут")), 10000);
          connection.onreconnected(() => { clearTimeout(timeout); resolve(); });
          connection.onclose(() => { clearTimeout(timeout); reject(new Error("Закрыто")); });
        });
      }
      
      if (connection.state !== HubConnectionState.Connected) {
        throw new Error("Соединение не активно");
      }
      
      await connection.invoke('SendMessage', activeChat.id, user.userId, newMessage, imageUrl);
      
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      
    } catch (error) {
      const err = error as any;
      if (err instanceof Error && err.message.includes("Invocation canceled")) {
        return;
      }
      console.error("Ошибка при отправке сообщения:", error);
      alert("Не удалось отправить сообщение");
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };


const handleLeaveChat = async () => {
  if (!activeChat || !user) return;
  
  if (!confirm('Вы уверены что хотите выйти из чата?')) return;


  await leaveChatHub();

  try {
    await chatApi.leaveChat({
      chatId: activeChat.id,
      userId: user.userId
    });
    
    setActiveChat(null);
    setMessages([]);
    loadChats();
    setShowChatInfoModal(false);
  } catch (error) {
    console.error("Ошибка при выходе из чата:", error);
    alert("Не удалось выйти из чата");
  }
};
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    try {
      await authApi.updateProfile({
        userId: user.userId,
        username: formData.username,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl
      });
      setUser({...user, username: formData.username, bio: formData.bio, avatarUrl: formData.avatarUrl});
      setShowProfileModal(false);
    } catch(err) { alert('Update failed'); }
  };

const handleLogout = () => {
  
  if (activeChat && user) {
    leaveChatHub();
  }
  
  setUser(null);
  setView('login');
  sessionStorage.removeItem('moon_user');
  
  if (connection) {
    connection.stop();
    setConnection(null);
  }
};

  if (view === 'login') {
    return (
      <div className="space-container">
        <div className="auth-box">
          <h1 className="logo">MOON</h1>
          <h2>Вход</h2>
          <form onSubmit={handleLogin}>
            <input placeholder="Имя пользователя" onChange={e => setFormData({...formData, username: e.target.value})} />
            <input type="password" placeholder="Пароль" onChange={e => setFormData({...formData, password: e.target.value})} />
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
            <input placeholder="Имя пользователя" onChange={e => setFormData({...formData, username: e.target.value})} />
            <input type="password" placeholder="Пароль" onChange={e => setFormData({...formData, password: e.target.value})} />
            <input placeholder="Описание (максимум 50 букв)" onChange={e => setFormData({...formData, bio: e.target.value})} />
            <input placeholder="Ссылка для аватарки" onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
            <button type="submit">Зарегистрироваться и войти</button>
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
                username: user?.username || '', 
                password: '', 
                accessCode: '', 
                chatName: '', 
                bio: user?.bio || '', 
                avatarUrl: user?.avatarUrl || '',
                description: ''
              });
              setShowProfileModal(true);
          }}>
             <img src={user?.avatarUrl || 'https://svgsilh.com/svg/2426371.svg'} alt="avatar" className="avatar-small"/>
             <span>{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
        
        <div className="chat-actions">
          <button onClick={() => setShowCreateModal(true)}>+ Создать чат</button>
          <button onClick={() => setShowJoinModal(true)}>Присоединиться к чату</button>
        </div>

        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`} onClick={() => selectChat(chat)}>
              <img 
                src={chat.avatarUrl || ''} 
                alt={chat.name} 
                className="chat-avatar"
              />
              <div className="chat-name">{chat.name}</div>
              {chat.unreadCount > 0 && <div className="badge">{chat.unreadCount}</div>}
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-area">
        {activeChat ? (
          <>
            <header className="chat-header">
              <img 
                src={activeChat.avatarUrl || 'https://i.pinimg.com/736x/39/41/2a/39412a88ee11e656dbf45099958ea76d.jpg'} 
                alt={activeChat.name}
                className="chat-header-avatar"
                onClick={() => {
                  loadChatMembers(activeChat.id);
                  setShowChatInfoModal(true);
                }}
                style={{cursor: 'pointer'}}
              />
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

    const isSystem = (msg as any).isSystemMessage === true;
    

    const messageClass = isSystem 
      ? 'system' 
      : (msg.senderId === user?.userId ? 'own' : 'other');
    
    return (
      <div key={msg.id} className={`message ${messageClass}`}>
        {!isSystem && (
          <div className="msg-meta">
            <img src={msg.senderAvatar || 'https://svgsilh.com/svg/2426371.svg'} alt="" className="msg-avatar"/>
            <span className="msg-sender">{msg.senderName}</span>
          </div>
        )}
        <div className="msg-content">
          {msg.content && <p>{msg.content}</p>}
          {msg.imageUrl && <img src={msg.imageUrl} alt="attachment" className="msg-image"/>}
          {!isSystem && (
            <span className="msg-time">{new Date(msg.sentAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    );
  })}
</div>
            <form className="message-input-area" onSubmit={sendMessage}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Напишите сообщение..." 
              />
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              <button type="submit">Отправить</button>
            </form>
          </>
        ) : (
          <div className="welcome-screen">Выберите чат, чтобы начать обмен сообщениями</div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создание нового чата</h3>
            <form onSubmit={handleCreateChat}>
              <input placeholder="Название чата" maxLength={100} required onChange={e => setFormData({...formData, chatName: e.target.value})} />
              <textarea placeholder="Описание: " onChange={e => setFormData({...formData, description: e.target.value})} />
              <label className="file-upload-label">
                <span>Аватарка (по умолчанию)</span>
                <input type="file" accept="image/*" onChange={e => setChatAvatarFile(e.target.files?.[0] || null)} />
              </label>
              <input placeholder="10-значный пароль" maxLength={10} minLength={10} required onChange={e => setFormData({...formData, accessCode: e.target.value})} />
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
              <input placeholder="Введите 10-значный пароль" maxLength={10} minLength={10} required onChange={e => setFormData({...formData, accessCode: e.target.value})} />
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
              <input placeholder="Имя пользователя" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              <h5>Описание:</h5>
              <input placeholder="Описание:" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                <h5>Аватарка:</h5>
              <input placeholder="Ссылка для аватарки" value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
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
              <img 
                src={activeChat.avatarUrl || 'https://i.pinimg.com/736x/39/41/2a/39412a88ee11e656dbf45099958ea76d.jpg'} 
                alt={activeChat.name}
                className="chat-info-avatar"
              />
              <h4>Название чата:</h4>
              <h2>{activeChat.name}</h2>
              <p className="chat-description">{activeChat.description || 'Описание: '}</p>
            </div>

            <div className="chat-members-section">
              <h4>Участники ({chatMembers.length})</h4>
              <div className="members-list">
                {chatMembers.map(member => (
                  <div key={member.userId} className="member-item">
                    <img src={member.avatarUrl || 'https://avatars.mds.yandex.net/i?id=de30cef3f8f5e4653bedb0e4e4b08286_l-4518571-images-thumbs&n=13'} alt="" className="member-avatar"/>
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