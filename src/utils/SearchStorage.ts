// utils/SearchStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'SEARCH_HISTORY_KEY';
const MAX_HISTORY_ITEMS = 5; // Chỉ lưu 5 cái mới nhất

// 1. Lấy danh sách lịch sử
export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Lỗi đọc lịch sử", e);
    return [];
  }
};

// 2. Lưu từ khóa mới (Xử lý trùng lặp + giới hạn 5 item)
export const saveSearchKeyword = async (keyword: string) => {
  try {
    const currentHistory = await getSearchHistory();
    
    // Lọc bỏ từ khóa nếu đã tồn tại (để đưa nó lên đầu)
    const filtered = currentHistory.filter(item => item.toLowerCase() !== keyword.toLowerCase());
    
    // Thêm vào đầu mảng
    const newHistory = [keyword, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    // Lưu lại xuống máy
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error("Lỗi lưu lịch sử", e);
    return [];
  }
};

// 3. Xóa một từ khóa cụ thể
export const removeSearchKeyword = async (keywordToRemove: string) => {
  try {
    const currentHistory = await getSearchHistory();
    const newHistory = currentHistory.filter(item => item !== keywordToRemove);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    return [];
  }
};