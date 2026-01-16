import firestore from '@react-native-firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { Chat, Message, User } from '../types/type';

const chatIdFromParticipants = (a: string, b: string) => [a, b].sort().join('_');

export const getOrCreateChat = async (currentUser: User, targetUser: User): Promise<Chat> => {
  console.log('[chatService] getOrCreateChat started', { current: currentUser.uid, target: targetUser.uid });
  try {
    const chatId = chatIdFromParticipants(currentUser.uid, targetUser.uid);
    console.log('[chatService] Derived chatId:', chatId);
    const chatRef = db.collection(COLLECTIONS.CHATS).doc(chatId);

    console.log('[chatService] Fetching chat doc...');
    const snap = await chatRef.get().catch(e => { throw new Error(`Get Error: ${e.message}`) });

    if (snap.exists()) {
      console.log('[chatService] Chat hit found');
      return snap.data() as Chat;
    }

    console.log('[chatService] No existing chat, creating new...');

    const newChat: Chat = {
      id: chatId,
      participants: [currentUser.uid, targetUser.uid],
      lastMessage: '',
      timestamp: Date.now(),
      otherUser: {
        uid: targetUser.uid,
        username: targetUser.username || '',
        avatarUrl: targetUser.avatarUrl || '',
        displayName: targetUser.displayName || '',
      },
      unreadCounts: {
        [currentUser.uid]: 0,
        [targetUser.uid]: 0,
      }
    } as Chat;

    await chatRef.set(newChat);
    console.log('[chatService] New chat created');
    return newChat;
  } catch (error: any) {
    console.error('[chatService] getOrCreateChat ERROR:', error);
    throw error;
  }
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
          .filter(c => !c.deletedBy?.includes(currentUserId)) // Filter out deleted chats
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
      username: targetUser.username || '',
      avatarUrl: targetUser.avatarUrl || '',
      displayName: targetUser.displayName || '',
    };
    // Increment unread count for target user
    // Note: We use string key for map update
    (chatUpdate as any)[`unreadCounts.${targetUser.uid}`] = firestore.FieldValue.increment(1);
  } else {
    // Fallback if targetUser not passed (should rely on logic to find other ID, but here we might fail to increment if we don't know who is who)
    // Actually sendMessage caller should usually pass targetUser or we need to read chat to know who is other.
    // For now, let's assume targetUser is passed or we skip unread increment (safest).
  }


  // Restore chat for the other user if they deleted it
  if (targetUser) {
    (chatUpdate as any).deletedBy = firestore.FieldValue.arrayRemove(targetUser.uid);
  }

  batch.update(chatRef, chatUpdate);

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

export const markChatRead = async (chatId: string, userId: string) => {
  try {
    await db.collection(COLLECTIONS.CHATS).doc(chatId).update({
      [`unreadCounts.${userId}`]: 0
    });
  } catch (error) {
    console.error('Error marking chat read:', error);
  }
};

export const deleteChatForUser = async (chatId: string, userId: string) => {
  try {
    const updateData: any = {
      deletedBy: firestore.FieldValue.arrayUnion(userId)
    };
    updateData[`clearedTimestamps.${userId}`] = Date.now();

    await db.collection(COLLECTIONS.CHATS).doc(chatId).update(updateData);
  } catch (error) {
    console.error('Error deleting chat for user:', error);
    throw error;
  }
};

export const deleteMessageForMe = async (chatId: string, messageId: string, userId: string) => {
  try {
    await db.collection(COLLECTIONS.CHATS).doc(chatId)
      .collection('messages').doc(messageId).update({
        deletedFor: firestore.FieldValue.arrayUnion(userId)
      });
  } catch (error) {
    console.error('Error deleting message for me:', error);
    throw error;
  }
};

export const recallMessage = async (chatId: string, messageId: string) => {
  try {
    // Hard delete for "Unsend" / "Recall"
    await db.collection(COLLECTIONS.CHATS).doc(chatId)
      .collection('messages').doc(messageId).delete();
  } catch (error) {
    console.error('Error recalling message:', error);
    throw error;
  }
};
