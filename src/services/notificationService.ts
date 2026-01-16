import { db, COLLECTIONS } from '../config/firebase';
import { Notification } from '../types/type';
import firestore from '@react-native-firebase/firestore';

/**
 * Gửi thông báo tới người dùng
 */
export const sendNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    try {
        const newNotiRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();
        const newNoti: Notification = {
            ...notification,
            id: newNotiRef.id,
            timestamp: Date.now(),
            isRead: false,
        };
        await newNotiRef.set(newNoti);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Lấy danh sách thông báo của người dùng hiện tại
 */
export const getNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    return db.collection(COLLECTIONS.NOTIFICATIONS)
        .where('toUserId', '==', userId)
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            const notifications = snapshot.docs.map(doc => doc.data() as Notification);
            callback(notifications);
        }, error => {
            console.error('Error fetching notifications:', error);
        });
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markAsRead = async (notificationId: string) => {
    try {
        await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).update({
            isRead: true,
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Đánh dấu toàn bộ thông báo là đã đọc
 */
export const markAllAsRead = async (userId: string) => {
    try {
        const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
            .where('toUserId', '==', userId)
            .where('isRead', '==', false)
            .get();

        if (snapshot.empty) return { success: true };

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });

        await batch.commit();
        return { success: true };
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
    }
};
