// src/services/searchService.ts
import firestore from '@react-native-firebase/firestore';
import { db } from '../config/firebase'; 

const STATS_COLLECTION = 'search_statistics';

// 1. Hàm ghi nhận (Quan trọng nhất: Tự tạo nếu chưa có)
export const trackSearch = async (keyword: string) => {
  try {
    const cleanKeyword = keyword.trim();
    if (!cleanKeyword) return;

    // Tự động tạo document nếu chưa có, hoặc update nếu đã có
    await db.collection(STATS_COLLECTION).doc(cleanKeyword.toLowerCase()).set({
      text: cleanKeyword, 
      count: firestore.FieldValue.increment(1), // Cộng 1 điểm
      lastSearched: firestore.FieldValue.serverTimestamp()
    }, { merge: true }); // <--- QUAN TRỌNG: merge=true giúp tạo mới nếu chưa có

  } catch (error) {
    console.error("Lỗi track search:", error);
  }
};

// 2. Hàm lấy danh sách (Chỉ lấy cái nào count > 0)
export const getTrendingKeywords = async (): Promise<string[]> => {
  try {
    const snapshot = await db.collection(STATS_COLLECTION)
      .orderBy('count', 'desc')
      .limit(10)
      .get();

    return snapshot.docs.map(doc => doc.data().text);
  } catch (error) {
    return [];
  }
};