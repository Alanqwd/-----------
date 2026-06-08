import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { authApi, chatApi } from './services/api';
import type { User, ChatRoom, Message } from './types';
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

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    accessCode: '',
    chatName: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      loadChats();

      const newConnection = new HubConnectionBuilder()
        .withUrl('http://localhost:5000/chathub')
        .withAutomaticReconnect()
        .build();

        

      newConnection.start().then(() => {
        setConnection(newConnection);
      });

      newConnection.on('ReceiveMessage', (msg: Message) => {
        if (activeChat && msg.senderId !== user.userId) {
           setMessages(prev => [...prev, msg]);
        }
      });

      newConnection.on('UpdateUnreadBadge', (chatId: number) => {
         setChats(prev => prev.map(c => c.id === chatId ? {...c, unreadCount: c.unreadCount + 1} : c));
      });
      
      newConnection.on('UnreadCountsUpdated', () => {
          loadChats();
      });

      return () => {
        newConnection.stop();
      };
    }
  }, [user, activeChat]);

  const loadChats = async () => {
    if (user) {
      try {
        const res = await chatApi.getMyChats(user.userId);
        setChats(res.data);
      } catch (e) { console.error(e); }
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
    try {
      await chatApi.createChat({
        accessCode: formData.accessCode,
        name: formData.chatName,
        userId: user.userId
      });
      setShowCreateModal(false);
      loadChats();
      setFormData({...formData, accessCode: '', chatName: ''});
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
    if (connection && user) {
      await connection.invoke('JoinChat', chat.id, user.userId);
    }
    try {
      const res = await chatApi.getMessages(chat.id);
      setMessages(res.data);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection || !activeChat || !user || (!newMessage && !imageFile)) return;

    let imageUrl = null;
    if (imageFile) {
        const formDataImg = new FormData();
        formDataImg.append('file', imageFile);
        imageUrl = "uploaded_image_url_placeholder"; 
    }

    await connection.invoke('SendMessage', activeChat.id, user.userId, newMessage, imageUrl);
    setNewMessage('');
    setImageFile(null);
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
              setFormData({username: user?.username || '', password: '', accessCode: '', chatName: '', bio: user?.bio || '', avatarUrl: user?.avatarUrl || ''});
              setShowProfileModal(true);
          }}>
             <img src={user?.avatarUrl || 'https://via.placeholder.com/40'} alt="avatar" className="avatar-small"/>
             <span>{user?.username}</span>
          </div>
        </div>
        
        <div className="chat-actions">
          <button onClick={() => setShowCreateModal(true)}>+ Create Chat</button>
          <button onClick={() => setShowJoinModal(true)}>Join via Code</button>
        </div>

        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`} onClick={() => selectChat(chat)}>
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
              <h2>{activeChat.name}</h2>
              <span className="code-display">Code: {activeChat.accessCode}</span>
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
              <input placeholder="Chat Name (max 20 words)" maxLength={100} required onChange={e => setFormData({...formData, chatName: e.target.value})} />
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
    </div>
  );
};

export default App;