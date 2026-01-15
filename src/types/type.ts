
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
  rfollowingCount: number;
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
  viewCount: number;
  createdAt: number;
  isLiked?: boolean;
  isSaved?: boolean;
  thumbUrl?: string;
  // Thông tin Sound gắn kèm
  soundId: string;
  soundName: string;
  soundThumb: string;
  soundAudioUrl?: string | null; // Link audio để phát song song với video
}

export interface Sound {
  id: string;
  name: string;             // Tên hiển thị
  ownerUid: string;         // 'apple_music' hoặc uid của user
  ownerName: string;        // Tên ca sĩ hoặc username
  ownerAvatar: string;
  audioUrl: string;         // Link mp3/preview
  thumbnailUrl: string;
  usageCount: number;
  createdAt: number;
  isSystemSound?: boolean;  // True nếu là nhạc iTunes
  originalVideoId?: string; // Nếu là Original Sound, lưu ID video gốc
}

export interface Comment {
  id: string;
  videoId: string;
  userUid: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: number;
  likesCount?: number;
  isLiked?: boolean;
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

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  VIOLENCE = 'violence',
  FALSE_INFO = 'false_info',
  OTHER = 'other'
}

export interface Report {
  id: string;
  videoId: string;
  reportedBy: string;        // User ID who reported
  reporterName: string;       // Username for display
  reason: ReportReason;
  additionalInfo?: string;    // Optional additional details
  timestamp: number;
  status: 'pending' | 'reviewed' | 'dismissed';
}
