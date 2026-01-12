import firestore from '@react-native-firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { Chat, Message, User } from '../types/type';

const chatIdFromParticipants = (a: string, b: string) => [a, b].sort().join('_');

export const getOrCreateChat = async (currentUser: User, targetUser: User): Promise<Chat> => {
  const chatId = chatIdFromParticipants(currentUser.uid, targetUser.uid);
  const chatRef = db.collection(COLLECTIONS.CHATS).doc(chatId);

  const snap = await chatRef.get();
  if (snap.exists) {
    return snap.data() as Chat;
  }

  const newChat: Chat = {
    id: chatId,
    participants: [currentUser.uid, targetUser.uid],
    lastMessage: '',
    timestamp: Date.now(),
    otherUser: {
      uid: targetUser.uid,
      username: targetUser.username,
      avatarUrl: targetUser.avatarUrl,
      displayName: targetUser.displayName,
    },
  } as Chat;

  await chatRef.set(newChat);
  return newChat;
};

export const subscribeChats = (currentUserId: string, cb: (chats: Chat[]) => void) => {
  return db
    .collection(COLLECTIONS.CHATS)
    .where('participants', 'array-contains', currentUserId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const list = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Chat))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        cb(list);
      },
      (error) => {
        console.error('subscribeChats error:', error);
        cb([]);
      }
    );
};

export const subscribeMessages = (chatId: string, cb: (messages: Message[]) => void) => {
  return db
    .collection(COLLECTIONS.CHATS)
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
        cb(list);
      },
      (error) => {
        console.error('subscribeMessages error:', error);
        cb([]);
      }
    );
};

export const sendMessage = async (
  chatId: string,
  sender: User,
  text: string,
  targetUser?: User
) => {
  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: 'Empty message' };

  const chatRef = db.collection(COLLECTIONS.CHATS).doc(chatId);
  const msgRef = chatRef.collection('messages').doc();
  const now = Date.now();

  const batch = db.batch();

  const message: Message = {
    id: msgRef.id,
    chatId,
    senderId: sender.uid,
    text: trimmed,
    timestamp: now,
  };

  batch.set(msgRef, message);

  // update chat metadata
  const chatUpdate: Partial<Chat> = {
    lastMessage: trimmed,
    timestamp: now,
  };

  // ensure otherUser cached for new chat creation path
  if (targetUser) {
    chatUpdate.otherUser = {
      uid: targetUser.uid,
      username: targetUser.username,
      avatarUrl: targetUser.avatarUrl,
      displayName: targetUser.displayName,
    } as Partial<User>;
  }

  batch.set(chatRef, chatUpdate, { merge: true });

  await batch.commit();
  return { success: true };
};

export const ensureChatAndSend = async (
  currentUser: User,
  targetUser: User,
  text: string
) => {
  const chat = await getOrCreateChat(currentUser, targetUser);
  return sendMessage(chat.id, currentUser, text, targetUser);
};
