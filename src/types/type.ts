
export interface User {
  uid: string;
  username: string;
  role: 'admin' | 'user'; 
  displayName: string;
  email: string;
  birthday: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  instagramHandle?: string;
  youtubeHandle?: string;
}

export interface Video {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerAvatar: string;
  videoUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  timestamp: number;
  isLiked?: boolean;
  isSaved?: boolean;
  thumbUrl?: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userUid: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp:  number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: number;
  otherUser: Partial<User>;
}
// ...existing code...

export interface Livestream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  viewerCount: number;
  likesCount: number;
  isLive: boolean;
  createdAt: number;
}

export interface LiveComment {
  id: string;
  livestreamId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: number;
}

// ...existing code...
export enum AppTab {
  HOME = 'home',
  DISCOVER = 'discover',
  UPLOAD = 'upload',
  INBOX = 'inbox',
  PROFILE = 'profile',
  LIVE = 'live'
}
