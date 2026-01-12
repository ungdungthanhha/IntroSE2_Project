import '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export const firebaseAuth = auth(); 
export const db = firestore();
export const firebaseStorage = storage();

export const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  CHATS: 'chats',
  LIVESTREAMS: 'livestreams',
};

// Tập trung tên các sub-collection để tránh viết tay rải rác
export const SUBCOLLECTIONS = {
  USER_FOLLOWERS: 'followers',
  USER_FOLLOWING: 'following',
  VIDEO_LIKES: 'likes',
  VIDEO_COMMENTS: 'comments',
};