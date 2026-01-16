import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { X, Search } from 'lucide-react-native';
import { User } from '../types/type';
import * as userService from '../services/userService';

interface FollowListModalProps {
  visible: boolean;
  title: 'Followers' | 'Following' | 'Friends';
  userId: string;
  onClose: () => void;
  onUserPress?: (user: User) => void;
  enableTabs?: boolean;
}

const { width } = Dimensions.get('window');


const FollowListModal: React.FC<FollowListModalProps> = ({
  visible,
  title,
  userId,
  onClose,
  onUserPress,
  enableTabs = false
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Suggested users (merged following/followers)
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  console.log(`FollowListModal: visible=${visible}, title=${title}, enableTabs=${enableTabs}`);

  useEffect(() => {
    if (visible && userId) {
      if (enableTabs) {
        // Unified Mode: Fetch 'Suggested' users (Friends/Following)
        fetchSuggestedUsers();
      } else {
        // Standard Mode: Fetch specific list
        fetchSpecificList(title);
      }
      setSearchQuery(''); // Reset search on open
    }
  }, [visible, userId, title, enableTabs]);

  // Debounced Search Effect
  useEffect(() => {
    if (!enableTabs) return;

    if (!searchQuery.trim()) {
      setUsers(suggestedUsers);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsSearching(true);
      try {
        const results = await userService.searchUsers(searchQuery);
        setUsers(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, suggestedUsers, enableTabs]);

  const fetchSpecificList = async (listType: string) => {
    setLoading(true);
    try {
      let list: User[] = [];
      if (listType === 'Followers') {
        list = await userService.getFollowers(userId);
      } else if (listType === 'Following') {
        list = await userService.getFollowing(userId);
      } else if (listType === 'Friends') {
        list = await userService.getFriends(userId);
      }
      setUsers(list);
    } catch (error) {
      console.error(`Error fetching ${listType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    try {
      // Fetch Following & Followers to suggest
      const [following, followers] = await Promise.all([
        userService.getFollowing(userId),
        userService.getFollowers(userId)
      ]);

      // Merge and Deduplicate by UID
      const map = new Map<string, User>();
      [...following, ...followers].forEach(u => map.set(u.uid, u));

      const merged = Array.from(map.values());
      setSuggestedUsers(merged);
      setUsers(merged); // Initially show suggested
    } catch (error) {
      console.error("Error fetching suggested:", error);
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
          <Text style={styles.title}>{enableTabs ? 'New Chat' : title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar (Only in Selection/New Chat Mode) */}
        {enableTabs && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#888" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fe2c55" />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {enableTabs && searchQuery ? "No users found" :
                enableTabs ? "No suggested users" :
                  `No ${title.toLowerCase()} yet`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.uid}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
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
