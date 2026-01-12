import { db, COLLECTIONS, SUBCOLLECTIONS } from '../config/firebase'; // Sử dụng instance db trực tiếp
import { User } from '../types/type';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';


/**
 * Lấy thông tin người dùng bằng ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    // Sửa lỗi: Sử dụng db.collection thay vì db()
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Lấy thông tin người dùng bằng username
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.USERS)
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

/**
 * Kiểm tra xem người dùng A có đang follow người dùng B không
 */
export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const followDoc = await db
      .collection(COLLECTIONS.USERS)
      .doc(currentUserId)
      .collection(SUBCOLLECTIONS.USER_FOLLOWING)
      .doc(targetUserId)
      .get();
    
    return followDoc.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Theo dõi một người dùng (Sử dụng Firestore Batch để đảm bảo tính toàn vẹn dữ liệu)
 */
export const followUser = async (currentUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (currentUserId === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    const batch = db.batch(); // Sửa lỗi: db.batch() thay vì db().batch()
    
    // 1. Thêm vào danh sách 'following' của người dùng hiện tại
    const followingRef = db
      .collection(COLLECTIONS.USERS)
      .doc(currentUserId)
      .collection(SUBCOLLECTIONS.USER_FOLLOWING)
      .doc(targetUserId);
    
    batch.set(followingRef, {
      userId: targetUserId,
      followedAt: new Date().toISOString()
    });

    // 2. Thêm vào danh sách 'followers' của người dùng mục tiêu
    const followersRef = db
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .collection(SUBCOLLECTIONS.USER_FOLLOWERS)
      .doc(currentUserId);
    
    batch.set(followersRef, {
      userId: currentUserId,
      followedAt: new Date().toISOString()
    });

    // 3. Cập nhật số lượng Follower/Following (atomic increment)
    const currentUserRef = db.collection(COLLECTIONS.USERS).doc(currentUserId);
    const targetUserRef = db.collection(COLLECTIONS.USERS).doc(targetUserId);

    batch.update(currentUserRef, {
      followingCount: firestore.FieldValue.increment(1)
    });

    batch.update(targetUserRef, {
      followersCount: firestore.FieldValue.increment(1)
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Hủy theo dõi người dùng
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const batch = db.batch();
    
    const followingRef = db
      .collection(COLLECTIONS.USERS)
      .doc(currentUserId)
      .collection(SUBCOLLECTIONS.USER_FOLLOWING)
      .doc(targetUserId);
    batch.delete(followingRef);

    const followersRef = db
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .collection(SUBCOLLECTIONS.USER_FOLLOWERS)
      .doc(currentUserId);
    batch.delete(followersRef);

    const currentUserRef = db.collection(COLLECTIONS.USERS).doc(currentUserId);
    const targetUserRef = db.collection(COLLECTIONS.USERS).doc(targetUserId);

    batch.update(currentUserRef, {
      followingCount: firestore.FieldValue.increment(-1)
    });

    batch.update(targetUserRef, {
      followersCount: firestore.FieldValue.increment(-1)
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tìm kiếm người dùng bằng username (Prefix search)
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    if (!query.trim()) return [];

    const snapshot = await db
      .collection(COLLECTIONS.USERS)
      .where('username', '>=', query.toLowerCase())
      .where('username', '<=', query.toLowerCase() + '\uf8ff')
      .limit(20)
      .get();

    return snapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

export const uploadUserAvatar = async (userId: string, imageUri: string): Promise<string | null> => {
  try {
    // 1. Tạo tên file duy nhất (dựa trên UserID và thời gian)
    // Đường dẫn trên Storage sẽ là: avatars/user_id/avatar_timestamp.jpg
    const filename = `avatars/${userId}/avatar_${Date.now()}.jpg`;
    const reference = storage().ref(filename);

    // 2. Thực hiện upload
    // Lưu ý: putFile nhận đường dẫn file local
    await reference.putFile(imageUri);

    // 3. Lấy đường dẫn tải xuống (URL public)
    const url = await reference.getDownloadURL();
    return url;
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    return null;
  }
};

/**
 * Cập nhật thông tin Profile (Username, Bio, Avatar)
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Pick<User, 'username' | 'displayName' | 'bio' | 'avatarUrl' | 'instagramHandle' | 'youtubeHandle'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db.collection(COLLECTIONS.USERS).doc(userId).update(updates);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to realtime user updates (bao gồm likesCount)
 */
export const subscribeToUserUpdates = (
  userId: string,
  callback: (user: User | null) => void
): (() => void) => {
  const unsubscribe = db
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .onSnapshot(
      (snapshot) => {
        if (snapshot.exists) {
          callback(snapshot.data() as User);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to user updates:', error);
        callback(null);
      }
    );

  return unsubscribe;
};