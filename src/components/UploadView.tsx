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
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Linking,
  PermissionsAndroid
} from 'react-native';
import {
  X, ArrowLeft, Wand2, Image as ImageIcon,
  RotateCcw, Zap, Timer, Music
} from 'lucide-react-native';
import Video from 'react-native-video';
import {
  Camera,
  useCameraDevice,
  VideoFile
} from 'react-native-vision-camera';
import Svg, { Circle } from 'react-native-svg';
import * as videoService from '../services/videoService';
import { generateCaption } from '../services/geminiService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface UploadViewProps {
  onClose: () => void;
  onPost: (video: any) => void;
  currentUser: any;
}

const UploadView: React.FC<UploadViewProps> = ({ onClose, onPost, currentUser }) => {
  // State quản lý Flow
  const [step, setStep] = useState<'camera' | 'details'>('camera');

  // State Camera & Permissions
  const device = useCameraDevice('back');
  const [hasCamPermission, setHasCamPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const cameraRef = useRef<Camera>(null);

  // --- QUAN TRỌNG: Dùng Ref để tránh lỗi Closure khi hết giờ ---
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false); // State này chỉ để render UI

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');

  // State Logic quay
  const [duration, setDuration] = useState<15 | 60>(60);

  // State Upload
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const circleSize = 80;
  const strokeWidth = 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const requestFullPermissions = async (isInteractive = false) => {
    // isInteractive = true: Người dùng bấm nút (có thể hiện Alert setting)
    // isInteractive = false: Chạy lúc mở app (im lặng nếu bị từ chối)

    if (Platform.OS === 'android') {
      try {
        // Xin cả 2 quyền cùng lúc
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const camStatus = granted[PermissionsAndroid.PERMISSIONS.CAMERA];
        const micStatus = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

        // Cập nhật State
        const isCamGranted = camStatus === PermissionsAndroid.RESULTS.GRANTED;
        const isMicGranted = micStatus === PermissionsAndroid.RESULTS.GRANTED;

        setHasCamPermission(isCamGranted);
        setHasMicPermission(isMicGranted);

        // Logic hỏi lại hoặc bắt vào setting
        if (!isCamGranted || !isMicGranted) {
          // Nếu người dùng bấm nút Quay mà bị chặn vĩnh viễn
          if (isInteractive && (
            camStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
            micStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
          )) {
            Alert.alert(
              "Cần cấp quyền",
              "Bạn đã chặn quyền Camera hoặc Micro. Vui lòng vào Cài đặt để bật lại thủ công.",
              [
                { text: "Hủy", style: "cancel" },
                { text: "Mở Cài đặt", onPress: () => Linking.openSettings() }
              ]
            );
          }
          return false; // Chưa đủ quyền
        }
        return true; // Đủ quyền
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      // Logic cho iOS (Dùng hàm static của Vision Camera)
      const camStatus = await Camera.requestCameraPermission();
      const micStatus = await Camera.requestMicrophonePermission();

      const isGranted = camStatus === 'granted' && micStatus === 'granted';
      setHasCamPermission(camStatus === 'granted');
      setHasMicPermission(micStatus === 'granted');

      if (!isGranted && isInteractive && (camStatus === 'denied' || micStatus === 'denied')) {
        Linking.openSettings(); // iOS chỉ có 1 lần hỏi, lần sau phải vào setting
      }
      return isGranted;
    }
  };

  // Xin quyền
  useEffect(() => {
    requestFullPermissions(false); // False: không hiện Alert Setting nếu bị chặn ngay lúc đầu
  }, []);

  // Reset animation khi đổi duration
  useEffect(() => {
    progressAnim.setValue(0);
  }, [duration]);

  useEffect(() => {
    if (step === 'camera') {
      progressAnim.setValue(0);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [step]);

  // --- LOGIC QUAY VIDEO (ĐÃ SỬA LẠI) ---

  // 1. Hàm dừng quay (Dùng chung cho cả Hết giờ và Bấm tay)
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecordingRef.current) return;

    try {
      console.log("Stopping recording...");
      isRecordingRef.current = false; // Đánh dấu dừng ngay lập tức
      // Dừng animation
      stopAnimation();
      // Gọi lệnh dừng native
      await cameraRef.current.stopRecording();
      // Lưu ý: setIsRecording(false) và chuyển trang sẽ nằm ở sự kiện onRecordingFinished
    } catch (e) {
      console.error("Stop error", e);
      setIsRecording(false);
    }
  };

  // 2. Hàm bắt đầu quay
  const startRecording = async () => {
    if (!cameraRef.current || isRecordingRef.current) return;

    try {
      console.log("Starting recording...");
      isRecordingRef.current = true;
      setIsRecording(true);

      // Chạy animation đếm giờ
      startAnimation();

      cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          console.log('Video finished:', video);
          // Khi file video đã tạo xong -> Chuyển trang
          setPreviewUrl(video.path);
          setStep('details');

          // Reset trạng thái về ban đầu
          setIsRecording(false);
          isRecordingRef.current = false;
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          isRecordingRef.current = false;
          if ((error as any).code !== 'session/stopped-unexpectedly') {
            Alert.alert('Lỗi', 'Không thể lưu video');
          }
        }
      });
    } catch (e) {
      console.error(e);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // 3. Hàm Toggle chính
  const toggleRecording = async () => {
    // Kiểm tra quyền trước khi quay
    if (!hasCamPermission || !hasMicPermission) {
      // Nếu chưa có quyền, gọi hàm xin quyền (Mode Interactive = true)
      const granted = await requestFullPermissions(true);
      if (!granted) return; // Nếu vẫn không được thì dừng
      // Nếu được cấp quyền, người dùng cần bấm lại lần nữa để quay (UX an toàn)
      return;
    }

    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 4. Animation Timer
  const startAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Nếu animation chạy xong (hết giờ) VÀ vẫn đang trạng thái quay
      if (finished && isRecordingRef.current) {
        console.log("Timer finished, auto-stopping...");
        stopRecording(); // Tự động gọi hàm dừng
      }
    });
  };

  const stopAnimation = () => {
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // --- CÁC LOGIC KHÁC ---
  const handlePickFromGallery = async () => {
    setIsLoading(true);
    const result = await videoService.pickVideoFromGallery();
    setIsLoading(false);
    if (result) {
      if (result.duration > 60) Alert.alert('Video too long', 'Limit is 60s');
      else {
        setPreviewUrl(result.uri);
        setStep('details');
      }
    }
  };

  const handleAiCaption = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const aiCaption = await generateCaption("short video content");
      setCaption(aiCaption);
    } catch (error) { Alert.alert('Error', 'Failed to generate caption'); }
    setIsGenerating(false);
  };

  const handleSubmit = async () => {
    if (!previewUrl) return;
    setIsLoading(true);
    try {
      const cloudinaryUrl = await videoService.uploadVideoToCloudinary(previewUrl);
      if (!cloudinaryUrl) throw new Error('Upload failed');
      const { videoUrl, thumbUrl } = cloudinaryUrl;
      const videoMetadata = {
        ownerUid: currentUser?.uid || 'anonymous',
        ownerName: currentUser?.username || 'Anonymous',
        ownerAvatar: currentUser?.avatarUrl || 'default',
        videoUrl: videoUrl,
        thumbUrl: thumbUrl,
        caption: caption,
        createdAt: new Date().toISOString()
      };
      const result = await videoService.saveVideoMetadata(videoMetadata as any);
      if (result.success) {
        onPost(result.video);
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = hasCamPermission && hasMicPermission;
  // if (!hasPermission) return <View style={styles.permissionContainer}><Text style={{color:'#fff'}}>Requesting Permissions...</Text></View>;

  // --- RENDER ---
  if (step === 'camera') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {device && (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            video={true}
            audio={true}
          />
        )}

        <SafeAreaView style={styles.overlayContainer}>
          {/* HEADER: Ẩn nút X khi quay */}
          <View style={styles.headerRow}>
            {!isRecording ? (
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <X size={28} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} /> // Spacer để giữ vị trí
            )}

            <TouchableOpacity style={styles.soundButton}>
              <Music size={14} color="#fff" />
              <Text style={styles.soundText}>Sounds</Text>
            </TouchableOpacity>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.bodyContainer}>
            {/* SIDEBAR: Ẩn hoàn toàn khi quay */}
            {!isRecording && (
              <View style={styles.rightSidebar}>
                <TouchableOpacity style={styles.sidebarItem} onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}>
                  <RotateCcw size={24} color="#fff" />
                  <Text style={styles.sidebarText}>Flip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarItem}><Zap size={24} color="#fff" /><Text style={styles.sidebarText}>Speed</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sidebarItem}><Wand2 size={24} color="#fff" /><Text style={styles.sidebarText}>Beauty</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sidebarItem}><Timer size={24} color="#fff" /><Text style={styles.sidebarText}>Timer</Text></TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footerContainer}>
            {/* DURATION: Ẩn khi quay */}
            {!isRecording ? (
              <View style={styles.durationRow}>
                <TouchableOpacity onPress={() => setDuration(60)}>
                  <Text style={[styles.durationText, duration === 60 ? styles.durationActive : null]}>60s</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDuration(15)}>
                  <Text style={[styles.durationText, duration === 15 ? styles.durationActive : null]}>15s</Text>
                </TouchableOpacity>
                {duration === 60 && <View style={[styles.activeDot, { left: 0 }]} />}
                {duration === 15 && <View style={[styles.activeDot, { right: 0 }]} />}
              </View>
            ) : (
              <View style={{ height: 30, marginBottom: 20 }} /> // Spacer
            )}

            {/* RECORD ROW */}
            <View style={styles.recordRow}>
              {/* Nút Effects (Trái): Ẩn khi quay */}
              <View style={{ width: 60, alignItems: 'center' }}>
                {!isRecording && (
                  <TouchableOpacity style={styles.effectButton}>
                    <View style={styles.effectIconPlaceholder}><Wand2 size={20} color="#000" /></View>
                    <Text style={styles.bottomLabel}>Effects</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* NÚT QUAY (Giữa) */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={toggleRecording}
                style={styles.recordButtonWrapper}
              >
                <Svg height={circleSize} width={circleSize} style={styles.svgContainer}>
                  <Circle cx={circleSize / 2} cy={circleSize / 2} r={radius} stroke="rgba(255,255,255,0.3)" strokeWidth={strokeWidth} fill="transparent" />
                  <AnimatedCircle
                    cx={circleSize / 2} cy={circleSize / 2} r={radius}
                    stroke="#EE1D52" strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round" rotation="-90" origin={`${circleSize / 2}, ${circleSize / 2}`}
                  />
                </Svg>
                <View style={[styles.innerRecordBtn, isRecording && styles.innerRecordBtnRecording]} />
              </TouchableOpacity>

              {/* Nút Upload (Phải): Ẩn khi quay */}
              <View style={{ width: 60, alignItems: 'center' }}>
                {!isRecording && (
                  <TouchableOpacity style={styles.uploadButton} onPress={handlePickFromGallery}>
                    <View style={styles.uploadIconPlaceholder}><ImageIcon size={20} color="#fff" /></View>
                    <Text style={styles.bottomLabel}>Upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- DETAILS SCREEN (Không thay đổi) ---
  return (
    <View style={styles.detailsContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaView style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => setStep('camera')} style={styles.iconButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.mediaPreviewRow}>
          <TextInput style={styles.captionInput} placeholder="Describe your video..." multiline value={caption} onChangeText={setCaption} />
          {previewUrl && (
            <View style={styles.smallPreview}>
              <Video source={{ uri: previewUrl }} style={{ flex: 1 }} resizeMode="cover" paused={true} />
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleAiCaption} style={styles.aiButton}>
          <Wand2 size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '600' }}>AI Caption</Text>
        </TouchableOpacity>
        <View style={styles.settingItem}><Text>Who can watch this video</Text><Text style={{ color: '#666' }}>Everyone</Text></View>
      </ScrollView>
      <View style={styles.detailsFooter}>
        <TouchableOpacity style={styles.draftBtn} onPress={onClose}><Text style={{ fontWeight: 'bold' }}>Drafts</Text></TouchableOpacity>
        <TouchableOpacity style={styles.postBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Post</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Camera & Overlay Styles
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  iconButton: {
    padding: 8,
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  soundText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },

  // Body & Sidebar
  bodyContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end', // Đẩy sidebar sang phải
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  rightSidebar: {
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'transparent',
  },
  sidebarItem: {
    alignItems: 'center',
    gap: 4
  },
  sidebarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },

  // Footer Controls
  footerContainer: {
    paddingBottom: 20,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
    position: 'relative',
    height: 30
  },
  durationText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  durationActive: {
    color: '#fff',
    fontWeight: '700'
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    alignSelf: 'center'
  },

  // Record Area
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Căn đáy để thẳng hàng
    paddingHorizontal: 30,
    marginBottom: 10
  },
  effectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 60,
    paddingBottom: 15 // Căn chỉnh với nút record to hơn
  },
  effectIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff', // Màu da effects
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 60,
    paddingBottom: 15
  },
  uploadIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff'
  },
  bottomLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },

  // Record Button Animation Style
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  svgContainer: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }] // Xoay để bắt đầu từ đỉnh 12h
  },
  innerRecordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EE1D52',
    borderWidth: 4,
    borderColor: 'transparent', // viền trắng sẽ được SVG vẽ
  },
  innerRecordBtnRecording: {
    width: 30,
    height: 30,
    borderRadius: 6, // Biến thành hình vuông khi quay
    transform: [{ scale: 0.8 }]
  },

  // Details Screen Styles
  detailsContainer: { flex: 1, backgroundColor: '#fff' },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  mediaPreviewRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  captionInput: { flex: 1, fontSize: 15 },
  smallPreview: { width: 80, height: 110, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden' },
  aiButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EE1D52', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginBottom: 20
  },
  settingItem: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  detailsFooter: {
    flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#eee'
  },
  draftBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#eee', borderRadius: 4 },
  postBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#EE1D52', borderRadius: 4 },
});

export default UploadView;