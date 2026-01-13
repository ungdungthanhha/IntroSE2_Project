// src/types/types.ts

// --- PHẦN CỦA CHÂU (Mobile Team) ---
export interface User {
  uid: string;
  username: string;
  email: string;
  birthday: string;
  avatarUrl: string;
  bio: string;
  role: string;
  followersCount: number;
  followingCount: number;
}

export interface Video {
  id: string;
  ownerUid: string;     // Lưu ý: Team dùng ownerUid chứ không phải userId
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
  timestamp:  number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: number;
  otherUser: Partial<User>;
}

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

export interface Report {
  id: string;
  videoId: string;
  reason: string;        // Lý do báo cáo (VD: Bạo lực, Nhạy cảm)
  reportedByUid: string; // ID người báo cáo
  status: 'pending' | 'resolved' | 'rejected'; // Trạng thái xử lý
  createdAt: number;
}