import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert, Dimensions 
} from 'react-native';
import { ArrowLeft, Share2, Play, Edit2, Check, Video as VideoIcon } from 'lucide-react-native';
import * as soundService from '../services/soundService';
import { Sound, Video } from '../types/type';

const { width } = Dimensions.get('window');

interface SoundDetailViewProps {
  soundId: string;
  onBack: () => void;
  currentUser: any;
  onUseSound: (sound: Sound) => void; // Hàm callback khi bấm "Sử dụng âm thanh này"
}

const SoundDetailView: React.FC<SoundDetailViewProps> = ({ soundId, onBack, currentUser, onUseSound }) => {
  const [sound, setSound] = useState<Sound | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Name Logic
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadData();
  }, [soundId]);

  const loadData = async () => {
    setLoading(true);
    const data = await soundService.getSoundDetails(soundId);
    if (data) {
      setSound(data.sound);
      setEditName(data.sound.name);
      setVideos(data.videos);
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!sound) return;
    try {
      await soundService.updateSoundName(sound.id, editName);
      setSound({ ...sound, name: editName });
      setIsEditing(false);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể đổi tên");
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#fe2c55" /></View>;
  if (!sound) return <View style={styles.loading}><Text style={{color:'#fff'}}>Sound not found</Text></View>;

  const isOwner = currentUser?.uid === sound.ownerUid;

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={onBack}><ArrowLeft color="#000" size={24} /></TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{sound.name}</Text>
        <TouchableOpacity><Share2 color="#000" size={24} /></TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        numColumns={3}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Image source={{ uri: sound.thumbnailUrl }} style={styles.cover} />
            <View style={styles.info}>
              {/* Tên Sound (Có thể edit) */}
              <View style={styles.nameRow}>
                {isEditing ? (
                  <View style={{flexDirection: 'row', alignItems:'center', flex:1}}>
                    <TextInput 
                      style={styles.input} 
                      value={editName} 
                      onChangeText={setEditName} 
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveName} style={{marginLeft: 10}}>
                      <Check color="green" size={24}/>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.title}>{sound.name}</Text>
                    {/* Chỉ hiện bút sửa nếu là sound gốc của user này */}
                    {isOwner && !sound.isSystemSound && (
                      <TouchableOpacity onPress={() => setIsEditing(true)} style={{marginLeft: 8}}>
                        <Edit2 size={16} color="#000"/>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
              
              <Text style={styles.artist}>{sound.ownerName}</Text>
              <Text style={styles.stats}>{sound.usageCount} videos</Text>
            </View>
            <TouchableOpacity style={styles.favBtn}><Text style={{fontWeight:'600'}}>Thêm vào Yêu thích</Text></TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <Image source={{ uri: item.thumbUrl }} style={styles.gridImg} />
            <Text style={styles.viewCount}>▷ {item.likesCount}</Text>
          </View>
        )}
      />

      {/* Nút Sử Dụng Âm Thanh */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.useBtn} onPress={() => onUseSound(sound)}>
          <VideoIcon color="#fff" size={20} fill="#fff" />
          <Text style={styles.useText}>Sử dụng âm thanh này</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor:'#fff' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  navTitle: { fontWeight: 'bold', fontSize: 16, maxWidth: '70%' },
  header: { alignItems: 'center', padding: 20 },
  cover: { width: 100, height: 100, borderRadius: 8, marginBottom: 16 },
  info: { alignItems: 'center', width: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  input: { fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, flex: 1, textAlign: 'center' },
  artist: { color: 'gray', fontSize: 14 },
  stats: { color: '#888', fontSize: 12, marginTop: 4 },
  favBtn: { marginTop: 16, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 4 },
  
  gridItem: { width: width / 3, height: (width / 3) * 1.3, borderWidth: 0.5, borderColor: '#fff' },
  gridImg: { width: '100%', height: '100%', backgroundColor: '#eee' },
  viewCount: { position: 'absolute', bottom: 5, left: 5, color: '#fff', fontSize: 12, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 2 },
  
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#eee' },
  useBtn: { backgroundColor: '#fe2c55', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 4, gap: 8 },
  useText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SoundDetailView;