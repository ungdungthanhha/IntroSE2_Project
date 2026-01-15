import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as videoService from '../services/videoService';
import * as soundService from '../services/soundService';
import * as musicService from '../services/musicService';
import CameraScreen from './CameraScreen';
import PreviewScreen from './PreviewScreen';
import DetailsScreen from './DetailsScreen';
import MusicPickerModal from './MusicPickerModal';
import firestore from '@react-native-firebase/firestore';
import { Sound } from '../types/type';

interface UploadViewProps {
  onClose: () => void;
  onPost: (video: any) => void;
  currentUser: any;
  initialSound?: Sound;
}

const UploadView: React.FC<UploadViewProps> = ({ onClose, onPost, currentUser, initialSound}) => {
  const [step, setStep] = useState<'camera' | 'preview' | 'details'>('camera');
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isMusicPickerVisible, setMusicPickerVisible] = useState(false);
  const [selectedSound, setSelectedSound] = useState<Sound | undefined>(initialSound);

  // Xử lý khi quay xong hoặc chọn từ thư viện
  const handleVideoReady = (path: string) => {
    setVideoPath(path);
    setStep('preview');
  };

  // Xử lý khi bấm "Tiếp" ở màn Preview
  const handleGoToDetails = () => {
    setStep('details');
  };

  const handleOpenMusicPicker = () => {
    setMusicPickerVisible(true);
  };

  // Logic đăng bài (giữ nguyên logic cũ)
  const handlePostVideo = async (caption: string, setIsLoading: (loading: boolean) => void) => {
    if (!videoPath) return;
    setIsLoading(true);
    try {
      const cloud = await videoService.uploadVideoToCloudinary(videoPath);
      if (!cloud) throw new Error("Upload failed");
      const newVideoId = firestore().collection('videos').doc().id;
      
      let finalSoundData = { id: '', name: '', thumb: '' };

      // 2. Xử lý Sound
      if (selectedSound) {
        // A. Sử dụng sound có sẵn (iTunes hoặc App Sound)
        if (selectedSound.isSystemSound) {
           await musicService.ensureSystemSoundExists(selectedSound); // Đảm bảo iTunes sound có trong DB
        } else {
           await soundService.incrementSoundUsage(selectedSound.id); // Tăng count cho App Sound
        }
        finalSoundData = { 
          id: selectedSound.id, 
          name: selectedSound.name, 
          thumb: selectedSound.thumbnailUrl 
        };
      } else {
        // B. Tạo "Âm thanh gốc" từ video này
        const newSound = await soundService.createOriginalSound(newVideoId, cloud.videoUrl, currentUser);
        finalSoundData = { 
          id: newSound.id, 
          name: newSound.name, 
          thumb: newSound.thumbnailUrl 
        };
      }

      // 3. Save Metadata
      const videoMeta = {
        id: newVideoId,
        ownerUid: currentUser?.uid,
        ownerName: currentUser?.displayName || currentUser?.username,
        ownerAvatar: currentUser?.avatarUrl,
        videoUrl: cloud.videoUrl,
        thumbUrl: cloud.thumbUrl,
        caption,
        
        soundId: finalSoundData.id,
        soundName: finalSoundData.name,
        soundThumb: finalSoundData.thumb,
        
        // Lưu link nhạc để VideoItem phát song song (quan trọng)
        soundAudioUrl: selectedSound ? selectedSound.audioUrl : null,

        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        createdAt: Date.now()
      };

      await videoService.saveVideoMetadata(videoMeta);
      onPost(videoMeta);
      onClose();
    } catch (e) {
      Alert.alert('Error', (e as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <MusicPickerModal
        visible={isMusicPickerVisible}
        onClose={() => setMusicPickerVisible(false)}
        onSelect={(sound) => setSelectedSound(sound)}
      />

      {step === 'camera' && (
        <CameraScreen
          onClose={onClose}
          onVideoRecorded={handleVideoReady}
          selectedSound={selectedSound} 
          onOpenMusicPicker={handleOpenMusicPicker}
        />
      )}

      {step === 'preview' && videoPath && (
        <PreviewScreen
          videoPath={videoPath}
          onBack={() => setStep('camera')}
          onNext={handleGoToDetails}
          selectedSound={selectedSound}
        />
      )}

      {step === 'details' && videoPath && (
        <DetailsScreen
          videoPath={videoPath}
          onBack={() => setStep('preview')}
          onSubmit={handlePostVideo}
          onSaveDraft={onClose}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});

export default UploadView;