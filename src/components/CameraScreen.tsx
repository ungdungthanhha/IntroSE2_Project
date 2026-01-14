import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated, Easing, Platform, PermissionsAndroid,
  Alert,
  Linking
} from 'react-native';
import {
  X, Wand2, Image as ImageIcon, RotateCcw, Zap, Timer, Music, Settings
} from 'lucide-react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Svg, { Circle } from 'react-native-svg';
import * as videoService from '../services/videoService'; // Import service của bạn

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CameraScreenProps {
  onClose: () => void;
  onVideoRecorded: (path: string) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onClose, onVideoRecorded }) => {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const cameraRef = useRef<Camera>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [hasCamPermission, setHasCamPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  const [duration, setDuration] = useState<15 | 60>(60);

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const circleSize = 80;
  const strokeWidth = 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const requestFullPermissions = async (isInteractive = false) => {

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

  // --- LOGIC QUYỀN (GIỮ NGUYÊN) ---
  useEffect(() => {
    requestFullPermissions(false); // False: không hiện Alert Setting nếu bị chặn ngay lúc đầu
  }, []);

  // --- LOGIC CHUYỂN CAMERA ---
  const handleFlipCamera = () => {
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
  };

  // --- ANIMATION TIMER ---
  const startTimer = () => {
    setVideoDuration(0);
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) stopRecording();
    });

    timerInterval.current = setInterval(() => {
      setVideoDuration(prev => {
        if (prev >= duration) return duration;
        return prev + 0.1;
      });
    }, 100);
  };

  const stopTimer = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
  };

  // --- LOGIC QUAY ---
  const handleRecordPress = async () => {
    if (!cameraRef.current) return;

    if (!isRecording) {
      // BẮT ĐẦU QUAY
      try {
        setIsRecording(true);
        startTimer();
        await cameraRef.current.startRecording({
          onRecordingFinished: (video) => {
            const path = Platform.OS === 'android' && !video.path.startsWith('file://')
              ? `file://${video.path}` : video.path;
            stopTimer();
            setIsRecording(false);
            // CHUYỂN NGAY SANG PREVIEW
            onVideoRecorded(path);
          },
          onRecordingError: (e) => {
            console.error(e);
            setIsRecording(false);
            stopTimer();
          }
        });
      } catch (e) {
        setIsRecording(false);
        stopTimer();
      }
    } else {
      // DỪNG QUAY -> Trigger onRecordingFinished ở trên
      await stopRecording();
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      await cameraRef.current.stopRecording();
    }
  };

  const handlePickGallery = async () => {
    const result = await videoService.pickVideoFromGallery();
    if (result) onVideoRecorded(result.uri);
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {device && (
        <Camera
          ref={cameraRef}
          key={cameraPosition} // Để reset camera khi đổi trước/sau
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />
      )}

      <SafeAreaView style={styles.overlayContainer}>
        {/* HEADER: Luôn hiện Sound */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <X size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.soundButton}>
            <Music size={14} color="#fff" />
            <Text style={styles.soundText}>Sounds</Text>
          </TouchableOpacity>
          <View style={{ width: 28 }} />
        </View>

        {/* SIDEBAR: Chỉ hiện khi KHÔNG quay */}
        <View style={styles.bodyContainer}>
          {!isRecording && (
            <View style={styles.rightSidebar}>
              <TouchableOpacity style={styles.sidebarItem} onPress={handleFlipCamera}>
                <RotateCcw size={24} color="#fff" />
                <Text style={styles.sidebarText}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem}><Zap size={24} color="#fff" /><Text style={styles.sidebarText}>Speed</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem}><Wand2 size={24} color="#fff" /><Text style={styles.sidebarText}>Beauty</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem}><Timer size={24} color="#fff" /><Text style={styles.sidebarText}>Timer</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footerContainer}>

          {/* Chọn thời gian (Chỉ hiện khi chưa quay) */}
          {!isRecording && (
            <View style={styles.durationRow}>
              <TouchableOpacity onPress={() => setDuration(60)}><Text style={[styles.durationText, duration === 60 && styles.durationActive]}>60s</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDuration(15)}><Text style={[styles.durationText, duration === 15 && styles.durationActive]}>15s</Text></TouchableOpacity>
            </View>
          )}

          <View style={styles.recordRow}>
            {/* LEFT: Effects (Ẩn khi đang quay) */}
            <View style={{ width: 60, alignItems: 'center' }}>
              {!isRecording && (
                <TouchableOpacity style={styles.effectButton}>
                  <View style={styles.effectIconPlaceholder}><Wand2 size={20} color="#000" /></View>
                  <Text style={styles.bottomLabel}>Effects</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* CENTER: Record Button */}
            <TouchableOpacity activeOpacity={1} onPress={handleRecordPress} style={styles.recordButtonWrapper}>
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

            {/* RIGHT: Upload (Ẩn khi đang quay) */}
            <View style={{ width: 60, alignItems: 'center' }}>
              {!isRecording && (
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickGallery}>
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
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlayContainer: { flex: 1, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  iconButton: { padding: 8 },
  soundButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  soundText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bodyContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 20 },
  rightSidebar: { alignItems: 'center', gap: 20 },
  sidebarItem: { alignItems: 'center', gap: 4 },
  sidebarText: { color: '#fff', fontSize: 10, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },
  footerContainer: { paddingBottom: 50 },
  durationRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20, height: 30 },
  durationText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  durationActive: { color: '#fff', fontWeight: '700' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 30, marginBottom: 10 },
  bottomLabel: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 4 },
  uploadButton: { alignItems: 'center', justifyContent: 'center', gap: 8, width: 60, paddingBottom: 15 },
  uploadIconPlaceholder: { width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  effectButton: { alignItems: 'center', justifyContent: 'center', gap: 8, width: 60, paddingBottom: 15 },
  effectIconPlaceholder: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  recordButtonWrapper: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  svgContainer: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  innerRecordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EE1D52', borderWidth: 4, borderColor: 'transparent' },
  innerRecordBtnRecording: { width: 30, height: 30, borderRadius: 6, transform: [{ scale: 0.8 }] },
});

export default CameraScreen;