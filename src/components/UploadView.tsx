import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { X, Wand2, ArrowLeft, Camera, Image as ImageIcon, RefreshCw, Square, Circle } from 'lucide-react-native';
import Video from 'react-native-video';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions, MediaType } from 'react-native-image-picker';
import { generateCaption } from '../services/geminiService';
import * as videoService from '../services/videoService';

interface UploadViewProps {
  onClose: () => void;
  onPost: (video: any) => void;
  currentUser: any;
}

const UploadView: React.FC<UploadViewProps> = ({ onClose, onPost, currentUser }) => {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<'15s' | '60s'>('60s');

  // Request permissions for Android
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const androidVersion = Platform.Version;

      if (androidVersion >= 33) {
        // Android 13+ uses granular media permissions
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ]);

        const granted =
          results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

        return granted;
      } else {
        // Older Android versions
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        const granted =
          results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

        return granted;
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  // Record video from camera
  const handleRecordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera and microphone permissions are required to record video.');
      return;
    }

    setIsLoading(true);

    const maxDurationSeconds = duration === '15s' ? 15 : duration === '60s' ? 60 : 180;

    const options: CameraOptions = {
      mediaType: 'video' as MediaType,
      videoQuality: 'high',
      durationLimit: maxDurationSeconds,
      cameraType: 'back',
      saveToPhotos: true,
    };

    launchCamera(options, (response) => {
      setIsLoading(false);

      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to record video');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];

        // Check duration (60s limit)
        const assetDuration = asset.duration || 0;
        if (assetDuration > 60) {
          Alert.alert('Video too long', 'Please record a video under 60 seconds.');
          return;
        }

        setPreviewUrl(asset.uri || null);
        setThumbnailUrl(asset.uri || null);
        setIsVideo(true);
        setStep('details');
      }
    });
  };

  // Pick video/image from gallery
  const handlePickFromGallery = async () => {
    setIsLoading(true);
    const result = await videoService.pickVideoFromGallery();
    setIsLoading(false);

    if (result) {
      // Check duration (60s limit)
      if (result.duration > 60) {
        Alert.alert('Video too long', 'Please select a video under 60 seconds.');
        return;
      }

      setPreviewUrl(result.uri);
      setThumbnailUrl(result.uri);
      setIsVideo(true);
      setStep('details');
    }
  };

  // Take a photo
  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    setIsLoading(true);

    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      quality: 1,
      saveToPhotos: true,
      cameraType: 'back',
    };

    launchCamera(options, (response) => {
      setIsLoading(false);

      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to take photo');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setPreviewUrl(asset.uri || null);
        setThumbnailUrl(asset.uri || null);
        setIsVideo(false);
        setStep('details');
      }
    });
  };

  const handleAiCaption = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const aiCaption = await generateCaption("a creative short video content for social media");
      setCaption(aiCaption);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate caption');
    }
    setIsGenerating(false);
  };

  const handleSubmit = async () => {
    if (!previewUrl) {
      Alert.alert('Error', 'Please select a video or photo first');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload to Cloudinary
      console.log('Starting Cloudinary upload...');
      const cloudinaryUrl = await videoService.uploadVideoToCloudinary(previewUrl);

      if (!cloudinaryUrl) {
        throw new Error('Failed to upload video to Cloudinary');
      }

      console.log('Cloudinary upload success:', cloudinaryUrl);

      // 2. Save metadata to Firestore
      const videoMetadata = {
        ownerUid: currentUser?.uid || 'anonymous',
        ownerName: currentUser?.username || 'Anonymous User',
        ownerAvatar: currentUser?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp',
        videoUrl: cloudinaryUrl,
        caption: caption,
        createdAt: new Date().toISOString() // Or use serverTimestamp if in videoService
      };

      const result = await videoService.saveVideoMetadata(videoMetadata as any);

      if (result.success) {
        Alert.alert('Success', 'Your video has been posted!');
        onPost(result.video);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to save video metadata');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'An error occurred during post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === 'select' ? (
        <View style={styles.selectContainer}>
          <View style={styles.selectHeader}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.selectTitle}>Create</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Duration Selector for Video Recording */}
          <View style={styles.durationSelector}>
            <TouchableOpacity
              onPress={() => setDuration('15s')}
              style={[styles.durationBtn, duration === '15s' && styles.durationBtnActive]}
            >
              <Text style={[styles.durationText, duration === '15s' && styles.durationTextActive]}>15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDuration('60s')}
              style={[styles.durationBtn, duration === '60s' && styles.durationBtnActive]}
            >
              <Text style={[styles.durationText, duration === '60s' && styles.durationTextActive]}>60s</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fe2c55" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <>
                {/* Record Video Button */}
                <TouchableOpacity style={styles.mainBtn} onPress={handleRecordVideo}>
                  <View style={styles.mainBtnIcon}>
                    <Camera size={36} color="#fff" />
                  </View>
                  <Text style={styles.mainBtnText}>Record Video</Text>
                  <Text style={styles.mainBtnSub}>Record up to {duration} video</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Secondary Options */}
                <View style={styles.secondaryOptions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickFromGallery}>
                    <View style={styles.secondaryBtnIcon}>
                      <ImageIcon size={24} color="#fff" />
                    </View>
                    <Text style={styles.secondaryBtnText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleTakePhoto}>
                    <View style={styles.secondaryBtnIcon}>
                      <Circle size={24} color="#fff" />
                    </View>
                    <Text style={styles.secondaryBtnText}>Photo</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.bottomHint}>
            <Text style={styles.hintText}>Tip: Use high quality lighting for best results</Text>
          </View>
        </View>
      ) : (
        <View style={styles.detailsContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('select')} style={styles.headerBtn}>
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            <View style={styles.captionSection}>
              <TextInput
                multiline
                value={caption}
                onChangeText={setCaption}
                placeholder="Describe your video..."
                placeholderTextColor="#999"
                style={styles.captionInput}
              />
              <View style={styles.previewThumbnail}>
                {isVideo ? (
                  <Video
                    source={{ uri: previewUrl! }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    paused={true}
                  />
                ) : (
                  <Image
                    source={{ uri: thumbnailUrl! }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>

            <View style={styles.wizardSection}>
              <TouchableOpacity
                onPress={handleAiCaption}
                disabled={isGenerating}
                style={styles.wizardBtn}
              >
                <Wand2 size={18} color="#fe2c55" />
                <Text style={styles.wizardBtnText}>
                  {isGenerating ? "Generating..." : "AI Caption Wizard"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRows}>
              <TouchableOpacity style={styles.settingRow}>
                <Text style={styles.settingLabel}>Location</Text>
                <Text style={styles.settingValue}>Add Location {'>'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingRow}>
                <Text style={styles.settingLabel}>Who can watch</Text>
                <Text style={styles.settingValue}>Everyone {'>'}</Text>
              </TouchableOpacity>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Allow Comments</Text>
                <View style={styles.toggleOn}>
                  <View style={styles.toggleThumb} />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.detailsFooter}>
            <TouchableOpacity style={styles.draftBtn} onPress={onClose}>
              <Text style={styles.draftBtnText}>Drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postBtn, isLoading && styles.postBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.postBtnText}>{isLoading ? "Posting..." : "Post"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Full-screen Loading Overlay for Posting */}
      {isLoading && step === 'details' && (
        <View style={styles.fullscreenLoading}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fe2c55" />
            <Text style={styles.loadingBoxText}>Posting your video...</Text>
            <Text style={styles.loadingBoxSub}>Please don't close the app</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  selectContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  selectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  iconBtn: {
    padding: 8,
  },
  selectTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  durationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  durationBtnActive: {
    backgroundColor: '#fe2c55',
  },
  durationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  durationTextActive: {
    color: '#fff',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  mainBtn: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(254,44,85,0.15)',
    borderWidth: 2,
    borderColor: '#fe2c55',
  },
  mainBtnIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fe2c55',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  mainBtnSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  secondaryOptions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomHint: {
    padding: 24,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  captionSection: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  captionInput: {
    flex: 1,
    height: 120,
    fontSize: 15,
    color: '#000',
    textAlignVertical: 'top',
  },
  previewThumbnail: {
    width: 96,
    height: 128,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  wizardSection: {
    paddingVertical: 24,
  },
  wizardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254,44,85,0.05)',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254,44,85,0.2)',
    gap: 10,
  },
  wizardBtnText: {
    color: '#fe2c55',
    fontSize: 14,
    fontWeight: '700',
  },
  settingRows: {
    gap: 24,
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  toggleOn: {
    width: 44,
    height: 24,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  detailsFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 12,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  draftBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  postBtn: {
    flex: 1,
    backgroundColor: '#fe2c55',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  postBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  postBtnDisabled: {
    backgroundColor: '#ff8a9e',
  },
  fullscreenLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  loadingBoxText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  loadingBoxSub: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default UploadView;
