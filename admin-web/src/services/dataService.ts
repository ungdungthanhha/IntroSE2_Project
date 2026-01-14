// src/services/dataService.ts

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db, COLLECTIONS } from "../services/firebase";
import type { User, Video, Report } from "../types/types";

// --- TYPE MỞ RỘNG (Dùng cho nội bộ Admin) ---

// Report đầy đủ thông tin (gồm cả data Video và User để hiển thị lên bảng)
export type ReportPopulated = Report & {
  videoData?: Video;
  reporterData?: User;
};

// ==========================================
// 1. QUẢN LÝ VIDEO
// ==========================================

export const getVideos = async (): Promise<Video[]> => {
  try {
    const videosRef = collection(db, COLLECTIONS.VIDEOS);
    // Sắp xếp video mới nhất lên đầu
    const q = query(videosRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    // Ép kiểu về Video chuẩn
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Video[];
  } catch (error) {
    console.error("Lỗi lấy danh sách Video:", error);
    return [];
  }
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.VIDEOS, videoId));
    console.log(`Đã xóa vĩnh viễn video: ${videoId}`);
  } catch (error) {
    console.error("Lỗi xóa video:", error);
    throw error;
  }
};

// ==========================================
// 2. QUẢN LÝ USER
// ==========================================

export const getUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return snapshot.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    })) as User[];
  } catch (error) {
    console.error("Lỗi lấy danh sách User:", error);
    return [];
  }
};

// [QUAN TRỌNG] Hàm xóa User vĩnh viễn khỏi Database
// Lưu ý: Hành động này sẽ xóa User khỏi Firestore. 
// (Nếu muốn xóa cả Login Auth thì cần Cloud Functions, nhưng ở mức độ này xóa Firestore là đủ để họ mất data)
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
    console.log(`Đã xóa vĩnh viễn user: ${uid}`);
  } catch (error) {
    console.error("Lỗi xóa user:", error);
    throw error;
  }
};

// ==========================================
// 3. QUẢN LÝ BÁO CÁO (REPORTS)
// ==========================================

export const getReportsFull = async (): Promise<ReportPopulated[]> => {
  try {
    // Nếu chưa có collection REPORTS trong config thì fallback về string "reports"
    const reportColName = COLLECTIONS.REPORTS || "reports";

    // Lấy tất cả reports (sắp xếp sẽ thực hiện ở client vì có thể dùng timestamp hoặc createdAt)
    const reportSnap = await getDocs(collection(db, reportColName));

    const rawReports = reportSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Normalize: đảm bảo cả reportedBy và reportedByUid đều có giá trị
        reportedBy: data.reportedBy || data.reportedByUid || '',
        reportedByUid: data.reportedByUid || data.reportedBy || '',
        // Normalize: đảm bảo có timestamp
        createdAt: data.createdAt || data.timestamp || 0,
        timestamp: data.timestamp || data.createdAt || 0,
      } as Report;
    });

    // Sắp xếp báo cáo mới nhất lên đầu
    rawReports.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Kỹ thuật Populate: Lấy thêm thông tin Video và User dựa trên ID có trong report
    const populatedReports = await Promise.all(
      rawReports.map(async (report) => {
        let videoData: Video | undefined;
        let reporterData: User | undefined;

        // 1. Lấy info Video bị báo cáo
        try {
          const videoSnap = await getDoc(doc(db, COLLECTIONS.VIDEOS, report.videoId));
          if (videoSnap.exists()) {
            videoData = { id: videoSnap.id, ...videoSnap.data() } as Video;
          }
        } catch (e) { console.warn(`Video lỗi hoặc đã bị xóa: ${report.videoId}`); }

        // 2. Lấy info Người báo cáo (dùng reportedBy hoặc reportedByUid)
        const reporterUid = report.reportedBy || report.reportedByUid;
        if (reporterUid) {
          try {
            const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, reporterUid));
            if (userSnap.exists()) {
              reporterData = { uid: userSnap.id, ...userSnap.data() } as User;
            }
          } catch (e) { console.warn(`User báo cáo không tồn tại: ${reporterUid}`); }
        }

        return {
          ...report,
          videoData,
          reporterData
        };
      })
    );

    return populatedReports;
  } catch (error) {
    console.error("Lỗi lấy Reports:", error);
    return [];
  }
};

// Cập nhật trạng thái báo cáo (Ví dụ: Đánh dấu đã xử lý)
export const updateReportStatus = async (reportId: string, newStatus: 'resolved' | 'rejected'): Promise<void> => {
  try {
    const reportColName = COLLECTIONS.REPORTS || "reports";
    const reportRef = doc(db, reportColName, reportId);
    await updateDoc(reportRef, {
      status: newStatus
    });
  } catch (error) {
    console.error("Lỗi update report:", error);
    throw error;
  }
};