export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarIcon?: string;
  customStatus?: string;
  status: UserStatus;
  createdAt: number;
  bio?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

export interface Message {
  id: string;
  channelId: string;
  serverId?: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  senderAvatarIcon?: string;
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  reactions: Reaction[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

export type ChannelType = 'text' | 'voice';

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  topic?: string;
  type: ChannelType;
  isPrivate?: boolean;
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  iconBg: string;
  description?: string;
  ownerId: string;
  channels: Channel[];
  memberIds: string[];
}

export interface VoiceParticipant {
  userId: string;
  user: User;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

export interface DirectMessageThread {
  id: string;
  recipient: User;
  lastMessage?: Message;
  unreadCount: number;
}
