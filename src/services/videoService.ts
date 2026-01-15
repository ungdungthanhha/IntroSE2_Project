import { db, COLLECTIONS } from '../config/firebase'; // Instance db trực tiếp từ config
import { Video, Comment } from '../types/type';
import firestore from '@react-native-firebase/firestore';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';
import { launchImageLibrary, ImageLibraryOptions, MediaType } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * 1. Tải Video lên Cloudinary (Sử dụng Unsigned Upload)
 */
export const uploadVideoToCloudinary = async (fileUri: string) => {
  const cloudName = CLOUDINARY_CLOUD_NAME;
  const uploadPreset = CLOUDINARY_UPLOAD_PRESET;

  console.log('[Cloudinary] Cloud Name:', cloudName);
  console.log('[Cloudinary] Upload Preset:', uploadPreset);
  console.log('[Cloudinary] File URI:', fileUri);

  if (!cloudName || !uploadPreset) {
    console.error('[Cloudinary] Missing credentials! Check .env file');
    return null;
  }

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'video/mp4',
    name: 'upload.mp4',
  } as any);
  formData.append('upload_preset', uploadPreset);

  return new Promise<{ videoUrl: string; thumbUrl: string } | null>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

    // --- PROGRESS LOGGING ---
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          console.log(`> Uploading to Cloudinary: ${percent}%`);
        }
      };
    }

    xhr.onload = () => {
      console.log('[Cloudinary] Response status:', xhr.status);
      console.log('[Cloudinary] Response body:', xhr.response);

      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.response);
          console.log('Cloudinary Upload Success:', data);

          const videoUrl = data.secure_url;
          const thumbUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg");

          resolve({ videoUrl, thumbUrl });
        } catch (e) {
          console.error('JSON Parse Error:', e);
          resolve(null);
        }
      } else {
        console.error('Cloudinary Upload Failed:', xhr.status, xhr.response);
        resolve(null);
      }
    };

    xhr.onerror = () => {
      console.error('XHR Network Error');
      resolve(null);
    };

    xhr.send(formData);
  });
};

/**
 * 2. Lưu thông tin Metadata của video vào Firestore sau khi upload
 */
export const saveVideoMetadata = async (videoData: Partial<Video>) => {
  try {
    const newVideoRef = db.collection(COLLECTIONS.VIDEOS).doc();

    const finalData = {
      ...videoData,
      id: newVideoRef.id,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0, // Khởi tạo giá trị lưu
      createdAt: videoData.createdAt || Date.now(),
    };

    await newVideoRef.set(finalData);
    return { success: true, video: finalData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 3. Lấy danh sách TOÀN BỘ video từ Firestore (Cho màn hình Feed)
 */
export const getAllVideos = async (): Promise<Video[]> => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.VIDEOS)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Normalize createdAt to timestamp number if it's a string
      const createdAt = typeof data.createdAt === 'string'
        ? new Date(data.createdAt).getTime()
        : data.createdAt;

      return {
        id: doc.id,
        ...data,
        createdAt
      } as Video;
    }).sort((a, b) => {
      const timeDiff = b.createdAt - a.createdAt;
      if (timeDiff !== 0) return timeDiff;
      return (a.ownerUid || '').localeCompare(b.ownerUid || '');
    });
  } catch (error) {
    console.error('Error getting videos:', error);
    return [];
  }
};

/**
 * 4. Lấy danh sách video của một USER cụ thể (Cho màn hình Profile)
 */
export const getVideosByUser = async (userId: string): Promise<Video[]> => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.VIDEOS)
      .where('ownerUid', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = typeof data.createdAt === 'string'
        ? new Date(data.createdAt).getTime()
        : data.createdAt;

      return {
        id: doc.id,
        ...data,
        createdAt
      } as Video;
    }).sort((a, b) => {
      const timeDiff = b.createdAt - a.createdAt;
      if (timeDiff !== 0) return timeDiff;
      return (a.ownerUid || '').localeCompare(b.ownerUid || '');
    });
  } catch (error) {
    console.error('Error getting user videos:', error);
    return [];
  }
};

/**
 * 5. Xử lý Like/Unlike Video (Sử dụng Firestore Batch)
 */
export const toggleLikeVideo = async (videoId: string, userId: string, isLiked: boolean) => {
  try {
    const videoRef = db.collection(COLLECTIONS.VIDEOS).doc(videoId);
    const likeRef = videoRef.collection('likes').doc(userId);

    // User's liked videos collection
    const userLikedRef = db.collection(COLLECTIONS.USERS).doc(userId).collection('likedVideos').doc(videoId);

    const batch = db.batch();

    if (isLiked) {
      // Unlike
      batch.delete(likeRef);
      batch.delete(userLikedRef);
      batch.update(videoRef, {
        likesCount: firestore.FieldValue.increment(-1)
      });
    } else {
      // Like
      batch.set(likeRef, {
        userId,
        createdAt: new Date().toISOString()
      });
      batch.set(userLikedRef, {
        videoId,
        createdAt: new Date().toISOString()
      });
      batch.update(videoRef, {
        likesCount: firestore.FieldValue.increment(1)
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 8. Xử lý Save/Unsave Video
 */
export const toggleSaveVideo = async (videoId: string, userId: string, isSaved: boolean) => {
  try {
    const videoRef = db.collection(COLLECTIONS.VIDEOS).doc(videoId);
    const saveRef = videoRef.collection('saves').doc(userId);

    // User's saved videos collection
    const userSavedRef = db.collection(COLLECTIONS.USERS).doc(userId).collection('savedVideos').doc(videoId);

    const batch = db.batch();

    if (isSaved) {
      // Unsave
      batch.delete(saveRef);
      batch.delete(userSavedRef);
      batch.update(videoRef, {
        savesCount: firestore.FieldValue.increment(-1)
      });
    } else {
      // Save
      batch.set(saveRef, {
        userId,
        createdAt: new Date().toISOString()
      });
      batch.set(userSavedRef, {
        videoId,
        createdAt: new Date().toISOString()
      });
      batch.update(videoRef, {
        savesCount: firestore.FieldValue.increment(1)
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * NEW: Xóa Video
 */
export const deleteVideo = async (videoId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const videoRef = db.collection(COLLECTIONS.VIDEOS).doc(videoId);

    // Kiểm tra quyền sở hữu (Security Rule cũng sẽ chặn, nhưng check ở đây cho chắc)
    const doc = await videoRef.get();
    if (!doc.exists) return { success: false, error: "Video not found" };
    if (doc.data()?.ownerUid !== userId) return { success: false, error: "Unauthorized" };

    // Xóa video (Lưu ý: Để xóa sạch hoàn toàn cần Cloud Functions để xóa recursive các subcollection likes/comments)
    // Ở client, ta xóa document chính. 
    await videoRef.delete();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 9. Lấy danh sách video đã Like của User
 */
export const getLikedVideos = async (userId: string): Promise<Video[]> => {
  try {
    // 1. Lấy danh sách ID video đã like
    const snapshot = await db.collection(COLLECTIONS.USERS).doc(userId).collection('likedVideos').orderBy('createdAt', 'desc').get();

    if (snapshot.empty) return [];

    const videoIds = snapshot.docs.map(doc => doc.id);

    // 2. Lấy chi tiết từng Video (Firestore không hỗ trợ whereIn quá 10 phần tử, nên loop đơn giản)
    // Tối ưu: Dùng Promise.all
    const videoPromises = videoIds.map(id => db.collection(COLLECTIONS.VIDEOS).doc(id).get());
    const videoDocs = await Promise.all(videoPromises);

    return videoDocs
      .filter(doc => doc.exists)
      .map(doc => {
        const data = doc.data()!;
        const createdAt = typeof data.createdAt === 'string'
          ? new Date(data.createdAt).getTime()
          : data.createdAt;
        return { id: doc.id, ...data, createdAt } as Video;
      })
      .sort((a, b) => {
        const timeDiff = b.createdAt - a.createdAt;
        if (timeDiff !== 0) return timeDiff;
        return (a.ownerUid || '').localeCompare(b.ownerUid || '');
      });

  } catch (error) {
    console.error('Error getting liked videos:', error);
    return [];
  }
};

/**
 * 10. Lấy danh sách video đã Save của User
 */
export const getSavedVideos = async (userId: string): Promise<Video[]> => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS).doc(userId).collection('savedVideos').orderBy('createdAt', 'desc').get();

    if (snapshot.empty) return [];

    const videoIds = snapshot.docs.map(doc => doc.id);

    const videoPromises = videoIds.map(id => db.collection(COLLECTIONS.VIDEOS).doc(id).get());
    const videoDocs = await Promise.all(videoPromises);

    return videoDocs
      .filter(doc => doc.exists)
      .map(doc => {
        const data = doc.data()!;
        const createdAt = typeof data.createdAt === 'string'
          ? new Date(data.createdAt).getTime()
          : data.createdAt;
        return { id: doc.id, ...data, createdAt } as Video;
      })
      .sort((a, b) => {
        const timeDiff = b.createdAt - a.createdAt;
        if (timeDiff !== 0) return timeDiff;
        return (a.ownerUid || '').localeCompare(b.ownerUid || '');
      });

  } catch (error) {
    console.error('Error getting saved videos:', error);
    return [];
  }
};

/**
 * 6. Thêm bình luận vào video
 */
export const addComment = async (videoId: string, userId: string, userAvatar: string, username: string, text: string) => {
  try {
    const videoRef = db.collection(COLLECTIONS.VIDEOS).doc(videoId);
    const commentRef = videoRef.collection('comments').doc();

    const newComment: Comment = {
      id: commentRef.id,
      videoId,
      userUid: userId,
      username,
      avatarUrl: userAvatar,
      text,
      timestamp: new Date().getTime()
    };

    const batch = db.batch();
    batch.set(commentRef, newComment);
    batch.update(videoRef, {
      commentsCount: firestore.FieldValue.increment(1)
    });

    await batch.commit();
    return { success: true, comment: newComment }; //
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 7. Chọn Video từ Thư viện
 */
export const pickVideoFromGallery = async (): Promise<{ uri: string; duration: number } | null> => {
  try {
    // Yêu cầu quyền truy cập (Dành cho Android)
    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;
      if (typeof androidVersion === 'number' && androidVersion >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập video để chọn từ thư viện.');
          return null;
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập bộ nhớ để chọn video.');
          return null;
        }
      }
    }

    const options: ImageLibraryOptions = {
      mediaType: 'video' as MediaType,
      selectionLimit: 1,
      videoQuality: 'high',
    };

    return new Promise((resolve) => {
      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          resolve(null);
        } else if (response.errorCode) {
          Alert.alert('Lỗi', response.errorMessage || 'Không thể chọn video');
          resolve(null);
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          resolve({
            uri: asset.uri || '',
            duration: asset.duration || 0
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Pick Video Error:', error);
    return null;
  }
};