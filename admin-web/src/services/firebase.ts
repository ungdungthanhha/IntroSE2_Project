// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";       // <--- Thêm cái này để Đăng nhập
import { getStorage } from "firebase/storage"; // <--- Thêm cái này để xem Ảnh/Video
import { firebaseConfig } from "../config/firebaseConfig"; // Giữ nguyên file config của bạn

// 1. Khởi tạo App
export const app = initializeApp(firebaseConfig);

// 2. Xuất các công cụ cần dùng
export const db = getFirestore(app);
export const auth = getAuth(app);       // <--- Export ra để dùng ở Login
export const storage = getStorage(app); // <--- Export ra để dùng hiển thị ảnh

// 3. Định nghĩa tên các bảng (Collection) cho giống hệt App Mobile
// (Giúp bạn code ở các trang khác không bị gõ nhầm 'user' thành 'users' v.v.)
export const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  CHATS: 'chats',
  LIVESTREAMS: 'livestreams',
  REPORTS: 'reports', // Web Admin tự thêm bảng này
  COMMENT_REPORTS: 'comment_reports',
};