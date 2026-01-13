import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import Video from 'react-native-video';
import { X, Music, Type, Sticker, Mic } from 'lucide-react-native';

interface PreviewScreenProps {
  videoPath: string;
  onBack: () => void;
  onNext: () => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({ videoPath, onBack, onNext }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Video 
        source={{ uri: videoPath }} 
        style={StyleSheet.absoluteFill} 
        resizeMode="contain" 
        repeat={true} 
      />
      
      <SafeAreaView style={styles.overlay}>
        {/* Header: Nút Back + Âm thanh ở giữa */}
        <View style={styles.header}>
           <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <X size={28} color="#fff" style={styles.shadow}/>
           </TouchableOpacity>

           {/* --- MỚI: Phần hiển thị âm thanh ở trên cùng --- */}
           <View style={styles.soundBadge}>
              <Music size={14} color="#fff" />
              <Text style={styles.soundTextHeader}>Original Sound</Text>
           </View>

           {/* View rỗng để cân bằng layout header */}
           <View style={{ width: 28 }} />
        </View>

        {/* Body: Sidebar bên phải */}
        <View style={styles.body}>
           <View style={styles.sidebar}>
              
              <TouchableOpacity style={styles.sidebarItem}>
                  <Type size={24} color="#fff" style={styles.shadow}/>
                  <Text style={styles.sidebarText}>Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem}>
                  <Sticker size={24} color="#fff" style={styles.shadow}/>
                  <Text style={styles.sidebarText}>Stickers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sidebarItem}>
                  <Mic size={24} color="#fff" style={styles.shadow}/>
                  <Text style={styles.sidebarText}>Audio</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* Footer: Nút Tiếp (Upload) */}
        <View style={styles.footer}>
           <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>Tiếp</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent:'space-between' },
  
  // Header styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'android' ? 40 : 20 
  },
  iconButton: { padding: 4 },
  
  // Style cho cục âm thanh trên cùng
  soundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8
  },
  soundTextHeader: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },

  shadow: { shadowColor:'#000', shadowRadius: 5, shadowOpacity: 0.5 },
  
  // Body styles
  body: { 
    flex: 1, 
    alignItems: 'flex-end', 
    // --- SỬA: Đổi từ center -> flex-start để đẩy lên trên ---
    justifyContent: 'flex-start', 
    paddingRight: 16,
    // --- SỬA: Thêm paddingTop để cách header ra một chút ---
    paddingTop: 40 
  },
  
  sidebar: { gap: 24, alignItems: 'center' },
  sidebarItem: { alignItems: 'center', gap: 4 },
  sidebarText: { color: '#fff', fontSize: 11, fontWeight: '600', textShadowColor:'rgba(0,0,0,0.5)', textShadowRadius: 3 },

  footer: { flexDirection:'row', justifyContent:'flex-end', padding: 20, paddingBottom: 30 },
  nextBtn: { backgroundColor: '#fe2c55', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 4 },
  nextText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default PreviewScreen;