import { firebaseAuth, db, COLLECTIONS } from '../config/firebase';
import { User } from '../types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Input Validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => password.length >= 6;

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Register User (U001)
export const registerUser = async (email: string, password: string, username: string) => {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email format' };
    if (!validatePassword(password)) return { success: false, error: 'Password too short (min 6 chars)' };
    if (!validateUsername(username)) return { success: false, error: 'Invalid username' };

    const { user } = await firebaseAuth().createUserWithEmailAndPassword(email, password);
    
    const newUser: User = {
      uid: user.uid,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
      bio: 'New Tictoc user!',
      followersCount: 0,
      followingCount: 0
    };

    await db().collection(COLLECTIONS.USERS).doc(user.uid).set(newUser);
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Login User (U002)
export const loginUser = async (email: string, password: string) => {
  try {
    const { user } = await firebaseAuth().signInWithEmailAndPassword(email, password);
    const userDoc = await db().collection(COLLECTIONS.USERS).doc(user.uid).get();
    return { success: true, user: userDoc.data() as User };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();
    
    if (!data?.idToken) {
      throw new Error('Google Sign-In failed: No ID Token received');
    }

    const googleCredential = firebaseAuth.GoogleAuthProvider.credential(data.idToken);
    const userCredential = await firebaseAuth().signInWithCredential(googleCredential);
    const { user } = userCredential;

    const userDoc = await db().collection(COLLECTIONS.USERS).doc(user.uid).get();
    
    let userData: User;
    if (!userDoc.exists) {
      userData = {
        uid: user.uid,
        username: user.displayName?.replace(/\s/g, '').toLowerCase() || 'user',
        email: user.email || '',
        avatarUrl: user.photoURL || 'https://picsum.photos/200/200',
        bio: 'Joined with Tictoc!',
        followersCount: 0,
        followingCount: 0
      };
      await db().collection(COLLECTIONS.USERS).doc(user.uid).set(userData);
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
    await GoogleSignin.signOut(); // Ensure Google session is also cleared
    await firebaseAuth().signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const doc = await db().collection(COLLECTIONS.USERS).doc(uid).get();
    return doc.exists() ? (doc.data() as User) : null;
  } catch {
    return null;
  }
};

export const onAuthStateChanged = (callback: any) => {
  return firebaseAuth().onAuthStateChanged(callback);
};
