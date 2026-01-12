import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const firebaseAuth = auth(); 
export const db = firestore();

export const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  CHATS: 'chats',
  LIVESTREAMS: 'livestreams',
};