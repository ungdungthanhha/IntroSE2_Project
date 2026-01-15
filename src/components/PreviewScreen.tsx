import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { X, Music, Type, Sticker, Mic, Volume2, VolumeX } from 'lucide-react-native';
import { Sound } from '../types/type';
import type { SelectedVideoTrackType } from 'react-native-video';
import SoundPlayer from 'react-native-sound';

interface PreviewScreenProps {
  videoPath: string;
  onBack: () => void;
  onNext: () => void;
  selectedSound?: Sound;
  onChangeSound?: () => void;
  onRemoveSound?: () => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({ videoPath, onBack, onNext, selectedSound, onChangeSound, onRemoveSound }) => {
  const [muted, setMuted] = useState(false);
  const [mutesOriginal, setMutesOriginal] = useState(!!selectedSound);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  // Ref để điều khiển tua lại
  const videoRef = useRef<any>(null);
  const soundRef = useRef<SoundPlayer | null>(null);
  const isLoopingRef = useRef(false);

  // 1. SETUP NHẠC (Load và Play)
  useEffect(() => {
    if (selectedSound) {
      const sound = new SoundPlayer(selectedSound.audioUrl, '', (error) => {
        if (error) {
          console.log('Lỗi load nhạc:', error);
          return;
        }

        // Mặc định cho loop vô tận (để lỡ video bị lag thì nhạc không tắt)
        // Nhưng ta sẽ kiểm soát việc loop bằng tay ở dưới
        sound.setNumberOfLoops(-1);
        sound.play();
      });

      soundRef.current = sound;
    }

    return () => {
      soundRef.current?.stop();
      soundRef.current?.release();
    };
  }, [selectedSound]);


  useEffect(() => {
    soundRef.current?.setVolume(muted ? 0 : 1.0);
  }, [muted]);

  const handleVideoProgress = (data: any) => {
    const currentTime = data.currentTime; // Thời gian hiện tại của Video hình

    // Nếu video đang ở những giây đầu tiên (ví dụ < 0.25s) 
    // Tức là video vừa mới Hết Loop và quay lại từ đầu
    if (currentTime < 0.25) {

      if (!isLoopingRef.current) {
        // ==> RA LỆNH: Tua nhạc về 0 ngay lập tức
        soundRef.current?.setCurrentTime(0);
        isLoopingRef.current = true; // Đánh dấu là đã xử lý loop này rồi
      }

    } else {
      // Khi video chạy qua 0.25s thì reset cờ để chờ lần loop sau
      isLoopingRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Video
        ref={videoRef}
        source={{ uri: videoPath }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        paused={false}   // Đảm bảo luôn chạy
        repeat={true}
        muted={!!selectedSound}
        // onLoad={() => setIsVideoLoaded(true)}
        onProgress={handleVideoProgress}
        bufferConfig={{
          minBufferMs: 2000,
          maxBufferMs: 10000,
          bufferForPlaybackMs: 500,
          bufferForPlaybackAfterRebufferMs: 1000
        }}
      />

      {/* {selectedSound && (
        <Video
          ref={audioRef}
          source={{ uri: selectedSound.audioUrl }}
          // Ẩn hình bằng style (Tránh lỗi audioOnly)
          style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }} 
          repeat={true}
          paused={false} // Luôn phát
          
          volume={muted ? 0 : 1.0}
          ignoreSilentSwitch={"ignore"}
          playInBackground={false}
          playWhenInactive={false}
          selectedVideoTrack={{ type: 'disabled' as SelectedVideoTrackType }} // Tắt video track
          onLoad={() => audioRef.current?.seek(0)}
        />
      )} */}

      <SafeAreaView style={styles.overlay}>
        {/* Header: Nút Back + Âm thanh ở giữa */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <X size={28} color="#fff" style={styles.shadow} />
          </TouchableOpacity>

          <View style={styles.soundBadgeContainer}>
            <TouchableOpacity style={styles.soundBadge} onPress={onChangeSound}>
              <Music size={14} color="#fff" />
              <Text style={styles.soundTextHeader} numberOfLines={1}>
                {selectedSound ? selectedSound.name : "Add Sound"}
              </Text>
            </TouchableOpacity>

            {selectedSound && onRemoveSound && (
              <TouchableOpacity style={styles.removeSoundBtn} onPress={onRemoveSound}>
                <X size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* View rỗng để cân bằng layout header */}
          <View style={{ width: 28 }} />
        </View>

        {/* Body: Sidebar bên phải */}
        <View style={styles.body}>
          <View style={styles.sidebar}>

            <TouchableOpacity style={styles.sidebarItem}>
              <Type size={24} color="#fff" style={styles.shadow} />
              <Text style={styles.sidebarText}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem}>
              <Sticker size={24} color="#fff" style={styles.shadow} />
              <Text style={styles.sidebarText}>Stickers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem}>
              <Mic size={24} color="#fff" style={styles.shadow} />
              <Text style={styles.sidebarText}>Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => setMuted(!muted)}>
              {muted ? (
                <VolumeX size={24} color="#fff" style={styles.shadow} />
              ) : (
                <Volume2 size={24} color="#fff" style={styles.shadow} />
              )}
              <Text style={styles.sidebarText}>{muted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer: Nút Tiếp (Upload) */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
            <Text style={styles.nextText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },

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
  // Style cho cục âm thanh trên cùng
  soundBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 8,
    gap: 4
  },
  soundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8
  },
  removeSoundBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15
  },
  soundTextHeader: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120

  },

  shadow: { shadowColor: '#000', shadowRadius: 5, shadowOpacity: 0.5 },

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
  sidebarText: { color: '#fff', fontSize: 11, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 20, paddingBottom: 30 },
  nextBtn: { backgroundColor: '#fe2c55', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 4 },
  nextText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default PreviewScreen;