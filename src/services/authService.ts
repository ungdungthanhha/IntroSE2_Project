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
    
    // 2. Tạo object dữ liệu người dùng chuẩn Tictoc
    const newUser: User = {
      uid: user.uid,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      birthday: birthday, // Lưu thông tin ngày sinh
      avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
      bio: 'Welcome to Tictoc!',
      followersCount: 0,
      followingCount: 0
    };

    // 3. Lưu vào Firestore
    await db.collection(COLLECTIONS.USERS).doc(user.uid).set(newUser);
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Đăng nhập bằng Email/Password (U002)
export const loginUser = async (email: string, password: string) => {
  
  try {
    const { user } = await firebaseAuth.signInWithEmailAndPassword(email, password);
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
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

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
    
    let userData: User;
    if (!userDoc.exists) {
      userData = {
        uid: user.uid,
        username: user.displayName?.replace(/\s/g, '').toLowerCase() || 'user',
        email: user.email || '',
        birthday: '', // Không có dữ liệu birthday từ Google
        avatarUrl: user.photoURL || 'https://picsum.photos/200/200',
        bio: 'Joined with Tictoc!',
        followersCount: 0,
        followingCount: 0
      };
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