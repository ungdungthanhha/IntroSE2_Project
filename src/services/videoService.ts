import { db, firebaseStorage, COLLECTIONS } from '../config/firebase';
import { Video, Comment } from '../types';

// Maximum video duration in seconds (U003 - 60 giây)
const MAX_VIDEO_DURATION = 60;

// Upload video (U003 - Đăng Video)
export const uploadVideo = async (
  userId: string,
  videoUri: string,
  caption: string,
  duration: number, // Duration in seconds
  hashtags: string[]
): Promise<{ success: boolean; video?: Video; error?: string }> => {
  try {
    // Validate video duration (U003 - Chặn video > 60s)
    if (duration > MAX_VIDEO_DURATION) {
      return { 
        success: false, 
        error: `Video duration must not exceed ${MAX_VIDEO_DURATION} seconds. Your video is ${Math.round(duration)} seconds.` 
      };
    }

    // Upload video to Firebase Storage
    const videoRef = firebaseStorage().ref(`videos/${userId}/${Date.now()}.mp4`);
    await videoRef.putFile(videoUri);
    const videoUrl = await videoRef.getDownloadURL();

    // Get user info
    const userDoc = await db().collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data();

    // Create video document
    const videoId = db().collection(COLLECTIONS.VIDEOS).doc().id;
    const newVideo: Video = {
      id: videoId,
      ownerUid: userId,
      ownerName: userData?.username || 'Unknown',
      ownerAvatar: userData?.avatarUrl || '',
      videoUrl: videoUrl,
      caption: caption,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      timestamp: Date.now(),
      duration: duration,
      isLiked: false,
      isSaved: false
    };

    await db().collection(COLLECTIONS.VIDEOS).doc(videoId).set({
      ...newVideo,
      hashtags: hashtags.map(h => h.toLowerCase()),
      createdAt: new Date().toISOString()
    });

    // Update hashtag counts
    for (const hashtag of hashtags) {
      const hashtagLower = hashtag.toLowerCase().replace('#', '');
      const hashtagRef = db().collection(COLLECTIONS.HASHTAGS).doc(hashtagLower);
      const hashtagDoc = await hashtagRef.get();
      
      if (hashtagDoc.exists) {
        await hashtagRef.update({
          postCount: firestore.FieldValue.increment(1),
          updatedAt: new Date().toISOString()
        });
      } else {
        await hashtagRef.set({
          name: hashtagLower,
          postCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return { success: true, video: newVideo };
  } catch (error: any) {
    console.error('Error uploading video:', error);
    return { success: false, error: 'Failed to upload video' };
  }
};

// Get videos for feed (U013 - Xem video trong feed)
export const getFeedVideos = async (limit: number = 20): Promise<Video[]> => {
  try {
    const videosSnapshot = await db()
      .collection(COLLECTIONS.VIDEOS)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return videosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Video[];
  } catch (error) {
    console.error('Error getting feed videos:', error);
    return [];
  }
};

// Get videos from followed users
export const getFollowingFeedVideos = async (
  userId: string, 
  followingIds: string[], 
  limit: number = 20
): Promise<Video[]> => {
  try {
    if (followingIds.length === 0) {
      return [];
    }

    const videosSnapshot = await db()
      .collection(COLLECTIONS.VIDEOS)
      .where('ownerUid', 'in', followingIds.slice(0, 10)) // Firestore 'in' limit is 10
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return videosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Video[];
  } catch (error) {
    console.error('Error getting following feed videos:', error);
    return [];
  }
};

// Like video (U005 - Thích video)
export const likeVideo = async (
  userId: string, 
  videoId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const likeId = `${userId}_${videoId}`;
    
    // Check if already liked
    const existingLike = await db().collection(COLLECTIONS.LIKES).doc(likeId).get();
    
    if (existingLike.exists) {
      // Unlike
      await db().collection(COLLECTIONS.LIKES).doc(likeId).delete();
      await db().collection(COLLECTIONS.VIDEOS).doc(videoId).update({
        likesCount: firestore.FieldValue.increment(-1)
      });
      return { success: true };
    }

    // Like
    await db().collection(COLLECTIONS.LIKES).doc(likeId).set({
      userId: userId,
      videoId: videoId,
      createdAt: new Date().toISOString()
    });

    await db().collection(COLLECTIONS.VIDEOS).doc(videoId).update({
      likesCount: firestore.FieldValue.increment(1)
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error liking video:', error);
    return { success: false, error: 'Failed to like video' };
  }
};

// Check if video is liked
export const isVideoLiked = async (userId: string, videoId: string): Promise<boolean> => {
  try {
    const likeId = `${userId}_${videoId}`;
    const likeDoc = await db().collection(COLLECTIONS.LIKES).doc(likeId).get();
    return likeDoc.exists;
  } catch (error) {
    return false;
  }
};

// Add comment (U004 - Bình luận video)
export const addComment = async (
  userId: string,
  videoId: string,
  text: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> => {
  try {
    if (!text.trim()) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    if (text.length > 500) {
      return { success: false, error: 'Comment is too long (max 500 characters)' };
    }

    // Get user info
    const userDoc = await db().collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data();

    const commentId = db().collection(COLLECTIONS.COMMENTS).doc().id;
    const newComment: Comment = {
      id: commentId,
      videoId: videoId,
      userUid: userId,
      username: userData?.username || 'Unknown',
      avatarUrl: userData?.avatarUrl || '',
      text: text.trim(),
      timestamp: Date.now()
    };

    await db().collection(COLLECTIONS.COMMENTS).doc(commentId).set({
      ...newComment,
      createdAt: new Date().toISOString()
    });

    // Update comment count
    await db().collection(COLLECTIONS.VIDEOS).doc(videoId).update({
      commentsCount: firestore.FieldValue.increment(1)
    });

    return { success: true, comment: newComment };
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
};

// Get video comments
export const getVideoComments = async (videoId: string): Promise<Comment[]> => {
  try {
    const commentsSnapshot = await db()
      .collection(COLLECTIONS.COMMENTS)
      .where('videoId', '==', videoId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return commentsSnapshot.docs.map(doc => doc.data()) as Comment[];
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

// Search videos by hashtag (U027 - Tìm kiếm bằng Hashtag)
export const searchVideosByHashtag = async (hashtag: string): Promise<Video[]> => {
  try {
    const hashtagLower = hashtag.toLowerCase().replace('#', '');
    
    const videosSnapshot = await db()
      .collection(COLLECTIONS.VIDEOS)
      .where('hashtags', 'array-contains', hashtagLower)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    return videosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Video[];
  } catch (error) {
    console.error('Error searching videos by hashtag:', error);
    return [];
  }
};

// Get trending hashtags
export const getTrendingHashtags = async (limit: number = 10): Promise<{ name: string; postCount: number }[]> => {
  try {
    const hashtagsSnapshot = await db()
      .collection(COLLECTIONS.HASHTAGS)
      .orderBy('postCount', 'desc')
      .limit(limit)
      .get();
    
    return hashtagsSnapshot.docs.map(doc => ({
      name: doc.data().name,
      postCount: doc.data().postCount
    }));
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return [];
  }
};

// Get user's videos
export const getUserVideos = async (userId: string): Promise<Video[]> => {
  try {
    const videosSnapshot = await db()
      .collection(COLLECTIONS.VIDEOS)
      .where('ownerUid', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return videosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Video[];
  } catch (error) {
    console.error('Error getting user videos:', error);
    return [];
  }
};

// Save/Bookmark video
export const saveVideo = async (
  userId: string, 
  videoId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> => {
  try {
    const saveId = `${userId}_${videoId}`;
    const saveRef = db().collection('saves').doc(saveId);
    const saveDoc = await saveRef.get();
    
    if (saveDoc.exists) {
      // Unsave
      await saveRef.delete();
      await db().collection(COLLECTIONS.VIDEOS).doc(videoId).update({
        savesCount: firestore.FieldValue.increment(-1)
      });
      return { success: true, isSaved: false };
    }

    // Save
    await saveRef.set({
      userId: userId,
      videoId: videoId,
      createdAt: new Date().toISOString()
    });

    await db().collection(COLLECTIONS.VIDEOS).doc(videoId).update({
      savesCount: firestore.FieldValue.increment(1)
    });

    return { success: true, isSaved: true };
  } catch (error: any) {
    console.error('Error saving video:', error);
    return { success: false, isSaved: false, error: 'Failed to save video' };
  }
};
