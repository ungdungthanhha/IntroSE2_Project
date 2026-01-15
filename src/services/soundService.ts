import firestore from '@react-native-firebase/firestore';
import { Sound, Video } from '../types/type';

const SOUND_COLLECTION = 'sounds';

// 1. Tạo Âm thanh gốc (Original Sound)
export const createOriginalSound = async (videoId: string, videoUrl: string, user: any): Promise<Sound> => {
  const soundId = firestore().collection(SOUND_COLLECTION).doc().id;
  // Cloudinary: đổi đuôi .mp4 -> .mp3 để lấy audio
  const audioUrl = videoUrl.replace(/\.mp4$/i, '.mp3'); 

  const newSound: Sound = {
    id: soundId,
    name: `Original Sound - ${user.displayName || user.username}`,
    ownerUid: user.uid,
    ownerName: user.displayName || user.username,
    ownerAvatar: user.avatarUrl,
    audioUrl: audioUrl, 
    thumbnailUrl: user.avatarUrl,
    usageCount: 1, 
    originalVideoId: videoId,
    createdAt: Date.now(),
    isSystemSound: false
  };

  await firestore().collection(SOUND_COLLECTION).doc(soundId).set(newSound);
  return newSound;
};

// 2. Lấy danh sách Sound nội bộ (App Sounds - Tab 2)
export const getInternalSounds = async (): Promise<Sound[]> => {
  try {
    const snapshot = await firestore()
      .collection(SOUND_COLLECTION)
      .where('isSystemSound', '==', false) // Chỉ lấy sound do user tạo
      .orderBy('usageCount', 'desc')       // Sound hot lên đầu
      .limit(20)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sound));
  } catch (error) {
    console.log("Error fetch internal sounds:", error);
    return [];
  }
};

// 3. Lấy thông tin Sound + Videos sử dụng nó
export const getSoundDetails = async (soundId: string) => {
  const soundDoc = await firestore().collection(SOUND_COLLECTION).doc(soundId).get();
  if (!soundDoc.exists) return null;

  // Lấy danh sách video dùng sound này
  const videosSnapshot = await firestore()
    .collection('videos')
    .where('soundId', '==', soundId)
    .orderBy('createdAt', 'desc')
    .limit(15)
    .get();

  const videos = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));

  return { sound: soundDoc.data() as Sound, videos };
};

// 4. Đổi tên Sound (Chỉ dành cho chủ sở hữu)
export const updateSoundName = async (soundId: string, newName: string) => {
  await firestore().collection(SOUND_COLLECTION).doc(soundId).update({
    name: newName
  });
};

// 5. Tăng lượt dùng
export const incrementSoundUsage = async (soundId: string) => {
  await firestore().collection(SOUND_COLLECTION).doc(soundId).update({
    usageCount: firestore.FieldValue.increment(1)
  });
};