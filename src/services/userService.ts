import { db, COLLECTIONS } from '../config/firebase'; // Sử dụng instance db trực tiếp
import { User } from '../types';


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
      .collection('following')
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
      .collection('following')
      .doc(targetUserId);
    
    batch.set(followingRef, {
      userId: targetUserId,
      followedAt: new Date().toISOString()
    });

    // 2. Thêm vào danh sách 'followers' của người dùng mục tiêu
    const followersRef = db
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .collection('followers')
      .doc(currentUserId);
    
    batch.set(followersRef, {
      userId: currentUserId,
      followedAt: new Date().toISOString()
    });

    // 3. Cập nhật số lượng Follower/Following
    const currentUserRef = db.collection(COLLECTIONS.USERS).doc(currentUserId);
    const targetUserRef = db.collection(COLLECTIONS.USERS).doc(targetUserId);

    const [currentUserDoc, targetUserDoc] = await Promise.all([
      currentUserRef.get(),
      targetUserRef.get()
    ]);

    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();

    batch.update(currentUserRef, {
      followingCount: (currentUserData?.followingCount || 0) + 1
    });

    batch.update(targetUserRef, {
      followersCount: (targetUserData?.followersCount || 0) + 1
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
      .collection('following')
      .doc(targetUserId);
    batch.delete(followingRef);

    const followersRef = db
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .collection('followers')
      .doc(currentUserId);
    batch.delete(followersRef);

    const currentUserRef = db.collection(COLLECTIONS.USERS).doc(currentUserId);
    const targetUserRef = db.collection(COLLECTIONS.USERS).doc(targetUserId);

    const [currentUserDoc, targetUserDoc] = await Promise.all([
      currentUserRef.get(),
      targetUserRef.get()
    ]);

    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();

    batch.update(currentUserRef, {
      followingCount: Math.max(0, (currentUserData?.followingCount || 1) - 1)
    });

    batch.update(targetUserRef, {
      followersCount: Math.max(0, (targetUserData?.followersCount || 1) - 1)
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

/**
 * Cập nhật thông tin Profile (Username, Bio, Avatar)
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Pick<User, 'username' | 'bio' | 'avatarUrl'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db.collection(COLLECTIONS.USERS).doc(userId).update(updates);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};