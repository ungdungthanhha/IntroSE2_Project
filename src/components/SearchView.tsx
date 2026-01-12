import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react-native';
import * as userService from '../services/userService';
import { User, Video } from '../types/type';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';

interface SearchViewProps {
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [videoResults, setVideoResults] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'users' | 'videos'>('users');
  const insets = useSafeAreaInsets();

  // Tìm kiếm users
  useEffect(() => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      setVideoResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      try {
        const results = await userService.searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 500); // Debounce
    return () => clearTimeout(timer);
  }, [query, searchType]);

  // Tìm kiếm videos
  useEffect(() => {
    if (query.trim().length === 0) {
      setVideoResults([]);
      return;
    }

    const searchVideos = async () => {
      if (searchType !== 'videos') return;
      
      setIsLoading(true);
      try {
        const snapshot = await firestore()
          .collection('videos')
          .where('caption', '>=', query.toLowerCase())
          .where('caption', '<=', query.toLowerCase() + '\uf8ff')
          .limit(20)
          .get();

        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Video[];
        setVideoResults(results);
      } catch (error) {
        console.error('Video search error:', error);
        setVideoResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchVideos, 500);
    return () => clearTimeout(timer);
  }, [query, searchType]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <SearchIcon size={18} color="#999" style={styles.searchInputIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users, videos..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>

      {/* Search Type Tabs */}
      {query.trim().length > 0 && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, searchType === 'users' && styles.tabActive]}
            onPress={() => setSearchType('users')}
          >
            <Text style={[styles.tabText, searchType === 'users' && styles.tabTextActive]}>
              Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, searchType === 'videos' && styles.tabActive]}
            onPress={() => setSearchType('videos')}
          >
            <Text style={[styles.tabText, searchType === 'videos' && styles.tabTextActive]}>
              Videos
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {query.trim().length === 0 ? (
        <View style={styles.emptyState}>
          <SearchIcon size={48} color="#ccc" />
          <Text style={styles.emptyText}>Search for users or videos</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#fe2c55" size="large" />
        </View>
      ) : searchType === 'users' ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => onSelectUser(item)}
            >
              <Image
                source={{ uri: item.avatarUrl }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userHandle}>@{item.username}</Text>
                {item.bio && <Text style={styles.userBio}>{item.bio}</Text>}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      ) : (
        <FlatList
          data={videoResults}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.videoItem}>
              <Image
                source={{ uri: `https://picsum.photos/seed/${item.id}/150/200` }}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoOverlay}>
                <Text style={styles.videoCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No videos found</Text>
            </View>
          }
          scrollEnabled={true}
          nestedScrollEnabled={true}
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 15,
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#fe2c55',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  userItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  userHandle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  userBio: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  videoItem: {
    flex: 1,
    margin: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 0.75,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  videoCaption: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SearchView;
