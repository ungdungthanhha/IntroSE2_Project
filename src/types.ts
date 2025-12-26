
export interface User {
  uid: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
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
  timestamp: number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: number;
  otherUser: Partial<User>;
}

export enum AppTab {
  HOME = 'home',
  DISCOVER = 'discover',
  UPLOAD = 'upload',
  INBOX = 'inbox',
  PROFILE = 'profile',
  LIVE = 'live'
}
