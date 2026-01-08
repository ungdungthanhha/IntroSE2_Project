import { db, COLLECTIONS } from '../config/firebase';
import firestore from '@react-native-firebase/firestore';
import { Livestream, LiveComment } from '../types';

export const getActiveLivestreams = async (): Promise<Livestream[]> => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.LIVESTREAMS)
      .where('isLive', '==', true)
      .orderBy('viewerCount', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Livestream));
  } catch (error) {
    return [];
  }
};

export const addLiveComment = async (livestreamId: string, userId: string, username: string, avatarUrl: string, text: string) => {
  try {
    const commentId = db.collection(COLLECTIONS.LIVESTREAMS).doc().id;
    const newComment: LiveComment = {
      id: commentId,
      livestreamId,
      userId,
      username,
      avatarUrl,
      text: text.trim(),
      timestamp: Date.now()
    };
    await db.collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).collection('comments').doc(commentId).set(newComment);
    return { success: true, comment: newComment };
  } catch (error) {
    return { success: false, error: 'Failed to send comment' };
  }
};

export const startLivestream = async (userId: string, title: string) => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const livestreamId = db.collection(COLLECTIONS.LIVESTREAMS).doc().id;
    const newLive: Livestream = {
      id: livestreamId,
      hostId: userId,
      hostName: userDoc.data()?.username || 'User',
      hostAvatar: userDoc.data()?.avatarUrl || '',
      title,
      viewerCount: 0,
      likesCount: 0,
      isLive: true,
      createdAt: new Date().toISOString()
    };
    await db.collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).set(newLive);
    return { success: true, livestream: newLive };
  } catch (error) {
    return { success: false, error: 'Failed to start' };
  }
};