// src/services/musicService.ts
import { Sound } from '../types/type';
import firestore from '@react-native-firebase/firestore';

// API iTunes (Miễn phí, không cần key)
const ITUNES_API = 'https://itunes.apple.com/search';

export const searchMusic = async (term: string): Promise<Sound[]> => {
  try {
    const response = await fetch(`${ITUNES_API}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=20`);
    const data = await response.json();

    // Map dữ liệu từ iTunes về cấu trúc Sound của App
    return data.results.map((item: any) => ({
      id: `itunes_${item.trackId}`, // Tạo ID riêng để không trùng với ID tự sinh
      name: item.trackName,
      ownerUid: 'apple_music', // System user
      ownerName: item.artistName,
      ownerAvatar: item.artworkUrl100, // Ảnh bìa album
      audioUrl: item.previewUrl, // Link nghe thử 30s .m4a
      thumbnailUrl: item.artworkUrl100,
      usageCount: 0, // Sẽ update sau
      createdAt: Date.now(),
      isSystemSound: true // Cờ đánh dấu đây là nhạc hệ thống
    }));
  } catch (error) {
    console.error("iTunes Search Error:", error);
    return [];
  }
};

// Hàm đảm bảo Sound này tồn tại trong Firestore trước khi link vào Video
// (Vì nhạc iTunes chưa có trong DB của mình lúc tìm kiếm)
export const ensureSystemSoundExists = async (sound: Sound) => {
  const soundRef = firestore().collection('sounds').doc(sound.id);
  const doc = await soundRef.get();
  
  if (!doc.exists) {
    // Nếu chưa có thì lưu vào DB lần đầu tiên
    await soundRef.set({
        ...sound,
        usageCount: 1 // Bắt đầu tính là 1
    });
  } else {
    // Nếu có rồi thì tăng usage
    await soundRef.update({
        usageCount: firestore.FieldValue.increment(1)
    });
  }
};