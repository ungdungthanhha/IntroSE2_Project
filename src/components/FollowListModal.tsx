import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { User } from '../types/type';
import * as userService from '../services/userService';

interface FollowListModalProps {
    visible: boolean;
    title: 'Followers' | 'Following';
    userId: string;
    onClose: () => void;
    onUserPress?: (user: User) => void;
}

const { width } = Dimensions.get('window');

const FollowListModal: React.FC<FollowListModalProps> = ({
    visible,
    title,
    userId,
    onClose,
    onUserPress
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            fetchFollowList();
        }
    }, [visible, userId]);

    const fetchFollowList = async () => {
        setLoading(true);
        try {
            const list = title === 'Followers'
                ? await userService.getFollowers(userId)
                : await userService.getFollowing(userId);
            setUsers(list);
            console.log(`${title}:`, list);
        } catch (error) {
            console.error(`Error fetching ${title}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => {
                if (onUserPress) onUserPress(item);
                onClose();
            }}
        >
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            <View style={styles.userInfo}>
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            transparent={false}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <X size={28} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fe2c55" />
                    </View>
                ) : users.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.uid}
                        renderItem={renderUserItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
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
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    listContent: {
        paddingVertical: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    displayName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    username: {
        fontSize: 12,
        color: '#999',
    },
});

export default FollowListModal;