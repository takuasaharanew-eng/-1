import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '25mb' }));

interface UserData {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  avatarColor: string;
  avatarIcon?: string;
  customStatus?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  createdAt: number;
  bio?: string;
}

interface MessageData {
  id: string;
  channelId: string;
  serverId?: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  senderAvatarIcon?: string;
  content: string;
  createdAt: number;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'file';
    size?: number;
  }[];
  reactions: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

interface ChannelData {
  id: string;
  serverId: string;
  name: string;
  topic?: string;
  type: 'text' | 'voice';
  isPrivate?: boolean;
}

interface ServerData {
  id: string;
  name: string;
  icon?: string;
  iconBg: string;
  description?: string;
  ownerId: string;
  channels: ChannelData[];
  memberIds: string[];
}

interface VoiceParticipantData {
  userId: string;
  channelId: string;
  serverId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

// In-memory Database
const users: Map<string, UserData> = new Map();
const servers: Map<string, ServerData> = new Map();
const messages: Map<string, MessageData[]> = new Map(); // channelId -> messages
const voiceParticipants: Map<string, VoiceParticipantData> = new Map(); // userId -> VoiceParticipantData

// Seed default members
const defaultUsers: UserData[] = [
  {
    id: 'user-ren',
    username: 'ren_games',
    displayName: 'レン 🎮',
    avatarColor: '#5865F2',
    avatarIcon: '🦊',
    customStatus: '今夜Apex募集！',
    status: 'online',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    bio: 'FPSとRPGが好きです。VCいつでも歓迎！',
  },
  {
    id: 'user-sakura',
    username: 'sakura_dev',
    displayName: 'Sakura 🌸',
    avatarColor: '#EB459E',
    avatarIcon: '🌸',
    customStatus: 'React & TypeScript開発中',
    status: 'online',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    bio: 'フロントエンド開発者。もくもく作業部屋によくいます。',
  },
  {
    id: 'user-kento',
    username: 'kento_coffee',
    displayName: 'けんと ☕',
    avatarColor: '#FEE75C',
    avatarIcon: '☕',
    customStatus: '作業用BGM配信中',
    status: 'idle',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    bio: '珈琲を淹れながらチルしています。',
  },
  {
    id: 'user-momo',
    username: 'momo_music',
    displayName: 'Momo 🎵',
    avatarColor: '#57F287',
    avatarIcon: '🎧',
    customStatus: '作業用プレイリスト作成中',
    status: 'dnd',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    bio: 'Lo-FiとSynthwaveが好き。',
  },
];

defaultUsers.forEach(u => users.set(u.id, u));

// Seed default servers
const seedServers: ServerData[] = [
  {
    id: 'srv-gamers',
    name: '🎮 ゲーマーズ・ラウンジ',
    icon: '🎮',
    iconBg: '#5865F2',
    description: 'ゲーム仲間が集まる雑談＆ボイスチャットコミュニティ',
    ownerId: 'user-ren',
    memberIds: ['user-ren', 'user-sakura', 'user-kento', 'user-momo'],
    channels: [
      { id: 'ch-game-general', serverId: 'srv-gamers', name: '一般-chat', topic: '雑談やゲームの話題はこちら！', type: 'text' },
      { id: 'ch-game-recruit', serverId: 'srv-gamers', name: 'パーティ募集', topic: 'ランク・カジュアル参加者募集！', type: 'text' },
      { id: 'ch-game-clips', serverId: 'srv-gamers', name: 'クリップ・動画', topic: '神プレイや面白クリップ共有', type: 'text' },
      { id: 'ch-game-voice-main', serverId: 'srv-gamers', name: 'メインボイス (低遅延)', type: 'voice' },
      { id: 'ch-game-voice-squad', serverId: 'srv-gamers', name: 'スカッドルーム 1', type: 'voice' },
      { id: 'ch-game-voice-chill', serverId: 'srv-gamers', name: 'まったりVC', type: 'voice' },
    ],
  },
  {
    id: 'srv-cafe',
    name: '☕ カフェ＆雑談',
    icon: '☕',
    iconBg: '#E67E22',
    description: '日常の雑談や作業、のんびり通話を楽しむスペース',
    ownerId: 'user-kento',
    memberIds: ['user-ren', 'user-sakura', 'user-kento', 'user-momo'],
    channels: [
      { id: 'ch-cafe-general', serverId: 'srv-cafe', name: '雑談-chill', topic: '今日あったことや気楽なおしゃべり', type: 'text' },
      { id: 'ch-cafe-food', serverId: 'srv-cafe', name: '飯テロ・写真', topic: '今日のご飯やお気に入りの写真', type: 'text' },
      { id: 'ch-cafe-intro', serverId: 'srv-cafe', name: '自己紹介', topic: '新しく入った方はこちらで自己紹介をどうぞ！', type: 'text' },
      { id: 'ch-cafe-voice-bgm', serverId: 'srv-cafe', name: 'カフェBGM・談話', type: 'voice' },
      { id: 'ch-cafe-voice-night', serverId: 'srv-cafe', name: '深夜の語り場', type: 'voice' },
    ],
  },
  {
    id: 'srv-tech',
    name: '💻 テック＆クリエイター',
    icon: '💻',
    iconBg: '#3BA55D',
    description: 'プログラミング、デザイン、創作活動の情報交換と作業部屋',
    ownerId: 'user-sakura',
    memberIds: ['user-ren', 'user-sakura', 'user-kento'],
    channels: [
      { id: 'ch-tech-general', serverId: 'srv-tech', name: 'dev-chat', topic: '技術の話題や新ツールについて', type: 'text' },
      { id: 'ch-tech-qa', serverId: 'srv-tech', name: '質問・相談', topic: 'エラーや設計の相談はこちら', type: 'text' },
      { id: 'ch-tech-showcase', serverId: 'srv-tech', name: '作品ショーケース', topic: '個人開発や制作物を紹介！', type: 'text' },
      { id: 'ch-tech-voice-study', serverId: 'srv-tech', name: 'もくもく作業部屋 (VC)', type: 'voice' },
      { id: 'ch-tech-voice-review', serverId: 'srv-tech', name: '画面共有・コード相談', type: 'voice' },
    ],
  },
];

seedServers.forEach(s => servers.set(s.id, s));

// Seed initial messages
const seedMessages: { [channelId: string]: MessageData[] } = {
  'ch-game-general': [
    {
      id: 'msg-1',
      channelId: 'ch-game-general',
      serverId: 'srv-gamers',
      senderId: 'user-ren',
      senderName: 'レン 🎮',
      senderAvatarColor: '#5865F2',
      senderAvatarIcon: '🦊',
      content: 'ゲーマーズ・ラウンジへようこそ！Discordのようにメールアドレスなしでアカウント作成＆参加できます！ボイスチャンネルで通話も試してみてね🎧',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      reactions: [
        { emoji: '👋', count: 3, users: ['user-sakura', 'user-kento', 'user-momo'] },
        { emoji: '🔥', count: 2, users: ['user-ren', 'user-sakura'] },
      ],
    },
    {
      id: 'msg-2',
      channelId: 'ch-game-general',
      serverId: 'srv-gamers',
      senderId: 'user-sakura',
      senderName: 'Sakura 🌸',
      senderAvatarColor: '#EB459E',
      senderAvatarIcon: '🌸',
      content: 'リアルタイム通話（WebRTC）もマイクとスピーカーがあればブラウザですぐ繋がります！画面共有も対応してますよ✨',
      createdAt: Date.now() - 1000 * 60 * 45,
      reactions: [{ emoji: '🎉', count: 2, users: ['user-ren', 'user-kento'] }],
    },
    {
      id: 'msg-3',
      channelId: 'ch-game-general',
      serverId: 'srv-gamers',
      senderId: 'user-kento',
      senderName: 'けんと ☕',
      senderAvatarColor: '#FEE75C',
      senderAvatarIcon: '☕',
      content: '今夜はみんなでVC繋いでカジュアルマッチやりましょう〜！',
      createdAt: Date.now() - 1000 * 60 * 15,
      reactions: [{ emoji: '👍', count: 1, users: ['user-ren'] }],
    },
  ],
  'ch-cafe-general': [
    {
      id: 'msg-c1',
      channelId: 'ch-cafe-general',
      serverId: 'srv-cafe',
      senderId: 'user-kento',
      senderName: 'けんと ☕',
      senderAvatarColor: '#FEE75C',
      senderAvatarIcon: '☕',
      content: 'みなさんこんにちは！落ち着いた雰囲気で話せるカフェサーバーです。作業用VCも自由に使ってくださいね。',
      createdAt: Date.now() - 1000 * 60 * 120,
      reactions: [{ emoji: '☕', count: 4, users: ['user-ren', 'user-sakura', 'user-kento', 'user-momo'] }],
    },
  ],
  'ch-tech-general': [
    {
      id: 'msg-t1',
      channelId: 'ch-tech-general',
      serverId: 'srv-tech',
      senderId: 'user-sakura',
      senderName: 'Sakura 🌸',
      senderAvatarColor: '#EB459E',
      senderAvatarIcon: '🌸',
      content: 'テックサーバーを作りました！コード相談や個人開発の進捗報告など自由に書き込んでください！',
      createdAt: Date.now() - 1000 * 60 * 90,
      reactions: [{ emoji: '💻', count: 2, users: ['user-kento', 'user-ren'] }],
    },
  ],
};

Object.entries(seedMessages).forEach(([chId, msgs]) => {
  messages.set(chId, msgs);
});

// Seed one mock user in voice channel so user immediately sees live voice channel occupancy!
voiceParticipants.set('user-kento', {
  userId: 'user-kento',
  channelId: 'ch-cafe-voice-bgm',
  serverId: 'srv-cafe',
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  isScreenSharing: false,
  joinedAt: Date.now() - 1000 * 60 * 30,
});

// REST API Endpoints

// Register (No email required!)
app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName, avatarColor, avatarIcon, bio } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'ユーザー名を入力してください。' });
  }

  const cleanUsername = username.trim().toLowerCase();
  for (const u of users.values()) {
    if (u.username.toLowerCase() === cleanUsername) {
      return res.status(400).json({ error: 'そのユーザー名は既に使用されています。' });
    }
  }

  const newUser: UserData = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    password: password || '',
    displayName: (displayName && displayName.trim()) || username,
    avatarColor: avatarColor || '#5865F2',
    avatarIcon: avatarIcon || '👤',
    customStatus: '',
    status: 'online',
    createdAt: Date.now(),
    bio: bio || 'コミュニティに参加しました！',
  };

  users.set(newUser.id, newUser);

  // Add new user to all default servers
  servers.forEach(s => {
    if (!s.memberIds.includes(newUser.id)) {
      s.memberIds.push(newUser.id);
    }
  });

  const { password: _, ...userSafe } = newUser;
  return res.json({ user: userSafe, token: newUser.id });
});

// Guest / Instant Login (1-click without even password)
app.post('/api/auth/guest', (req, res) => {
  const { displayName, avatarColor, avatarIcon } = req.body;
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const name = displayName && displayName.trim() ? displayName.trim() : `ゲスト_${randomNum}`;
  const username = `guest_${randomNum}_${Math.random().toString(36).substring(2, 5)}`;

  const colors = ['#5865F2', '#EB459E', '#57F287', '#FEE75C', '#ED4245', '#9B59B6', '#1ABC9C'];
  const icons = ['🎮', '🚀', '🦊', '🐱', '☕', '⚡', '🎧', '👾', '🌟'];

  const newUser: UserData = {
    id: `user-guest-${Date.now()}`,
    username,
    displayName: name,
    avatarColor: avatarColor || colors[Math.floor(Math.random() * colors.length)],
    avatarIcon: avatarIcon || icons[Math.floor(Math.random() * icons.length)],
    customStatus: 'ゲストとして参加中',
    status: 'online',
    createdAt: Date.now(),
    bio: 'メールアドレスなしのゲスト登録で参加しました。',
  };

  users.set(newUser.id, newUser);

  // Add to default servers
  servers.forEach(s => {
    if (!s.memberIds.includes(newUser.id)) {
      s.memberIds.push(newUser.id);
    }
  });

  return res.json({ user: newUser, token: newUser.id });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'ユーザー名を入力してください。' });
  }

  const cleanUsername = username.trim().toLowerCase();
  let found: UserData | null = null;
  for (const u of users.values()) {
    if (u.username.toLowerCase() === cleanUsername) {
      found = u;
      break;
    }
  }

  if (!found) {
    return res.status(404).json({ error: 'ユーザーが見つかりません。新規登録してください。' });
  }

  if (found.password && found.password !== password) {
    return res.status(401).json({ error: 'パスワードが正しくありません。' });
  }

  found.status = 'online';
  const { password: _, ...userSafe } = found;
  return res.json({ user: userSafe, token: found.id });
});

// Get Me
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token || !users.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const u = users.get(token)!;
  const { password: _, ...userSafe } = u;
  return res.json({ user: userSafe });
});

// Bootstrap initial application state
app.get('/api/bootstrap', (req, res) => {
  const serverList = Array.from(servers.values());
  const userList = Array.from(users.values()).map(({ password, ...u }) => u);
  const voiceList = Array.from(voiceParticipants.values()).map(vp => ({
    ...vp,
    user: users.get(vp.userId),
  }));

  const allMessages: { [chId: string]: MessageData[] } = {};
  messages.forEach((msgs, chId) => {
    allMessages[chId] = msgs;
  });

  return res.json({
    servers: serverList,
    users: userList,
    messages: allMessages,
    voiceParticipants: voiceList,
  });
});

// Create Server
app.post('/api/servers', (req, res) => {
  const { name, icon, iconBg, description, ownerId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'サーバー名を入力してください。' });
  }

  const serverId = `srv-${Date.now()}`;
  const defaultChannels: ChannelData[] = [
    { id: `ch-${serverId}-general`, serverId, name: '一般-chat', topic: 'ようこそ！', type: 'text' },
    { id: `ch-${serverId}-voice`, serverId, name: 'ボイスチャンネル', type: 'voice' },
  ];

  const newServer: ServerData = {
    id: serverId,
    name: name.trim(),
    icon: icon || name.trim().slice(0, 2),
    iconBg: iconBg || '#5865F2',
    description: description || '',
    ownerId: ownerId || 'unknown',
    channels: defaultChannels,
    memberIds: Array.from(users.keys()),
  };

  servers.set(serverId, newServer);
  messages.set(defaultChannels[0].id, [
    {
      id: `msg-${Date.now()}`,
      channelId: defaultChannels[0].id,
      serverId,
      senderId: ownerId || 'system',
      senderName: 'システム',
      senderAvatarColor: '#5865F2',
      senderAvatarIcon: '🤖',
      content: `🎉 ${name} サーバーが作成されました！チャンネル作成やVC通話を楽しんでください！`,
      createdAt: Date.now(),
      reactions: [],
    },
  ]);

  broadcast({
    type: 'server:created',
    server: newServer,
  });

  return res.json(newServer);
});

// Create Channel
app.post('/api/channels', (req, res) => {
  const { serverId, name, topic, type } = req.body;
  const server = servers.get(serverId);
  if (!server) {
    return res.status(404).json({ error: 'サーバーが見つかりません。' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'チャンネル名を入力してください。' });
  }

  const newChannel: ChannelData = {
    id: `ch-${serverId}-${Date.now()}`,
    serverId,
    name: name.trim().toLowerCase().replace(/\s+/g, '-'),
    topic: topic || '',
    type: type === 'voice' ? 'voice' : 'text',
  };

  server.channels.push(newChannel);
  if (newChannel.type === 'text') {
    messages.set(newChannel.id, []);
  }

  broadcast({
    type: 'channel:created',
    channel: newChannel,
  });

  return res.json(newChannel);
});

// Create HTTP server and attach WebSocketServer
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Map WebSocket to UserId
const clientSockets = new Map<WebSocket, string>();
const userSockets = new Map<string, WebSocket[]>();

function registerUserSocket(ws: WebSocket, userId: string) {
  clientSockets.set(ws, userId);
  const list = userSockets.get(userId) || [];
  list.push(ws);
  userSockets.set(userId, list);

  // Set user online
  const user = users.get(userId);
  if (user && user.status === 'offline') {
    user.status = 'online';
    broadcast({
      type: 'presence:update',
      userId,
      status: 'online',
    });
  }
}

function unregisterUserSocket(ws: WebSocket) {
  const userId = clientSockets.get(ws);
  clientSockets.delete(ws);
  if (userId) {
    const list = userSockets.get(userId) || [];
    const filtered = list.filter(s => s !== ws);
    if (filtered.length === 0) {
      userSockets.delete(userId);
      // Auto leave voice channel if active
      if (voiceParticipants.has(userId)) {
        const vp = voiceParticipants.get(userId)!;
        voiceParticipants.delete(userId);
        broadcast({
          type: 'voice:participant_left',
          userId,
          channelId: vp.channelId,
        });
      }
    } else {
      userSockets.set(userId, filtered);
    }
  }
}

function broadcast(payload: any, exceptWs?: WebSocket) {
  const data = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== exceptWs) {
      client.send(data);
    }
  });
}

function sendToUser(userId: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    const data = JSON.stringify(payload);
    sockets.forEach(s => {
      if (s.readyState === WebSocket.OPEN) {
        s.send(data);
      }
    });
  }
}

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (rawData: string) => {
    try {
      const msg = JSON.parse(rawData.toString());
      const { type } = msg;

      switch (type) {
        case 'auth': {
          if (msg.userId) {
            registerUserSocket(ws, msg.userId);
            // Send current voice state
            const voiceList = Array.from(voiceParticipants.values()).map(vp => ({
              ...vp,
              user: users.get(vp.userId),
            }));
            ws.send(
              JSON.stringify({
                type: 'voice:sync',
                participants: voiceList,
              })
            );
          }
          break;
        }

        case 'chat:send': {
          const { channelId, senderId, content, attachments, replyTo } = msg;
          const sender = users.get(senderId);
          if (!sender) return;

          const newMsg: MessageData = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            channelId,
            senderId,
            senderName: sender.displayName,
            senderAvatarColor: sender.avatarColor,
            senderAvatarIcon: sender.avatarIcon,
            content: content || '',
            createdAt: Date.now(),
            attachments: attachments || [],
            reactions: [],
            replyTo,
          };

          const list = messages.get(channelId) || [];
          list.push(newMsg);
          messages.set(channelId, list);

          broadcast({
            type: 'chat:message',
            message: newMsg,
          });
          break;
        }

        case 'chat:reaction': {
          const { channelId, messageId, emoji, userId } = msg;
          const list = messages.get(channelId);
          if (!list) return;

          const targetMsg = list.find(m => m.id === messageId);
          if (!targetMsg) return;

          let reaction = targetMsg.reactions.find(r => r.emoji === emoji);
          if (!reaction) {
            reaction = { emoji, count: 0, users: [] };
            targetMsg.reactions.push(reaction);
          }

          if (reaction.users.includes(userId)) {
            reaction.users = reaction.users.filter(u => u !== userId);
            reaction.count = reaction.users.length;
            if (reaction.count === 0) {
              targetMsg.reactions = targetMsg.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            reaction.users.push(userId);
            reaction.count = reaction.users.length;
          }

          broadcast({
            type: 'chat:reaction_updated',
            channelId,
            messageId,
            reactions: targetMsg.reactions,
          });
          break;
        }

        case 'chat:typing': {
          const { channelId, userId, isTyping } = msg;
          const user = users.get(userId);
          broadcast(
            {
              type: 'chat:typing',
              channelId,
              userId,
              userName: user?.displayName || '誰か',
              isTyping,
            },
            ws
          );
          break;
        }

        case 'chat:delete': {
          const { channelId, messageId, userId } = msg;
          const list = messages.get(channelId);
          if (!list) return;

          const idx = list.findIndex(m => m.id === messageId);
          if (idx !== -1 && list[idx].senderId === userId) {
            list.splice(idx, 1);
            broadcast({
              type: 'chat:deleted',
              channelId,
              messageId,
            });
          }
          break;
        }

        // Voice Channel Real-Time Signaling (WebRTC Mesh)
        case 'voice:join': {
          const { channelId, serverId, userId, isMuted, isDeafened } = msg;
          const user = users.get(userId);
          if (!user) return;

          // If user was already in another voice channel, leave first
          if (voiceParticipants.has(userId)) {
            const oldVp = voiceParticipants.get(userId)!;
            broadcast({
              type: 'voice:participant_left',
              userId,
              channelId: oldVp.channelId,
            });
          }

          const newParticipant: VoiceParticipantData = {
            userId,
            channelId,
            serverId,
            isMuted: !!isMuted,
            isDeafened: !!isDeafened,
            isSpeaking: false,
            isScreenSharing: false,
            joinedAt: Date.now(),
          };

          voiceParticipants.set(userId, newParticipant);

          // Find other members in this voice channel
          const currentPeersInChannel = Array.from(voiceParticipants.values())
            .filter(vp => vp.channelId === channelId && vp.userId !== userId)
            .map(vp => ({
              ...vp,
              user: users.get(vp.userId),
            }));

          // Send current peers to joining user so they can initiate WebRTC peer connections
          ws.send(
            JSON.stringify({
              type: 'voice:joined_ack',
              channelId,
              peers: currentPeersInChannel,
            })
          );

          // Broadcast to everyone that new participant joined
          broadcast({
            type: 'voice:participant_joined',
            participant: {
              ...newParticipant,
              user,
            },
          });
          break;
        }

        case 'voice:leave': {
          const { channelId, userId } = msg;
          if (voiceParticipants.has(userId)) {
            voiceParticipants.delete(userId);
            broadcast({
              type: 'voice:participant_left',
              userId,
              channelId,
            });
          }
          break;
        }

        case 'voice:state': {
          const { userId, channelId, isMuted, isDeafened, isScreenSharing } = msg;
          const vp = voiceParticipants.get(userId);
          if (vp && vp.channelId === channelId) {
            if (isMuted !== undefined) vp.isMuted = isMuted;
            if (isDeafened !== undefined) vp.isDeafened = isDeafened;
            if (isScreenSharing !== undefined) vp.isScreenSharing = isScreenSharing;

            broadcast({
              type: 'voice:state_updated',
              userId,
              channelId,
              isMuted: vp.isMuted,
              isDeafened: vp.isDeafened,
              isScreenSharing: vp.isScreenSharing,
            });
          }
          break;
        }

        case 'voice:speaking': {
          const { userId, channelId, isSpeaking } = msg;
          const vp = voiceParticipants.get(userId);
          if (vp && vp.channelId === channelId) {
            vp.isSpeaking = isSpeaking;
            broadcast({
              type: 'voice:speaking_updated',
              userId,
              channelId,
              isSpeaking,
            });
          }
          break;
        }

        // WebRTC Signaling Forwarding (Offer, Answer, Candidate)
        case 'voice:signal': {
          const { toUserId, fromUserId, signal, channelId } = msg;
          sendToUser(toUserId, {
            type: 'voice:signal',
            fromUserId,
            channelId,
            signal,
          });
          break;
        }

        // Soundboard effect
        case 'voice:soundboard': {
          const { sound, channelId, userId } = msg;
          const user = users.get(userId);
          broadcast({
            type: 'voice:soundboard_triggered',
            sound,
            channelId,
            userId,
            userName: user?.displayName || 'User',
          });
          break;
        }

        // Presence update
        case 'presence:update': {
          const { userId, status, customStatus, bio } = msg;
          const user = users.get(userId);
          if (user) {
            if (status) user.status = status;
            if (customStatus !== undefined) user.customStatus = customStatus;
            if (bio !== undefined) user.bio = bio;

            broadcast({
              type: 'presence:update',
              userId,
              status: user.status,
              customStatus: user.customStatus,
              bio: user.bio,
            });
          }
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('WS Error:', e);
    }
  });

  ws.on('close', () => {
    unregisterUserSocket(ws);
  });
});

// Vite middleware or production static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
