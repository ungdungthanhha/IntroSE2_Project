
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ArrowLeft, BellOff, Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Notification, Video as VideoType } from '../types/type';
import * as notificationService from '../services/notificationService';
import * as videoService from '../services/videoService';

interface ActivityViewProps {
    currentUser: User;
    onBack: () => void;
    onSelectUser: (user: Partial<User>) => void;
    onSelectVideo: (video: VideoType) => void;
}

const ActivityView: React.FC<ActivityViewProps> = ({ currentUser, onBack, onSelectUser, onSelectVideo }) => {
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!currentUser?.uid) return;

        setLoading(true);
        const unsubscribe = notificationService.getNotifications(currentUser.uid, (list: Notification[]) => {
            setNotifications(list);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    const onRefresh = () => {
        setRefreshing(true);
        // Snapshot listener will handle the update
    };

    const handleMarkAllAsRead = async () => {
        if (!currentUser?.uid) return;
        await notificationService.markAllAsRead(currentUser.uid);
    };

    const handleNotificationPress = async (noti: Notification) => {
        // 1. Đánh dấu đã đọc
        if (!noti.isRead) {
            notificationService.markAsRead(noti.id);
        }

        // 2. Điều hướng tùy theo loại thông báo
        if (noti.type === 'follow') {
            onSelectUser({
                uid: noti.fromUserId,
                username: noti.fromUserName,
                avatarUrl: noti.fromUserAvatar
            });
        } else if ((noti.type === 'like' || noti.type === 'comment') && noti.videoId) {
            // Fetch full video object
            try {
                const videoData = await videoService.getVideoById(noti.videoId, currentUser.uid);
                if (videoData) {
                    onSelectVideo(videoData);
                } else {
                    Alert.alert('Lỗi', 'Video này không còn tồn tại hoặc đã bị xóa.');
                }
            } catch (error) {
                console.error('Error fetching video for notification:', error);
                Alert.alert('Lỗi', 'Không thể mở video vào lúc này.');
            }
        }
    };

    const renderNotificationIcon = (type: string) => {
        switch (type) {
            case 'like':
                return <View style={[styles.iconContainer, { backgroundColor: '#fe2c55' }]}><Heart size={14} color="#fff" fill="#fff" /></View>;
            case 'comment':
                return <View style={[styles.iconContainer, { backgroundColor: '#00d4ff' }]}><MessageCircle size={14} color="#fff" fill="#fff" /></View>;
            case 'follow':
                return <View style={[styles.iconContainer, { backgroundColor: '#fe2c55' }]}><UserPlus size={14} color="#fff" /></View>;
            default:
                return null;
        }
    };

    const getNotificationMessage = (noti: Notification) => {
        switch (noti.type) {
            case 'like':
                return 'liked your video.';
            case 'comment':
                return `commented: ${noti.commentText || ''}`;
            case 'follow':
                return 'started following you.';
            default:
                return '';
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notiItem, !item.isRead && styles.unreadItem]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.avatarWrapper}>
                <Image source={{ uri: item.fromUserAvatar || 'https://picsum.photos/200' }} style={styles.avatar} />
                <View style={styles.badgeWrapper}>
                    {renderNotificationIcon(item.type)}
                </View>
            </View>
            <View style={styles.notiContent}>
                <Text style={styles.notiText}>
                    <Text style={styles.username}>{item.fromUserName} </Text>
                    {getNotificationMessage(item)}
                    <Text style={styles.timestamp}> {new Date(item.timestamp).toLocaleDateString()}</Text>
                </Text>
            </View>
            {item.videoThumbnail && (
                <Image source={{ uri: item.videoThumbnail }} style={styles.videoThumbnail} />
            )}
            {item.type === 'follow' && (
                <TouchableOpacity
                    style={styles.followBtn}
                    onPress={(e) => {
                        e.stopPropagation();
                        // Optional: Handle follow back directly here if needed
                        handleNotificationPress(item);
                    }}
                >
                    <Text style={styles.followBtnText}>Follow back</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
                    <ArrowLeft color="#000" size={24} />
                </TouchableOpacity>
                <View style={styles.titleWrapper}>
                    <Text style={styles.title}>All activity</Text>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={handleMarkAllAsRead}>
                    <Text style={styles.markReadText}>Mark as read</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="small" color="#fe2c55" />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyIconContainer}>
                        <BellOff size={60} color="#ccc" strokeWidth={1} />
                    </View>
                    <Text style={styles.emptyTitle}>No activity yet</Text>
                    <Text style={styles.emptySubtitle}>Notifications about your account will appear here</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fe2c55" />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerBtn: {
        padding: 8,
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    markReadText: {
        fontSize: 13,
        color: '#fe2c55',
        fontWeight: '500',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    notiItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    unreadItem: {
        backgroundColor: '#f9f9f9',
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    badgeWrapper: {
        position: 'absolute',
        bottom: -2,
        right: -2,
    },
    iconContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    notiContent: {
        flex: 1,
    },
    notiText: {
        fontSize: 14,
        color: '#000',
        lineHeight: 18,
    },
    username: {
        fontWeight: '700',
    },
    timestamp: {
        fontSize: 12,
        color: '#888',
    },
    videoThumbnail: {
        width: 40,
        height: 52,
        borderRadius: 4,
        marginLeft: 12,
        backgroundColor: '#f0f0f0',
    },
    followBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fe2c55',
        borderRadius: 4,
        marginLeft: 12,
    },
    followBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ActivityView;
