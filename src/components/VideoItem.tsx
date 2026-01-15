import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Image,
  TouchableOpacity, Animated, Easing, Platform,
  ScrollView, TextInput, KeyboardAvoidingView, Pressable, Alert, Keyboard, KeyboardEvent, ActivityIndicator
} from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Bookmark, Plus, Music, Share2, X, Send, Play, Flag } from 'lucide-react-native';
import { Video as VideoType, User, ReportReason } from '../types/type';
import * as videoService from '../services/videoService';
import * as reportService from '../services/reportService';
import * as userService from '../services/userService';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface VideoItemProps {
  video: VideoType;
  isActive: boolean;
  shouldLoad: boolean;
  onViewProfile?: (user: User) => void;
  itemHeight: number;
  currentUserId?: string; // New prop
}

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive, shouldLoad, onViewProfile, itemHeight, currentUserId }) => {
  // 1. QUẢN LÝ VÒNG ĐỜI (CHỐNG VĂNG KHI CHUYỂN TRANG NHANH)
  const isMounted = useRef(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const reportScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // Local pause state
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [isSaved, setIsSaved] = useState(video.isSaved || false);
  const [likeCount, setLikeCount] = useState(video.likesCount);
  const [saveCount, setSaveCount] = useState(video.savesCount || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentUserInfo, setCurrentUserInfo] = useState({ uid: '', username: '', avatarUrl: '' });

  // Fetch current user info on component mount
  useEffect(() => {
    const fetchCurrentUserInfo = async () => {
      if (currentUserId) {
        try {
          const userInfo = await userService.getUserById(currentUserId);
          if (userInfo) {
            setCurrentUserInfo({
              uid: userInfo.uid,
              username: userInfo.displayName || userInfo.username || 'Anonymous',
              avatarUrl: userInfo.avatarUrl || ''
            });
          }
        } catch (error) {
          console.error('Error fetching current user info:', error);
        }
      }
    };

    fetchCurrentUserInfo();
  }, [currentUserId]);

  // Fetch comments when modal opens
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const fetchedComments = await videoService.getVideoComments(video.id, currentUserId);
      setComments(fetchedComments);
      console.log('Fetched comments:', fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // 2. LOGIC ĐĨA NHẠC XOAY
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [isActive]);

  // RESET PAUSE STATE WHEN SCROLLED
  useEffect(() => {
    if (isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  // HANDLE KEYBOARD EVENTS FOR REPORT MODAL
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      rotateAnim.stopAnimation();
    } else {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
    }
  };

  const handleLike = async () => {
    if (!currentUserId) return;
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1); // Optimistic update

    await videoService.toggleLikeVideo(video.id, currentUserId, !newStatus);
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    const newStatus = !isSaved;
    setIsSaved(newStatus);
    setSaveCount(prev => newStatus ? prev + 1 : prev - 1);

    await videoService.toggleSaveVideo(video.id, currentUserId, isSaved);
  };

  const handleAddComment = async (text: string) => {
    if (!currentUserId || !text.trim()) return;
    
    const result = await videoService.addComment(
      video.id,
      currentUserId,
      currentUserInfo.avatarUrl,
      currentUserInfo.username,
      text
    );

    if (result.success && result.comment) {
      setComments([result.comment, ...comments]);
      console.log('Comment added:', result.comment);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!currentUserId) return;

    // Optimistic update
    setComments(comments.map(c =>
      c.id === commentId
        ? {
            ...c,
            likesCount: (c.likesCount || 0) + (isLiked ? -1 : 1),
            isLiked: !isLiked
          }
        : c
    ));

    const result = await videoService.toggleLikeComment(
      video.id,
      commentId,
      currentUserId,
      isLiked
    );

    if (!result.success) {
      // Revert on error
      fetchComments();
    }
  };

  const handleReportSubmit = async () => {
    if (!currentUserId || !selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    const result = await reportService.submitVideoReport(
      video.id,
      currentUserId,
      video.ownerName, // Using current user's name
      selectedReason,
      reportDetails
    );

    if (result.success) {
      Alert.alert('Success', 'Report submitted successfully. Thank you for helping keep our community safe.');
      setShowReportModal(false);
      setSelectedReason(null);
      setReportDetails('');
    } else {
      Alert.alert('Error', result.error || 'Failed to submit report');
    }
  };

  const reportReasons = [
    { value: ReportReason.SPAM, label: 'Spam or misleading' },
    { value: ReportReason.INAPPROPRIATE, label: 'Inappropriate content' },
    { value: ReportReason.HARASSMENT, label: 'Harassment or bullying' },
    { value: ReportReason.VIOLENCE, label: 'Violence or dangerous content' },
    { value: ReportReason.FALSE_INFO, label: 'False information' },
    { value: ReportReason.OTHER, label: 'Other' },
  ];

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 3. FIX LỖI CHIA CHO 0 & CẬP NHẬT TIẾN TRÌNH
  const handleProgress = (data: any) => {
    if (isMounted.current && data?.seekableDuration > 0) {
      const calculation = data.currentTime / data.seekableDuration;
      if (isFinite(calculation)) {
        setProgress(calculation);
      }
    }
  };

  // Tạo link ảnh poster từ link Cloudinary
  const posterUrl = video.videoUrl?.replace(".mp4", ".jpg");

  return (
    <View style={[styles.container, { height: itemHeight }]}>

      {/* 4. CHỐNG VĂNG APP & DÍNH TIẾNG (RENDER ĐIỀU KIỆN) */}
      {shouldLoad ? (
        <Video
          source={{ uri: video.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat={true}
          paused={!isActive || isPaused}
          playInBackground={false}
          playWhenInactive={false}
          onProgress={handleProgress}

          progressUpdateInterval={1000}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 30000,
            bufferForPlaybackMs: 1000,
            bufferForPlaybackAfterRebufferMs: 2000
          }}
          ignoreSilentSwitch={"ignore"}
          poster={posterUrl}
          posterResizeMode="cover"
          onLoadStart={() => console.log('Video load start')}
        />
      ) : (
        <Image
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* OVERLAY TƯƠNG TÁC (Sidebar và Info) */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* LỚP TAP BACKGROUND */}
        <Pressable onPress={togglePause} style={StyleSheet.absoluteFill}>
          {isPaused && (
            <View style={styles.playIconContainer}>
              <Play size={60} color="rgba(255, 255, 255, 0.6)" fill="rgba(255, 255, 255, 0.6)" />
            </View>
          )}
        </Pressable>

        {/* SIDEBAR NÚT BẤM (Phải) */}
        <View style={styles.rightActions} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => onViewProfile && onViewProfile({
              uid: video.ownerUid, username: video.ownerName, avatarUrl: video.ownerAvatar
            } as User)}
          >
            <Image source={{ uri: video.ownerAvatar }} style={styles.avatar} />
            <Pressable
              onPress={(e) => { e.stopPropagation(); setIsFollowing(!isFollowing); }}
              style={[styles.plusIcon, isFollowing && { backgroundColor: '#fff' }]}
            >
              <Plus size={12} color={isFollowing ? "#fe2c55" : "#fff"} strokeWidth={4} />
            </Pressable>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={handleLike}>
            <Heart size={35} color={isLiked ? "#fe2c55" : "#fff"} fill={isLiked ? "#fe2c55" : "none"} />
            <Text style={styles.actionText}>
              {likeCount.toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setShowComments(true)}>
            <MessageCircle size={35} color="#fff" />
            <Text style={styles.actionText}>{video.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={handleSave}>
            <Bookmark size={35} color={isSaved ? "#facd00" : "#fff"} fill={isSaved ? "#facd00" : "none"} />
            <Text style={styles.actionText}>
              {saveCount.toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action}>
            <Share2 size={35} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setShowReportModal(true)}>
            <Flag size={35} color="#fff" />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.discContainer, { transform: [{ rotate: spin }] }]}>
            <Image source={{ uri: video.ownerAvatar }} style={styles.discImg} />
          </Animated.View>
        </View>

        {/* THÔNG TIN VIDEO (Trái - Dưới) */}
        <View style={styles.bottomInfo} pointerEvents="box-none">
          <Text style={styles.username}>@{video.ownerName}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {video.caption} <Text style={styles.hashtag}>#tictoc #vietnam</Text>
          </Text>
          <View style={styles.musicRow}>
            <Music size={14} color="#fff" />
            <Text style={styles.musicText}>{video.ownerName}</Text>
          </View>
        </View>

        {/* THANH TIẾN TRÌNH (Sát đáy) */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* REPORT MODAL */}
      {showReportModal && (
        <View style={styles.reportModal}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Report Video</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={reportScrollViewRef}
            style={styles.reportContent}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 }}
          >
            <Text style={styles.reportSubtitle}>Why are you reporting this video?</Text>

            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reportReasonItem,
                  selectedReason === reason.value && styles.reportReasonSelected
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View style={[
                  styles.radioButton,
                  selectedReason === reason.value && styles.radioButtonSelected
                ]}>
                  {selectedReason === reason.value && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.reportReasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}

            {selectedReason === ReportReason.OTHER && (
              <View style={styles.reportDetailsContainer}>
                <Text style={styles.reportDetailsLabel}>Please provide more details:</Text>
                <TextInput
                  style={styles.reportDetailsInput}
                  placeholder="Describe the issue..."
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => {
                    setTimeout(() => {
                      reportScrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.reportActions}>
            <TouchableOpacity
              style={styles.reportCancelButton}
              onPress={() => {
                setShowReportModal(false);
                setSelectedReason(null);
                setReportDetails('');
              }}
            >
              <Text style={styles.reportCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reportSubmitButton,
                !selectedReason && styles.reportSubmitButtonDisabled
              ]}
              onPress={handleReportSubmit}
              disabled={!selectedReason}
            >
              <Text style={styles.reportSubmitText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL COMMENT */}
      {showComments && (
        <View style={styles.commentModal}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>{comments.length} comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.commentList}>
            {loadingComments ? (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <ActivityIndicator size="large" color="#fe2c55" />
              </View>
            ) : comments.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Text style={{ color: '#888' }}>No comments yet</Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  {c.avatarUrl ? (
                    <Image
                      source={{ uri: c.avatarUrl }}
                      style={styles.commentAvatar}
                    />
                  ) : (
                    <View style={[styles.commentAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' }]}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#666' }}>
                        {c.username?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{c.username}</Text>
                    <Text style={styles.commentContent}>{c.text}</Text>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentTime}>
                        {new Date(c.timestamp).toLocaleDateString()}
                      </Text>
                      <Text style={styles.commentReply}>Reply</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{ alignItems: 'center' }}
                    onPress={() => handleLikeComment(c.id, c.isLiked || false)}
                  >
                    <Heart
                      size={16}
                      color={c.isLiked ? '#fe2c55' : '#ccc'}
                      fill={c.isLiked ? '#fe2c55' : 'none'}
                    />
                    <Text style={{ fontSize: 10, color: '#888' }}>
                      {c.likesCount || 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={() => {
                if (commentText.trim() && currentUserInfo) {
                  handleAddComment(commentText);
                  setCommentText('');
                }
              }}>
                <Send size={24} color="#fe2c55" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
};

// Sử dụng memo để tránh render lại không cần thiết
export default memo(VideoItem);

const styles = StyleSheet.create({
  container: { width: WINDOW_WIDTH, backgroundColor: '#000', position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', paddingBottom: 20 }, // Tránh bottom nav

  playIconContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Sidebar
  rightActions: { position: 'absolute', right: 8, bottom: 30, alignItems: 'center', gap: 10 },
  action: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 4 },

  avatarContainer: { marginBottom: 15, position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#fff' },
  plusIcon: { position: 'absolute', bottom: -5, left: 16, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fe2c55', alignItems: 'center', justifyContent: 'center' },

  discContainer: { marginTop: 20 },
  discImg: { width: 48, height: 48, borderRadius: 24, borderWidth: 8, borderColor: '#222' },

  // Bottom Info
  bottomInfo: { position: 'absolute', bottom: 20, left: 16, right: 80, paddingBottom: 10 },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  description: { color: '#fff', fontSize: 14, marginBottom: 8 },
  hashtag: { fontWeight: 'bold' },
  musicRow: { flexDirection: 'row', alignItems: 'center' },
  musicText: { color: '#fff', marginLeft: 8 },

  // Progress Bar
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBar: { height: '100%', backgroundColor: '#fff' },

  // Comments
  commentModal: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, zIndex: 100 },
  commentHeader: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderColor: '#eee' },
  commentTitle: { fontWeight: 'bold', fontSize: 14 },
  commentList: { flex: 1 },
  commentItem: { flexDirection: 'row', padding: 12, gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ddd' },
  commentUser: { fontWeight: 'bold', fontSize: 12, color: '#555' },
  commentContent: { fontSize: 13, marginTop: 2 },
  commentMeta: { flexDirection: 'row', gap: 15, marginTop: 4 },
  commentTime: { fontSize: 11, color: '#999' },
  commentReply: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 0.5, borderColor: '#eee', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 36, backgroundColor: '#f0f0f0', borderRadius: 18, paddingHorizontal: 12 },

  // Report Modal
  reportModal: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '75%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 100 },
  reportHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  reportTitle: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  reportContent: { maxHeight: '100%', padding: 16 },
  reportSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#333' },
  reportReasonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8, borderRadius: 8, backgroundColor: '#f8f8f8' },
  reportReasonSelected: { backgroundColor: '#ffe5e5', borderWidth: 1, borderColor: '#fe2c55' },
  radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioButtonSelected: { borderColor: '#fe2c55' },
  radioButtonInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fe2c55' },
  reportReasonText: { fontSize: 15, color: '#333', flex: 1 },
  reportDetailsContainer: { marginTop: 20 },
  reportDetailsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  reportDetailsInput: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: '#e0e0e0' },
  reportActions: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderColor: '#eee' },
  reportCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  reportCancelText: { fontSize: 16, fontWeight: '600', color: '#666' },
  reportSubmitButton: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#fe2c55', alignItems: 'center' },
  reportSubmitButtonDisabled: { backgroundColor: '#ccc' },
  reportSubmitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});