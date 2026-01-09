import { db, COLLECTIONS } from '../config/firebase';
import { Video, Comment } from '../types/type';
import firestore from '@react-native-firebase/firestore';

export const toggleLikeVideo = async (videoId: string, userId: string, isLiked: boolean) => {
  try {
    const videoRef = db.collection(COLLECTIONS.VIDEOS).doc(videoId);
    const batch = db.batch(); 

    if (isLiked) {
      batch.delete(videoRef.collection('likes').doc(userId));
      batch.update(videoRef, { likesCount: firestore.FieldValue.increment(-1) });
    } else {
      batch.set(videoRef.collection('likes').doc(userId), { userId, createdAt: new Date().toISOString() });
      batch.update(videoRef, { likesCount: firestore.FieldValue.increment(1) });
    }
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const saveVideoMetadata = async (videoData: Partial<Video>) => {
  try {
    const newVideoRef = db.collection(COLLECTIONS.VIDEOS).doc();
    const finalData = {
      ...videoData,
      id: newVideoRef.id,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };
    await newVideoRef.set(finalData);
    return { success: true, video: finalData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};