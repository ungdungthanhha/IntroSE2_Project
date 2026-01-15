import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, FlatList,
  TouchableOpacity, Image, ActivityIndicator, SafeAreaView, Dimensions
} from 'react-native';
import { X, Search, Play, Pause, Music2, Plus, Minus } from 'lucide-react-native';
import Video from 'react-native-video';
import * as musicService from '../services/musicService' // File cũ bạn đã có
import * as soundService from '../services/soundService'; // File mới ở trên
import { Sound } from '../types/type';

const { width } = Dimensions.get('window');

interface MusicPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sound: Sound) => void;
  currentSound?: Sound;
  onRemove?: () => void;
}

const MusicPickerModal: React.FC<MusicPickerModalProps> = ({ visible, onClose, onSelect, currentSound, onRemove }) => {
  const [activeTab, setActiveTab] = useState<'itunes' | 'internal'>('itunes');

  // State Tab iTunes
  const [query, setQuery] = useState('');
  const [itunesResults, setItunesResults] = useState<Sound[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Sound[]>([]);

  // State Tab Internal
  const [internalSounds, setInternalSounds] = useState<Sound[]>([]);

  const [loading, setLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // Load trending songs when modal opens
  useEffect(() => {
    if (visible && trendingSongs.length === 0) {
      loadTrendingSongs();
    }
  }, [visible]);

  // Load Internal Sounds khi mở Tab 2
  useEffect(() => {
    if (activeTab === 'internal' && internalSounds.length === 0) {
      loadInternalSounds();
    }
  }, [activeTab]);

  const loadTrendingSongs = async () => {
    setLoading(true);
    // Search với các từ khóa trending để lấy nhạc hot
    const trendingKeywords = ['trending 2024', 'tiktok viral', 'top hits'];
    const randomKeyword = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];
    const songs = await musicService.searchMusic(randomKeyword);
    setTrendingSongs(songs);
    setLoading(false);
  };

  const loadInternalSounds = async () => {
    setLoading(true);
    const sounds = await soundService.getInternalSounds();
    setInternalSounds(sounds);
    setLoading(false);
  };

  const handleItunesSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPlayingUrl(null);
    const songs = await musicService.searchMusic(query);
    setItunesResults(songs);
    setLoading(false);
  };

  const togglePreview = (url: string) => {
    setPlayingUrl(prev => prev === url ? null : url);
  };

  const handleSelect = (sound: Sound) => {
    setPlayingUrl(null);
    onSelect(sound);
    onClose();
  };

  const handleRemove = () => {
    setPlayingUrl(null);
    if (onRemove) onRemove();
    onClose();
  };

  // Hiển thị kết quả tìm kiếm nếu có, nếu không thì hiện trending
  const displayedSongs = itunesResults.length > 0 ? itunesResults : trendingSongs;
  const listTitle = itunesResults.length > 0 ? 'Search Results' : '🔥 Trending Now';

  const renderItem = ({ item }: { item: Sound }) => {
    const isSelected = currentSound?.id === item.id;

    return (
      <View style={[styles.itemContainer, isSelected && styles.selectedItemContainer]}>
        <TouchableOpacity onPress={() => togglePreview(item.audioUrl)}>
          <View style={styles.thumbWrapper}>
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
            <View style={styles.playOverlay}>
              {playingUrl === item.audioUrl ? <Pause size={16} color="#fff" fill="#fff" /> : <Play size={16} color="#fff" fill="#fff" />}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={[styles.songName, isSelected && styles.selectedText]} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.artistName}>{item.ownerName}</Text>
          {!item.isSystemSound && <Text style={styles.usage}>{item.usageCount} videos</Text>}
        </View>

        {isSelected ? (
          <TouchableOpacity style={[styles.iconBtn, styles.removeBtn]} onPress={handleRemove}>
            <Minus size={16} color="#333" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.iconBtn, styles.addBtn]} onPress={() => handleSelect(item)}>
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add music</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color="#000" /></TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'itunes' && styles.activeTab]}
            onPress={() => setActiveTab('itunes')}
          >
            <Text style={[styles.tabText, activeTab === 'itunes' && styles.activeTabText]}>Apple Music</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'internal' && styles.activeTab]}
            onPress={() => setActiveTab('internal')}
          >
            <Text style={[styles.tabText, activeTab === 'internal' && styles.activeTabText]}>App Sounds</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'itunes' ? (
            <>
              <View style={styles.searchBox}>
                <Search size={20} color="#888" />
                <TextInput
                  style={styles.input}
                  placeholder="Find music on iTunes"
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    // Clear search results when query is cleared
                    if (text.trim() === '') {
                      setItunesResults([]);
                    }
                  }}
                  onSubmitEditing={handleItunesSearch}
                />
              </View>
              {loading ? <ActivityIndicator color="#fe2c55" style={{ marginTop: 20 }} /> : (
                <FlatList
                  data={displayedSongs}
                  keyExtractor={i => i.id}
                  renderItem={renderItem}
                  ListHeaderComponent={<Text style={styles.headerTitle}>{listTitle}</Text>}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Search for a song or wait for trending...</Text>
                    </View>
                  }
                />
              )}
            </>
          ) : (
            loading ? <ActivityIndicator color="#fe2c55" style={{ marginTop: 20 }} /> : (
              <FlatList
                data={internalSounds}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                ListHeaderComponent={<Text style={styles.headerTitle}>Trending Sounds</Text>}
              />
            )
          )}
        </View>

        {/* Invisible Player */}
        {playingUrl &&
          <Video
            source={{ uri: playingUrl }}
            paused={false}
            style={{ width: 0, height: 0 }} />}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#fe2c55' },
  tabText: { color: 'gray', fontWeight: '600' },
  activeTabText: { color: '#000' },
  searchBox: { flexDirection: 'row', backgroundColor: '#f1f1f2', margin: 16, padding: 10, borderRadius: 8, alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16, padding: 0 },
  itemContainer: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#f9f9f9', alignItems: 'center' },
  thumbWrapper: { width: 50, height: 50, marginRight: 12 },
  thumb: { width: '100%', height: '100%', borderRadius: 4 },
  playOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  songName: { fontWeight: 'bold', fontSize: 15 },
  artistName: { color: 'gray', fontSize: 13 },
  usage: { color: '#888', fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 6, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: '#fe2c55' },
  removeBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' },
  removeBtnText: { color: '#333' },
  selectText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', margin: 16, marginBottom: 0 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#888', fontSize: 14 },
  selectedItemContainer: { backgroundColor: '#fff9fa' },
  selectedText: { color: '#fe2c55' }
});

export default MusicPickerModal;