import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as videoService from '../services/videoService'; // Giữ nguyên import service của bạn
import CameraScreen from './CameraScreen';
import PreviewScreen from './PreviewScreen';
import DetailsScreen from './DetailsScreen';

interface UploadViewProps {
  onClose: () => void;
  onPost: (video: any) => void;
  currentUser: any;
}

const UploadView: React.FC<UploadViewProps> = ({ onClose, onPost, currentUser }) => {
  const [step, setStep] = useState<'camera' | 'preview' | 'details'>('camera');
  const [videoPath, setVideoPath] = useState<string | null>(null);

  // Xử lý khi quay xong hoặc chọn từ thư viện
  const handleVideoReady = (path: string) => {
    setVideoPath(path);
    setStep('preview');
  };

  // Xử lý khi bấm "Tiếp" ở màn Preview
  const handleGoToDetails = () => {
    setStep('details');
  };

  // Logic đăng bài (giữ nguyên logic cũ)
  const handlePostVideo = async (caption: string, setIsLoading: (loading: boolean) => void) => {
    if (!videoPath) return;
    setIsLoading(true);
    try {
      const cloud = await videoService.uploadVideoToCloudinary(videoPath);
      if (cloud) {
        const meta = {
          ownerUid: currentUser?.uid,
          ownerName: currentUser?.username,
          ownerAvatar: currentUser?.avatarUrl,
          videoUrl: cloud.videoUrl,
          thumbUrl: cloud.thumbUrl,
          caption,
          createdAt: Date.now()
        };
        await videoService.saveVideoMetadata(meta);
        onPost(meta);
        onClose();
      }
    } catch (e) {
      Alert.alert('Error', (e as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 'camera' && (
        <CameraScreen
          onClose={onClose}
          onVideoRecorded={handleVideoReady}
        />
      )}

      {step === 'preview' && videoPath && (
        <PreviewScreen
          videoPath={videoPath}
          onBack={() => setStep('camera')}
          onNext={handleGoToDetails}
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