import { db, COLLECTIONS } from '../config/firebase'; // Instance db trực tiếp từ config
import { Video, Comment } from '../types/type';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary, ImageLibraryOptions, MediaType } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * 1. Tải Video lên Cloudinary (Sử dụng Unsigned Upload)
 */
export const uploadVideoToCloudinary = async (fileUri: string) => {
  const cloudName = 'dvmfpcxz8';
  const uploadPreset = 'tictoc_uploads';

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'video/mp4',
    name: 'upload.mp4',
  } as any);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    const data = await response.json();
    // DEBUG DATA UPLOAD
    if (data) {
      console.log('Cloudinary Upload Success:', data);

      // --- LOGIC TẠO THUMBNAIL TỰ ĐỘNG ---
        const videoUrl = data.secure_url;
        
        // Cloudinary cho phép lấy ảnh bìa bằng cách đổi đuôi file thành .jpg
        // Ví dụ: .../upload/v123/abc.mp4  ->  .../upload/v123/abc.jpg
        const thumbUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg"); 

        return { videoUrl, thumbUrl };
    }
    return null;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return null;
  }
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
      timestamp: Date.now(), // Lưu dạng số để dễ sắp xếp
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

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Video)); //
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

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Video)); //
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
    const batch = db.batch(); //

    if (isLiked) {
      batch.delete(likeRef);
      batch.update(videoRef, {
        likesCount: firestore.FieldValue.increment(-1)
      });
    } else {
      batch.set(likeRef, {
        userId,
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