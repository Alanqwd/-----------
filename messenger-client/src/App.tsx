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

  // LOCALSTORAGE: Восстановление сессии
  useEffect(() => {
    const savedUser = localStorage.getItem('moon_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setView('dashboard');
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
  }, []);

  // LOCALSTORAGE: Сохранение пользователя
  useEffect(() => {
    if (user) {
      localStorage.setItem('moon_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('moon_user');
    }
  }, [user]);

  // Создание соединения SignalR
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
        await newConnection.invoke('UserConnected', user.userId);
      } catch (err) {
        console.error("Error re-notifying user connection:", err);
      }
      
      if (activeChatRef.current && userRef.current) {
        try {
          await newConnection.invoke('JoinChat', activeChatRef.current.id, userRef.current.userId);
        } catch (err) {
          console.error("Ошибка при повторном входе в чат:", err);
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
      
      if (activeChatRef.current && msg.senderId !== userRef.current?.userId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
      
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

    // ✅ Обработчик изменения статуса пользователя (онлайн/оффлайн)
    newConnection.on('UserStatusChanged', (userId: number, isOnline: boolean) => {
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      
      setChatMembers(prev => prev.map(member => 
        member.userId === userId ? {...member, isOnline} : member
      ));
    });

    newConnection.start()
      .then(() => {
        console.log("SignalR Connected");
        setConnectionStatus('connected');
        setConnection(newConnection);
        
        // ✅ Уведомляем сервер о подключении пользователя
        newConnection.invoke('UserConnected', user.userId).catch(err => {
          console.error("Error notifying user connection:", err);
        });
      })
      .catch(err => {
        console.error("SignalR Connection Error:", err);
        setConnectionStatus('disconnected');
      });

    return () => {
      console.log("Остановка SignalR соединения...");
      if (newConnection) {
        newConnection.stop().catch(err => {
          if (!err.message?.includes("Invocation canceled")) {
            console.error("Error stopping connection:", err);
          }
        });
      }
    };
  }, [user]);

  // Вход в чат при его выборе
  useEffect(() => {
    if (!connection || !activeChat || !user) return;
    if (connection.state !== HubConnectionState.Connected) return;

    const joinChat = async () => {
      try {
        await connection.invoke('JoinChat', activeChat.id, user.userId);
        console.log(`Вошли в чат: ${activeChat.name}`);
        loadChatMembers(activeChat.id);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Invocation canceled")) {
          console.log("JoinChat отменен");
          return;
        }
        console.error("Ошибка при входе в чат:", error);
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

  // ✅ Загрузка участников чата с онлайн статусами
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
          console.error("Error getting online users:", err);
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
      setUser(res.data);
      setView('dashboard');
    } catch (err) { alert('Login failed'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authApi.register({ 
        username: formData.username, 
        password: formData.password,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl
      });
      setUser(res.data);
      setView('dashboard');
    } catch (err) { alert('Registration failed'); }
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
    setActiveChat(chat);
    
    try {
      const res = await chatApi.getMessages(chat.id);
      setMessages(res.data);
    } catch (e) { 
      console.error("Ошибка загрузки сообщений:", e); 
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
      setNewMessage('');
      setImageFile(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invocation canceled")) {
        return;
      }
      console.error("Ошибка при отправке сообщения:", error);
      alert("Не удалось отправить сообщение");
    }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    
    if (!confirm('Вы уверены что хотите выйти из чата?')) return;

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
    setUser(null);
    setView('login');
    localStorage.removeItem('moon_user');
  };

  if (view === 'login') {
    return (
      <div className="space-container">
        <div className="auth-box">
          <h1 className="logo">MOON</h1>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} />
            <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="submit">Enter Orbit</button>
          </form>
          <p onClick={() => setView('register')}>No account? Register</p>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="space-container">
        <div className="auth-box">
          <h1 className="logo">MOON</h1>
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <input placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} />
            <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} />
            <input placeholder="Bio (max 50 words)" onChange={e => setFormData({...formData, bio: e.target.value})} />
            <input placeholder="Avatar URL" onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
            <button type="submit">Launch</button>
          </form>
          <p onClick={() => setView('login')}>Have account? Login</p>
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
             <img src={user?.avatarUrl || 'https://via.placeholder.com/40'} alt="avatar" className="avatar-small"/>
             <span>{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        
        <div className="chat-actions">
          <button onClick={() => setShowCreateModal(true)}>+ Create Chat</button>
          <button onClick={() => setShowJoinModal(true)}>Join via Code</button>
        </div>

        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`} onClick={() => selectChat(chat)}>
              <img 
                src={chat.avatarUrl || 'https://via.placeholder.com/40?text=C'} 
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
                src={activeChat.avatarUrl || 'https://via.placeholder.com/50?text=C'} 
                alt={activeChat.name}
                className="chat-header-avatar"
                onClick={() => {
                  loadChatMembers(activeChat.id);
                  setShowChatInfoModal(true);
                }}
                style={{cursor: 'pointer'}}
              />
              <h2>{activeChat.name}</h2>
              <span className="code-display">Code: {activeChat.accessCode}</span>
              <span className={`connection-status ${connectionStatus}`}>
                {connectionStatus === 'connected' && '🟢 Online'}
                {connectionStatus === 'reconnecting' && '🟡 Reconnecting...'}
                {connectionStatus === 'disconnected' && '🔴 Offline'}
              </span>
            </header>
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.senderId === user?.userId ? 'own' : 'other'}`}>
                  <div className="msg-meta">
                    <img src={msg.senderAvatar || 'https://via.placeholder.com/30'} alt="" className="msg-avatar"/>
                    <span className="msg-sender">{msg.senderName}</span>
                  </div>
                  <div className="msg-content">
                    {msg.content && <p>{msg.content}</p>}
                    {msg.imageUrl && <img src={msg.imageUrl} alt="attachment" className="msg-image"/>}
                    <span className="msg-time">{new Date(msg.sentAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <form className="message-input-area" onSubmit={sendMessage}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
              />
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              <button type="submit">Send 🚀</button>
            </form>
          </>
        ) : (
          <div className="welcome-screen">Select a chat to start messaging</div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Chat</h3>
            <form onSubmit={handleCreateChat}>
              <input placeholder="Chat Name" maxLength={100} required onChange={e => setFormData({...formData, chatName: e.target.value})} />
              <textarea placeholder="Description" onChange={e => setFormData({...formData, description: e.target.value})} />
              <label className="file-upload-label">
                <span>Chat Avatar (optional)</span>
                <input type="file" accept="image/*" onChange={e => setChatAvatarFile(e.target.files?.[0] || null)} />
              </label>
              <input placeholder="10-digit Password" maxLength={10} minLength={10} required onChange={e => setFormData({...formData, accessCode: e.target.value})} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Join Chat</h3>
            <form onSubmit={handleJoinChat}>
              <input placeholder="Enter 10-digit Code" maxLength={10} minLength={10} required onChange={e => setFormData({...formData, accessCode: e.target.value})} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button type="submit">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Profile</h3>
            <form onSubmit={handleProfileUpdate}>
              <input placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              <input placeholder="Bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
              <input placeholder="Avatar URL" value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChatInfoModal && activeChat && (
        <div className="modal-overlay">
          <div className="modal chat-info-modal">
            <h3>Chat Information</h3>
            
            <div className="chat-info-header">
              <img 
                src={activeChat.avatarUrl || 'https://via.placeholder.com/100?text=C'} 
                alt={activeChat.name}
                className="chat-info-avatar"
              />
              <h2>{activeChat.name}</h2>
              <p className="chat-description">{activeChat.description || 'No description'}</p>
            </div>

            <div className="chat-members-section">
              <h4>Members ({chatMembers.length})</h4>
              <div className="members-list">
                {chatMembers.map(member => (
                  <div key={member.userId} className="member-item">
                    <img src={member.avatarUrl || 'https://via.placeholder.com/30'} alt="" className="member-avatar"/>
                    <span className="member-name">{member.username}</span>
                    <span className={`status-indicator ${member.isOnline ? 'online' : 'offline'}`}>
                      {member.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={handleLeaveChat} className="danger-btn">Leave Chat</button>
              <button type="button" onClick={() => setShowChatInfoModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;