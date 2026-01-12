import auth from '@react-native-firebase/auth'; // Module gốc để lấy Provider
import { firebaseAuth, db, COLLECTIONS } from '../config/firebase';
import { User } from '../types/type';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// --- VALIDATION HELPERS ---
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => password.length >= 6;

// --- AUTH FUNCTIONS ---

// Đăng ký user mới (U001) - Tích hợp Birthday từ mockup
export const registerUser = async (email: string, password: string, username: string, birthday: string) => {
  try {
    // 1. Tạo tài khoản trên Firebase Auth
    const { user } = await firebaseAuth.createUserWithEmailAndPassword(email, password);

    // 2. Cập nhật DisplayName tạm thời để dùng sau này (cho bước Create Document)
    await user.updateProfile({ displayName: username });

    // 3. Gửi email xác thực
    await user.sendEmailVerification();
    console.log("Verification email sent to:", email);

    // NOTE: We do NOT create the Firestore Doc here.
    // The Doc will be created in `App.tsx` (VerifyEmailView) IMMEDIATELY after the user verifies their email.
    // This ensures no ghost data exists for unverified users.

    return { success: true, user: { uid: user.uid, email, username } as User };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Đăng nhập bằng Email/Password (U002)
export const loginUser = async (email: string, password: string) => {

  try {
    const { user } = await firebaseAuth.signInWithEmailAndPassword(email, password);

    // STRICT CHECK REMOVED: We now handle this in App.tsx via VerifyEmailView
    // The user is authenticated but not fully verified, so we let them through.

    // CHECK & CREATE USER DOC IF MISSING (Verify-First Logic)
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();

    if (!userDoc.exists) {
      console.log("User verified but no DB record. Creating now...");
      const newUser: User = {
        uid: user.uid,
        username: (user.displayName || 'user').replace(/\s/g, '').toLowerCase(),
        displayName: user.displayName || 'User', // ADDED
        email: user.email || '',
        birthday: '', // Birthday bị mất do không lưu lúc đăng ký, chấp nhận default
        avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
        bio: 'Welcome to Tictoc!',
        followersCount: 0,
        followingCount: 0
      };

      const cleanUser = JSON.parse(JSON.stringify(newUser));
      await db.collection(COLLECTIONS.USERS).doc(user.uid).set(cleanUser);
      return { success: true, user: newUser };
    }

    return { success: true, user: userDoc.data() as User };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Đăng nhập Google - Sửa lỗi "credential of undefined"
export const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();

    if (!data?.idToken) throw new Error('No ID Token received');

    const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);
    const userCredential = await firebaseAuth.signInWithCredential(googleCredential);
    const { user } = userCredential;

    // Force server fetch to avoid stale cache issues
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get({ source: 'server' });

    let userData: User;
    if (!userDoc.exists) {
      const newUser: User = {
        uid: user.uid || '',
        username: (user.displayName || 'user').replace(/\s/g, '').toLowerCase(),
        displayName: user.displayName || 'User', // ADDED
        email: user.email || '',
        birthday: '', // Không có dữ liệu birthday từ Google
        avatarUrl: user.photoURL || 'https://picsum.photos/200/200',
        bio: 'Joined with Tictoc!',
        followersCount: 0,
        followingCount: 0
      };

      // Sanitize to avoid undefined
      userData = JSON.parse(JSON.stringify(newUser));

      await db.collection(COLLECTIONS.USERS).doc(user.uid).set(userData);
    } else {
      userData = userDoc.data() as User;
    }

    return { success: true, user: userData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await GoogleSignin.signOut();
    await firebaseAuth.signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const onAuthStateChanged = (callback: any) => {
  return firebaseAuth.onAuthStateChanged(callback);
};