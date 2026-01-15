import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TextInput, FlatList, 
  TouchableOpacity, Image, ActivityIndicator, SafeAreaView, Dimensions 
} from 'react-native';
import { X, Search, Play, Pause, Music2 } from 'lucide-react-native';
import Video from 'react-native-video';
import * as musicService from '../services/musicService' // File cũ bạn đã có
import * as soundService from '../services/soundService'; // File mới ở trên
import { Sound } from '../types/type';

const { width } = Dimensions.get('window');

interface MusicPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sound: Sound) => void;
}

const MusicPickerModal: React.FC<MusicPickerModalProps> = ({ visible, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'itunes' | 'internal'>('itunes');
  
  // State Tab iTunes
  const [query, setQuery] = useState('');
  const [itunesResults, setItunesResults] = useState<Sound[]>([]);
  
  // State Tab Internal
  const [internalSounds, setInternalSounds] = useState<Sound[]>([]);

  const [loading, setLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // Load Internal Sounds khi mở Tab 2
  useEffect(() => {
    if (activeTab === 'internal' && internalSounds.length === 0) {
      loadInternalSounds();
    }
  }, [activeTab]);

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

  const renderItem = ({ item }: { item: Sound }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => togglePreview(item.audioUrl)}>
        <View style={styles.thumbWrapper}>
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
          <View style={styles.playOverlay}>
            {playingUrl === item.audioUrl ? <Pause size={16} color="#fff" fill="#fff"/> : <Play size={16} color="#fff" fill="#fff"/>}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.songName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artistName}>{item.ownerName}</Text>
        {!item.isSystemSound && <Text style={styles.usage}>{item.usageCount} videos</Text>}
      </View>

      <TouchableOpacity style={styles.selectBtn} onPress={() => handleSelect(item)}>
        <Text style={styles.selectText}>Use</Text>
      </TouchableOpacity>
    </View>
  );

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
                  value={query} onChangeText={setQuery} onSubmitEditing={handleItunesSearch} 
                />
              </View>
              {loading ? <ActivityIndicator color="#fe2c55" style={{marginTop: 20}}/> : (
                <FlatList data={itunesResults} keyExtractor={i => i.id} renderItem={renderItem} />
              )}
            </>
          ) : (
            loading ? <ActivityIndicator color="#fe2c55" style={{marginTop: 20}}/> : (
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
                style={{ width: 0, height: 0 }}  />}
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
  selectBtn: { backgroundColor: '#fe2c55', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4 },
  selectText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', margin: 16, marginBottom: 0 }
});

export default MusicPickerModal;