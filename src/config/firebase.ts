import { firebase as authFirebase } from '@react-native-firebase/auth';
import { firebase as firestoreFirebase } from '@react-native-firebase/firestore';
import { firebase as storageFirebase } from '@react-native-firebase/storage';

// Get Firebase instances using modular API
export const getAuth = () => authFirebase.auth();
export const getFirestore = () => firestoreFirebase.firestore();
export const getStorage = () => storageFirebase.storage();

// For backward compatibility
export const firebaseAuth = getAuth;
export const db = getFirestore;
export const firebaseStorage = getStorage;

export const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  CHATS: 'chats',
  LIVESTREAMS: 'livestreams',
};