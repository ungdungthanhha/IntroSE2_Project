import { db, COLLECTIONS } from '../config/firebase';

// Livestream types
export interface Livestream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  viewerCount: number;
  likesCount: number;
  isLive: boolean;
  streamUrl: string;
  createdAt: string;
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

// Get active livestreams (U009 - Xem livestream đang diễn ra)
export const getActiveLivestreams = async (): Promise<Livestream[]> => {
  try {
    const livestreamsSnapshot = await db()
      .collection(COLLECTIONS.LIVESTREAMS)
      .where('isLive', '==', true)
      .orderBy('viewerCount', 'desc')
      .limit(20)
      .get();
    
    return livestreamsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Livestream[];
  } catch (error) {
    console.error('Error getting livestreams:', error);
    return [];
  }
};

// Join livestream (increment viewer count)
export const joinLivestream = async (livestreamId: string): Promise<boolean> => {
  try {
    await db().collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).update({
      viewerCount: firestore.FieldValue.increment(1)
    });
    return true;
  } catch (error) {
    console.error('Error joining livestream:', error);
    return false;
  }
};

// Leave livestream (decrement viewer count)
export const leaveLivestream = async (livestreamId: string): Promise<boolean> => {
  try {
    await db().collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).update({
      viewerCount: firestore.FieldValue.increment(-1)
    });
    return true;
  } catch (error) {
    console.error('Error leaving livestream:', error);
    return false;
  }
};

// Add comment to livestream (U009 - Bình luận trong livestream)
export const addLiveComment = async (
  livestreamId: string,
  userId: string,
  username: string,
  avatarUrl: string,
  text: string
): Promise<{ success: boolean; comment?: LiveComment; error?: string }> => {
  try {
    if (!text.trim()) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    if (text.length > 200) {
      return { success: false, error: 'Comment is too long (max 200 characters)' };
    }

    const commentId = db().collection(COLLECTIONS.LIVESTREAMS).doc().id;
    const newComment: LiveComment = {
      id: commentId,
      livestreamId: livestreamId,
      userId: userId,
      username: username,
      avatarUrl: avatarUrl,
      text: text.trim(),
      timestamp: Date.now()
    };

    // Store in subcollection for real-time updates
    await db()
      .collection(COLLECTIONS.LIVESTREAMS)
      .doc(livestreamId)
      .collection('comments')
      .doc(commentId)
      .set({
        ...newComment,
        createdAt: new Date().toISOString()
      });

    return { success: true, comment: newComment };
  } catch (error: any) {
    console.error('Error adding live comment:', error);
    return { success: false, error: 'Failed to send comment' };
  }
};

// Subscribe to livestream comments (real-time)
export const subscribeLiveComments = (
  livestreamId: string,
  onComment: (comments: LiveComment[]) => void
) => {
  return db()
    .collection(COLLECTIONS.LIVESTREAMS)
    .doc(livestreamId)
    .collection('comments')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .onSnapshot(snapshot => {
      const comments = snapshot.docs.map(doc => doc.data() as LiveComment);
      onComment(comments.reverse()); // Reverse to show oldest first at top
    });
};

// Like livestream
export const likeLivestream = async (livestreamId: string): Promise<boolean> => {
  try {
    await db().collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).update({
      likesCount: firestore.FieldValue.increment(1)
    });
    return true;
  } catch (error) {
    console.error('Error liking livestream:', error);
    return false;
  }
};

// Start livestream (for host)
export const startLivestream = async (
  userId: string,
  title: string
): Promise<{ success: boolean; livestream?: Livestream; error?: string }> => {
  try {
    // Get user info
    const userDoc = await db().collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data();

    const livestreamId = db().collection(COLLECTIONS.LIVESTREAMS).doc().id;
    const newLivestream: Livestream = {
      id: livestreamId,
      hostId: userId,
      hostName: userData?.username || 'Unknown',
      hostAvatar: userData?.avatarUrl || '',
      title: title,
      viewerCount: 0,
      likesCount: 0,
      isLive: true,
      streamUrl: '', // Would be set by streaming service
      createdAt: new Date().toISOString()
    };

    await db().collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).set(newLivestream);

    return { success: true, livestream: newLivestream };
  } catch (error: any) {
    console.error('Error starting livestream:', error);
    return { success: false, error: 'Failed to start livestream' };
  }
};

// End livestream
export const endLivestream = async (livestreamId: string): Promise<boolean> => {
  try {
    await db().collection(COLLECTIONS.LIVESTREAMS).doc(livestreamId).update({
      isLive: false,
      endedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error ending livestream:', error);
    return false;
  }
};
