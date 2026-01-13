import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Dimensions, StatusBar 
} from 'react-native';
import { Image } from 'react-native'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, ScanLine } from 'lucide-react-native';
// IMPORT THƯ VIỆN VIDEO CỦA BẠN (VD: react-native-video)
import Video from 'react-native-video'; 
import { User, Video as VideoType } from '../types/type';

const { width } = Dimensions.get('window');
const COL_WIDTH = (width - 24) / 2;

interface DiscoveryViewProps {
  allVideos: VideoType[];
  onSelectVideo: (video: VideoType) => void;
  onSelectUser: (user: Partial<User>) => void; 
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ allVideos, onSelectVideo, onSelectUser }) => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [filteredVideos, setFilteredVideos] = useState<VideoType[]>([]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredVideos(allVideos);
    } else {
      const lowerQuery = searchText.toLowerCase();
      const results = allVideos.filter(video => 
        (video.caption && video.caption.toLowerCase().includes(lowerQuery)) ||
        (video.ownerName && video.ownerName.toLowerCase().includes(lowerQuery))
      );
      setFilteredVideos(results);
    }
  }, [searchText, allVideos]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10}]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={20} color="#888" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Search"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={18} color="#888" style={{ marginRight: 10 }} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={{ marginLeft: 12 }}>
          <ScanLine size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* GRID KẾT QUẢ */}
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            
            {/* --- PHẦN SỬA ĐỔI: DÙNG VIDEO LÀM THUMBNAIL --- */}
            <View style={styles.cardImgContainer}>
      
              {item.thumbUrl ? (
                <Image
                  source={{ uri: item.thumbUrl }}
                  style={styles.videoThumb}
                  resizeMode="cover"
                />
              ) : (
                /* Fallback cho video cũ chưa có thumbnail */
                <Video
                  source={{ uri: item.videoUrl }}
                  style={styles.videoThumb}
                  resizeMode="cover"
                  paused={true}
                  muted={true}
                  controls={false}
                />
              )}

              {/* Lớp 2: Nút bấm phủ đè lên trên cùng (Overlay) */}
              <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                onPress={() => onSelectVideo(item)}
                activeOpacity={0.7} 
              />
              
            </View>
            {/* ----------------------------------------------- */}

            <View style={styles.cardInfo}>
              <Text style={styles.cardCaption} numberOfLines={2}>
                {item.caption || "No caption"}
              </Text>
              
              <TouchableOpacity 
                style={styles.cardUser}
                onPress={() => {
                   onSelectUser({
                     uid: item.ownerUid,
                     username: item.ownerName,
                     displayName: item.ownerName,
                     avatarUrl: item.ownerAvatar
                   });
                }}
              >
                {/* Avatar nhỏ vẫn dùng Image vì nó nhẹ */}
                <Image 
                  source={{ uri: item.ownerAvatar || 'https://via.placeholder.com/50' }} 
                  style={styles.miniAvatar} 
                />
                <Text style={styles.cardUserName} numberOfLines={1}>
                  {item.ownerName || "Unknown User"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

// Cần thêm import Image ở trên cùng nếu chưa có vì mình vừa xoá Image lớn nhưng vẫn dùng Image nhỏ cho avatar


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f2', borderRadius: 4, height: 40 },
  input: { flex: 1, fontSize: 16, color: '#000', paddingHorizontal: 10, height: '100%' },
  
  cardItem: { width: COL_WIDTH, marginBottom: 10, backgroundColor: '#fff' },
  
  // Style mới cho container video
  cardImgContainer: { 
    width: '100%', 
    height: COL_WIDTH * 1.5, 
    borderRadius: 4, 
    backgroundColor: '#000', // Nền đen trong lúc chờ load
    overflow: 'hidden'       // Để bo góc video
  },
  // Style cho video
  videoThumb: {
    width: '100%',
    height: '100%',
  },

  cardInfo: { padding: 8, paddingLeft: 4 },
  cardCaption: { color: '#000', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  cardUser: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 6, backgroundColor: '#eee' },
  cardUserName: { color: '#666', fontSize: 12 },
});

export default DiscoveryView;