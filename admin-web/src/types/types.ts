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
  createdAt?: number;   // Mobile app dùng createdAt thay vì timestamp
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
  reason: string;           // Lý do báo cáo (spam, inappropriate, harassment, violence, false_info, other)
  additionalInfo?: string;  // Chi tiết thêm (nếu chọn "other")
  reportedBy: string;       // User ID người báo cáo (mobile dùng tên này)
  reportedByUid?: string;   // Alias cho reportedBy (backwards compatibility)
  reporterName?: string;    // Tên người báo cáo
  status: 'pending' | 'resolved' | 'rejected' | 'reviewed' | 'dismissed'; // Trạng thái xử lý
  timestamp?: number;       // Mobile app dùng timestamp
  createdAt?: number;       // Admin-web dùng createdAt (fallback)
}

export interface CommentReport {
  id: string;
  commentId: string;          // ID của comment bị report
  videoId: string;            // ID video chứa comment
  reportedBy: string;         // User ID người report
  reporterName?: string;      // Username để hiển thị
  commentText: string;        // Nội dung comment (lưu để admin review khi comment bị xóa)
  commentOwnerUid: string;    // User ID của người viết comment
  commentOwnerName: string;   // Username của người viết comment
  reason: string;
  additionalInfo?: string;    // Chi tiết thêm (nếu chọn "other")
  timestamp?: number;
  createdAt?: number;
  status: 'pending' | 'resolved' | 'rejected' | 'reviewed' | 'dismissed';
}