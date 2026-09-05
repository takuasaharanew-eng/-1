import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { User, Server, Channel, Message, VoiceParticipant, UserStatus, Attachment } from '../types';
import { WebRTCManager } from '../lib/webrtc';
import { playSound, SoundEffectType } from '../lib/soundboard';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  servers: Server[];
  currentServerId: string;
  currentChannelId: string;
  currentServer: Server | null;
  currentChannel: Channel | null;
  activeVoiceChannelId: string | null;
  voiceParticipants: VoiceParticipant[];
  messages: { [channelId: string]: Message[] };
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  speakingUsers: Set<string>;
  micAudioLevel: number;
  remoteStreams: Map<string, MediaStream>;
  localScreenStream: MediaStream | null;
  typingUsers: { [userId: string]: string };
  soundboardNotice: { sound: string; userName: string; id: number } | null;
  isConnected: boolean;

  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isCreateChannelModalOpen: boolean;
  setIsCreateChannelModalOpen: (open: boolean) => void;
  isCreateServerModalOpen: boolean;
  setIsCreateServerModalOpen: (open: boolean) => void;
  isVoiceStageOpen: boolean;
  setIsVoiceStageOpen: (open: boolean) => void;
  isMembersSidebarOpen: boolean;
  setIsMembersSidebarOpen: (open: boolean) => void;

  // Actions
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    password?: string,
    displayName?: string,
    avatarColor?: string,
    avatarIcon?: string,
    bio?: string
  ) => Promise<{ success: boolean; error?: string }>;
  guestLogin: (
    displayName?: string,
    avatarColor?: string,
    avatarIcon?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  selectServer: (serverId: string) => void;
  selectChannel: (channelId: string) => void;
  joinVoiceChannel: (channelId: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => Promise<void>;
  setPeerVolume: (userId: string, volume: number) => void;
  sendMessage: (content: string, attachments?: Attachment[], replyTo?: any) => void;
  sendTyping: (isTyping: boolean) => void;
  addReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  createChannel: (name: string, type: 'text' | 'voice', topic?: string) => Promise<boolean>;
  createServer: (name: string, iconBg?: string, description?: string) => Promise<boolean>;
  updateUserStatus: (status: UserStatus, customStatus?: string, bio?: string) => void;
  triggerSoundboard: (sound: SoundEffectType) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServerId, setCurrentServerId] = useState<string>('srv-gamers');
  const [currentChannelId, setCurrentChannelId] = useState<string>('ch-game-general');
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [messages, setMessages] = useState<{ [channelId: string]: Message[] }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const [soundboardNotice, setSoundboardNotice] = useState<{ sound: string; userName: string; id: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isVoiceStageOpen, setIsVoiceStageOpen] = useState(false);
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Helper to send WS messages safely
  const sendWs = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // Fetch initial bootstrap state
  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
        setUsers(data.users || []);
        setMessages(data.messages || {});
        setVoiceParticipants(data.voiceParticipants || []);

        // Pick first server and channel if current not in list
        if (data.servers?.length > 0) {
          const srv = data.servers[0];
          setCurrentServerId(srv.id);
          const firstTextCh = srv.channels?.find((c: Channel) => c.type === 'text');
          if (firstTextCh) {
            setCurrentChannelId(firstTextCh.id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to bootstrap app state:', e);
    }
  }, []);

  // Check saved session or prompt guest/login
  useEffect(() => {
    fetchBootstrap();

    const savedToken = localStorage.getItem('concord_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            setIsAuthModalOpen(true);
          }
        })
        .catch(() => {
          setIsAuthModalOpen(true);
        });
    } else {
      // Auto open modal so user can join immediately without email
      setIsAuthModalOpen(true);
    }
  }, [fetchBootstrap]);

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (currentUser) {
          ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
        }
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('WS Parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = err => {
        console.warn('WS Error:', err);
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [currentUser]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'chat:message': {
        const msg: Message = data.message;
        setMessages(prev => {
          const list = prev[msg.channelId] ? [...prev[msg.channelId]] : [];
          if (!list.some(m => m.id === msg.id)) {
            list.push(msg);
          }
          return { ...prev, [msg.channelId]: list };
        });
        break;
      }

      case 'chat:reaction_updated': {
        const { channelId, messageId, reactions } = data;
        setMessages(prev => {
          const list = prev[channelId] || [];
          return {
            ...prev,
            [channelId]: list.map(m => (m.id === messageId ? { ...m, reactions } : m)),
          };
        });
        break;
      }

      case 'chat:typing': {
        const { channelId, userId, userName, isTyping } = data;
        setTypingUsers(prev => {
          if (isTyping) {
            return { ...prev, [userId]: userName };
          } else {
            const next = { ...prev };
            delete next[userId];
            return next;
          }
        });
        break;
      }

      case 'chat:deleted': {
        const { channelId, messageId } = data;
        setMessages(prev => {
          const list = prev[channelId] || [];
          return {
            ...prev,
            [channelId]: list.filter(m => m.id !== messageId),
          };
        });
        break;
      }

      // Voice Channel events
      case 'voice:sync': {
        setVoiceParticipants(data.participants || []);
        break;
      }

      case 'voice:joined_ack': {
        const { peers } = data;
        // Connect to existing peers in the voice channel
        peers.forEach((peer: any) => {
          if (webrtcRef.current && peer.userId !== currentUser?.id) {
            webrtcRef.current.connectToPeer(peer.userId);
          }
        });
        break;
      }

      case 'voice:participant_joined': {
        const p: VoiceParticipant = data.participant;
        setVoiceParticipants(prev => {
          const filtered = prev.filter(item => item.userId !== p.userId);
          return [...filtered, p];
        });
        playSound('join');
        break;
      }

      case 'voice:participant_left': {
        const { userId } = data;
        setVoiceParticipants(prev => prev.filter(item => item.userId !== userId));
        if (webrtcRef.current) {
          webrtcRef.current.removePeer(userId);
        }
        setSpeakingUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        playSound('leave');
        break;
      }

      case 'voice:state_updated': {
        const { userId, isMuted: peerMuted, isDeafened: peerDeaf, isScreenSharing: peerShare } = data;
        setVoiceParticipants(prev =>
          prev.map(p =>
            p.userId === userId
              ? {
                  ...p,
                  isMuted: peerMuted ?? p.isMuted,
                  isDeafened: peerDeaf ?? p.isDeafened,
                  isScreenSharing: peerShare ?? p.isScreenSharing,
                }
              : p
          )
        );
        break;
      }

      case 'voice:speaking_updated': {
        const { userId, isSpeaking } = data;
        setSpeakingUsers(prev => {
          const next = new Set(prev);
          if (isSpeaking) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
        break;
      }

      case 'voice:signal': {
        const { fromUserId, signal } = data;
        if (webrtcRef.current) {
          webrtcRef.current.handleSignal(fromUserId, signal);
        }
        break;
      }

      case 'voice:soundboard_triggered': {
        const { sound, userName } = data;
        playSound(sound as SoundEffectType);
        setSoundboardNotice({ sound, userName, id: Date.now() });
        setTimeout(() => {
          setSoundboardNotice(null);
        }, 3000);
        break;
      }

      case 'presence:update': {
        const { userId, status, customStatus, bio } = data;
        setUsers(prev =>
          prev.map(u =>
            u.id === userId
              ? {
                  ...u,
                  status: status || u.status,
                  customStatus: customStatus !== undefined ? customStatus : u.customStatus,
                  bio: bio !== undefined ? bio : u.bio,
                }
              : u
          )
        );
        break;
      }

      case 'server:created': {
        const newServer: Server = data.server;
        setServers(prev => (prev.some(s => s.id === newServer.id) ? prev : [...prev, newServer]));
        break;
      }

      case 'channel:created': {
        const newChannel: Channel = data.channel;
        setServers(prev =>
          prev.map(s => {
            if (s.id === newChannel.serverId) {
              const chs = s.channels.some(c => c.id === newChannel.id)
                ? s.channels
                : [...s.channels, newChannel];
              return { ...s, channels: chs };
            }
            return s;
          })
        );
        break;
      }
    }
  }, [currentUser]);

  // Voice Channel Join / Leave
  const joinVoiceChannel = async (channelId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // Clean existing WebRTC
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
    }

    const currentServer = servers.find(s => s.channels.some(c => c.id === channelId));

    // Create new WebRTC manager instance
    const manager = new WebRTCManager({
      onSignal: (toUserId, signal) => {
        sendWs({
          type: 'voice:signal',
          toUserId,
          fromUserId: currentUser.id,
          channelId,
          signal,
        });
      },
      onSpeakingChange: isSpeaking => {
        setSpeakingUsers(prev => {
          const next = new Set(prev);
          if (isSpeaking) next.add(currentUser.id);
          else next.delete(currentUser.id);
          return next;
        });
        sendWs({
          type: 'voice:speaking',
          userId: currentUser.id,
          channelId,
          isSpeaking,
        });
      },
      onRemoteStream: (peerId, stream) => {
        setRemoteStreams(prev => new Map(prev).set(peerId, stream));
      },
      onRemoteStreamRemoved: peerId => {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      },
      onAudioLevel: level => {
        setMicAudioLevel(level);
      },
      onError: msg => {
        console.info(msg);
      },
    });

    webrtcRef.current = manager;
    await manager.startLocalAudio();
    manager.setMuted(isMuted);
    manager.setDeafened(isDeafened);

    setActiveVoiceChannelId(channelId);
    setIsVoiceStageOpen(true);

    sendWs({
      type: 'voice:join',
      channelId,
      serverId: currentServer?.id || currentServerId,
      userId: currentUser.id,
      isMuted,
      isDeafened,
    });

    playSound('join');
  };

  const leaveVoiceChannel = () => {
    if (activeVoiceChannelId && currentUser) {
      sendWs({
        type: 'voice:leave',
        channelId: activeVoiceChannelId,
        userId: currentUser.id,
      });

      if (webrtcRef.current) {
        webrtcRef.current.destroy();
        webrtcRef.current = null;
      }

      setActiveVoiceChannelId(null);
      setIsVoiceStageOpen(false);
      setIsScreenSharing(false);
      setLocalScreenStream(null);
      setRemoteStreams(new Map());
      setSpeakingUsers(prev => {
        const next = new Set(prev);
        next.delete(currentUser.id);
        return next;
      });
      playSound('leave');
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (webrtcRef.current) {
      webrtcRef.current.setMuted(nextMuted);
    }
    if (activeVoiceChannelId && currentUser) {
      sendWs({
        type: 'voice:state',
        userId: currentUser.id,
        channelId: activeVoiceChannelId,
        isMuted: nextMuted,
      });
    }
    playSound(nextMuted ? 'mute' : 'unmute');
  };

  const toggleDeafen = () => {
    const nextDeaf = !isDeafened;
    setIsDeafened(nextDeaf);
    if (webrtcRef.current) {
      webrtcRef.current.setDeafened(nextDeaf);
    }
    if (activeVoiceChannelId && currentUser) {
      sendWs({
        type: 'voice:state',
        userId: currentUser.id,
        channelId: activeVoiceChannelId,
        isDeafened: nextDeaf,
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!webrtcRef.current || !activeVoiceChannelId || !currentUser) return;

    const stream = await webrtcRef.current.toggleScreenShare();
    const sharing = !!stream;
    setIsScreenSharing(sharing);
    setLocalScreenStream(stream);

    sendWs({
      type: 'voice:state',
      userId: currentUser.id,
      channelId: activeVoiceChannelId,
      isScreenSharing: sharing,
    });
  };

  const setPeerVolume = (userId: string, volume: number) => {
    if (webrtcRef.current) {
      webrtcRef.current.setPeerVolume(userId, volume);
    }
  };

  const triggerSoundboard = (sound: SoundEffectType) => {
    if (!currentUser) return;
    playSound(sound);
    sendWs({
      type: 'voice:soundboard',
      sound,
      channelId: activeVoiceChannelId || currentChannelId,
      userId: currentUser.id,
    });
  };

  // Chat Actions
  const sendMessage = (content: string, attachments?: Attachment[], replyTo?: any) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    sendWs({
      type: 'chat:send',
      channelId: currentChannelId,
      senderId: currentUser.id,
      content,
      attachments,
      replyTo,
    });
  };

  const sendTyping = (isTyping: boolean) => {
    if (!currentUser) return;
    sendWs({
      type: 'chat:typing',
      channelId: currentChannelId,
      userId: currentUser.id,
      isTyping,
    });
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    sendWs({
      type: 'chat:reaction',
      channelId: currentChannelId,
      messageId,
      emoji,
      userId: currentUser.id,
    });
  };

  const deleteMessage = (messageId: string) => {
    if (!currentUser) return;
    sendWs({
      type: 'chat:delete',
      channelId: currentChannelId,
      messageId,
      userId: currentUser.id,
    });
  };

  // Channel & Server navigation
  const selectServer = (serverId: string) => {
    setCurrentServerId(serverId);
    const srv = servers.find(s => s.id === serverId);
    if (srv && srv.channels.length > 0) {
      const textCh = srv.channels.find(c => c.type === 'text') || srv.channels[0];
      setCurrentChannelId(textCh.id);
    }
  };

  const selectChannel = (channelId: string) => {
    const srv = servers.find(s => s.channels.some(c => c.id === channelId));
    if (srv) {
      setCurrentServerId(srv.id);
      const ch = srv.channels.find(c => c.id === channelId);
      if (ch?.type === 'voice') {
        joinVoiceChannel(channelId);
      } else {
        setCurrentChannelId(channelId);
      }
    }
  };

  // Auth Methods (No email required!)
  const register = async (
    username: string,
    password?: string,
    displayName?: string,
    avatarColor?: string,
    avatarIcon?: string,
    bio?: string
  ) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName, avatarColor, avatarIcon, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '登録に失敗しました' };
      }
      localStorage.setItem('concord_token', data.token);
      setCurrentUser(data.user);
      setIsAuthModalOpen(false);
      fetchBootstrap();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'ネットワークエラー' };
    }
  };

  const guestLogin = async (displayName?: string, avatarColor?: string, avatarIcon?: string) => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatarColor, avatarIcon }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'ゲスト参加に失敗しました' };
      }
      localStorage.setItem('concord_token', data.token);
      setCurrentUser(data.user);
      setIsAuthModalOpen(false);
      fetchBootstrap();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'ネットワークエラー' };
    }
  };

  const login = async (username: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'ログインに失敗しました' };
      }
      localStorage.setItem('concord_token', data.token);
      setCurrentUser(data.user);
      setIsAuthModalOpen(false);
      fetchBootstrap();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'ネットワークエラー' };
    }
  };

  const logout = () => {
    if (activeVoiceChannelId) {
      leaveVoiceChannel();
    }
    localStorage.removeItem('concord_token');
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Create Channel & Server
  const createChannel = async (name: string, type: 'text' | 'voice', topic?: string) => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServerId, name, type, topic }),
      });
      if (res.ok) {
        const ch: Channel = await res.json();
        setCurrentChannelId(ch.id);
        setIsCreateChannelModalOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const createServer = async (name: string, iconBg?: string, description?: string) => {
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          iconBg: iconBg || '#5865F2',
          description,
          ownerId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const srv: Server = await res.json();
        selectServer(srv.id);
        setIsCreateServerModalOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateUserStatus = (status: UserStatus, customStatus?: string, bio?: string) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      status,
      customStatus: customStatus !== undefined ? customStatus : currentUser.customStatus,
      bio: bio !== undefined ? bio : currentUser.bio,
    };
    setCurrentUser(updated);
    sendWs({
      type: 'presence:update',
      userId: currentUser.id,
      status,
      customStatus,
      bio,
    });
  };

  const currentServer = servers.find(s => s.id === currentServerId) || servers[0] || null;
  const currentChannel = currentServer?.channels.find(c => c.id === currentChannelId) || null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        servers,
        currentServerId,
        currentChannelId,
        currentServer,
        currentChannel,
        activeVoiceChannelId,
        voiceParticipants,
        messages,
        isMuted,
        isDeafened,
        isScreenSharing,
        speakingUsers,
        micAudioLevel,
        remoteStreams,
        localScreenStream,
        typingUsers,
        soundboardNotice,
        isConnected,

        isAuthModalOpen,
        setIsAuthModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isCreateChannelModalOpen,
        setIsCreateChannelModalOpen,
        isCreateServerModalOpen,
        setIsCreateServerModalOpen,
        isVoiceStageOpen,
        setIsVoiceStageOpen,
        isMembersSidebarOpen,
        setIsMembersSidebarOpen,

        login,
        register,
        guestLogin,
        logout,
        selectServer,
        selectChannel,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleScreenShare,
        setPeerVolume,
        sendMessage,
        sendTyping,
        addReaction,
        deleteMessage,
        createChannel,
        createServer,
        updateUserStatus,
        triggerSoundboard,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
