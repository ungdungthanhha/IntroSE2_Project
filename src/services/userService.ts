import { db, COLLECTIONS } from '../config/firebase';
import { User } from '../types';

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await db().collection(COLLECTIONS.USERS).doc(userId).get();
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
 * Get user by username
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const snapshot = await db()
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
 * Check if user A is following user B
 */
export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const followDoc = await db()
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
 * Follow a user
 */
export const followUser = async (currentUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (currentUserId === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    const batch = db().batch();
    
    // Add to current user's following list
    const followingRef = db()
      .collection(COLLECTIONS.USERS)
      .doc(currentUserId)
      .collection('following')
      .doc(targetUserId);
    
    batch.set(followingRef, {
      userId: targetUserId,
      followedAt: new Date().toISOString()
    });

    // Add to target user's followers list
    const followersRef = db()
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .collection('followers')
      .doc(currentUserId);
    
    batch.set(followersRef, {
      userId: currentUserId,
      followedAt: new Date().toISOString()
    });

    // Update counts
    const currentUserRef = db().collection(COLLECTIONS.USERS).doc(currentUserId);
    const targetUserRef = db().collection(COLLECTIONS.USERS).doc(targetUserId);

    // Get current counts
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
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const batch = db().batch();
    
    // Remove from current user's following list
    const followingRef = db()
      .collection(COLLECTIONS.USERS)
      .doc(currentUserId)
      .collection('following')
      .doc(targetUserId);
    
    batch.delete(followingRef);

    // Remove from target user's followers list
    const followersRef = db()
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .collection('followers')
      .doc(currentUserId);
    
    batch.delete(followersRef);

    // Update counts
    const currentUserRef = db().collection(COLLECTIONS.USERS).doc(currentUserId);
    const targetUserRef = db().collection(COLLECTIONS.USERS).doc(targetUserId);

    // Get current counts
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
 * Get followers list
 */
export const getFollowers = async (userId: string): Promise<User[]> => {
  try {
    const followersSnapshot = await db()
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection('followers')
      .orderBy('followedAt', 'desc')
      .limit(50)
      .get();

    const followerIds = followersSnapshot.docs.map(doc => doc.id);
    
    if (followerIds.length === 0) return [];

    const users: User[] = [];
    for (const followerId of followerIds) {
      const user = await getUserById(followerId);
      if (user) users.push(user);
    }

    return users;
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
};

/**
 * Get following list
 */
export const getFollowing = async (userId: string): Promise<User[]> => {
  try {
    const followingSnapshot = await db()
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection('following')
      .orderBy('followedAt', 'desc')
      .limit(50)
      .get();

    const followingIds = followingSnapshot.docs.map(doc => doc.id);
    
    if (followingIds.length === 0) return [];

    const users: User[] = [];
    for (const followingId of followingIds) {
      const user = await getUserById(followingId);
      if (user) users.push(user);
    }

    return users;
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
};

/**
 * Search users by username
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    if (!query.trim()) return [];

    const snapshot = await db()
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
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Pick<User, 'username' | 'bio' | 'avatarUrl'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db().collection(COLLECTIONS.USERS).doc(userId).update(updates);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};
