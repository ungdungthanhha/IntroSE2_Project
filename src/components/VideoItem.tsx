import React, { useState, useRef, useEffect, memo } from 'react'; // Thêm memo để tối ưu
import {
  View, Text, StyleSheet, Dimensions, Image,
  TouchableOpacity, Animated, Easing, Platform,
  ScrollView, TextInput, KeyboardAvoidingView, Pressable, ActivityIndicator, Modal, Share
} from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Bookmark, Plus, Music, Share2, X, Send, Play } from 'lucide-react-native';
import { Video as VideoType, User, Comment } from '../types/type';
import * as videoService from '../services/videoService';
import { firebaseAuth } from '../config/firebase';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface VideoItemProps {
  video: VideoType;
  isActive: boolean;
  shouldLoad: boolean; // Add prop
  onViewProfile?: (user: User) => void;
  itemHeight: number;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive, shouldLoad, onViewProfile, itemHeight }) => {
  // 1. QUẢN LÝ VÒNG ĐỜI (CHỐNG VĂNG KHI CHUYỂN TRANG NHANH)
  const isMounted = useRef(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // Local pause state
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [isSaved, setIsSaved] = useState(video.isSaved || false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(video.commentsCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Đồng bộ lại trạng thái khi video prop thay đổi (khi lướt feed)
  useEffect(() => {
    setLikesCount(video.likesCount || 0);
    setIsLiked(video.isLiked || false);
    setCommentsCount(video.commentsCount || 0);
  }, [video]);

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

  const togglePause = () => {
    setIsPaused(!isPaused);
    // Animation control for disc if needed, but handled by isActive primarily.
    // If we want the disc to stop spinning when paused manually:
    if (!isPaused) { // Going to pause
      rotateAnim.stopAnimation();
    } else { // Resuming
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
    }
  };

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

  // Kiểm tra trạng thái like từ Firestore để tránh cộng trùng
  useEffect(() => {
    let active = true;
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || !shouldLoad) return;

    videoService.isVideoLikedByUser(video.id, uid).then((liked) => {
      if (active) {
        setIsLiked(liked);
      }
    });

    return () => { active = false; };
  }, [video.id, shouldLoad]);

  const handleToggleLike = async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      return;
    }

    const prevLiked = isLiked;
    const delta = prevLiked ? -1 : 1;

    // Optimistic update: UI trước, rollback nếu lỗi
    setIsLiked(!prevLiked);
    setLikesCount((prev) => Math.max(0, prev + delta));

    const res = await videoService.toggleLikeVideo(video.id, uid, prevLiked);
    if (!res.success) {
      setIsLiked(prevLiked);
      setLikesCount((prev) => Math.max(0, prev - delta));
    }
  };

  // Load comments khi mở bảng bình luận
  const handleOpenComments = async () => {
    setShowComments(true);
    if (comments.length === 0) {
      setLoadingComments(true);
      const fetchedComments = await videoService.getComments(video.id);
      setComments(fetchedComments);
      setLoadingComments(false);
    }
  };

  // Thêm bình luận mới
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    const user = firebaseAuth.currentUser;
    const username = user?.displayName || 'Anonymous';
    const avatarUrl = user?.photoURL || 'https://picsum.photos/200';

    // Optimistic update
    const tempComment: Comment = {
      id: Date.now().toString(),
      videoId: video.id,
      userUid: uid,
      username,
      avatarUrl,
      text: commentText.trim(),
      timestamp: Date.now()
    };

    setComments([tempComment, ...comments]);
    setCommentsCount((prev) => prev + 1);
    setCommentText('');

    // Lưu vào Firestore
    const result = await videoService.addComment(
      video.id,
      uid,
      avatarUrl,
      username,
      commentText.trim()
    );

    if (result.success && result.comment) {
      // Cập nhật comment với ID thật từ Firestore
      setComments((prev) => 
        prev.map((c) => (c.id === tempComment.id ? result.comment! : c))
      );
    } else {
      // Rollback nếu thất bại
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Tạo link ảnh poster từ link Cloudinary
  const posterUrl = video.videoUrl?.replace(".mp4", ".jpg");
  const shareLink = video.videoUrl || `https://tictoc.app/video/${video.id}`;
  const shareOptions = [
    'Messenger',
    'WhatsApp',
    'Facebook',
    'Telegram',
    'More'
  ];

  const handleShare = async (platform?: string) => {
    const prefix = platform ? `${platform}: ` : '';
    try {
      await Share.share({
        message: `${prefix}${shareLink}`,
        url: shareLink,
        title: 'Share video'
      });
    } catch (error) {
      // swallow share errors
    }
  };
  // ...

  return (
    <View style={[styles.container, { height: itemHeight }]}>

      {/* 4. CHỐNG VĂNG APP & DÍNH TIẾNG (RENDER ĐIỀU KIỆN) */}
      {/* Mount video if active OR in preload window */}
      {shouldLoad ? (
        <Video
          source={{ uri: video.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover" // Tràn viền dọc khít màn hình
          repeat={true}
          paused={!isActive || isPaused}
          playInBackground={false}
          playWhenInactive={false}
          onProgress={handleProgress}

          // Giảm tải cho máy thật Android
          progressUpdateInterval={1000}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 30000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000
          }}
          ignoreSilentSwitch={"ignore"}
          poster={posterUrl}
        />
      ) : (
        /* Hiện ảnh Poster khi không Active để giải phóng RAM */
        <Image
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* OVERLAY TƯƠNG TÁC (Sidebar và Info) */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* LỚP TAP BACKGROUND (Nằm dưới các nút, trên video) */}
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

          <TouchableOpacity
            style={styles.action}
            onPress={handleToggleLike}
          >
            <Heart size={35} color={isLiked ? "#fe2c55" : "#fff"} fill={isLiked ? "#fe2c55" : "none"} />
            <Text style={styles.actionText}>
              {likesCount.toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={handleOpenComments}>
            <MessageCircle size={35} color="#fff" />
            <Text style={styles.actionText}>{commentsCount.toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setIsSaved(!isSaved)}>
            <Bookmark size={35} color={isSaved ? "#facd00" : "#fff"} fill={isSaved ? "#facd00" : "none"} />
            <Text style={styles.actionText}>
              {(video.savesCount + (isSaved ? 1 : 0)).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setShowShare(true)}>
            <Share2 size={35} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.musicDisc, { transform: [{ rotate: spin }] }]}>
            <Image source={{ uri: video.ownerAvatar }} style={styles.discImage} />
          </Animated.View>
        </View>

        {/* THÔNG TIN CAPTION (Trái dưới) */}
        <View style={styles.bottomInfo} pointerEvents="none">
          <Text style={styles.username}>@{video.ownerName}</Text>
          <Text style={styles.caption} numberOfLines={2}>{video.caption}</Text>
          <View style={styles.audioRow}>
            <Music size={14} color="#fff" />
            <Text style={styles.audioText} numberOfLines={1}>original sound - {video.ownerName}</Text>
          </View>
        </View>

        {/* PROGRESS BAR SIÊU MỎNG (Sát đáy) */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* BẢNG BÌNH LUẬN (BOTTOM SHEET) */}
      {showComments && (
        <View style={styles.commentSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>{commentsCount} comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <X size={20} color="#000" />
            </TouchableOpacity>
          </View>
          {loadingComments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fe2c55" />
            </View>
          ) : (
            <ScrollView style={styles.commentList} showsVerticalScrollIndicator={false}>
              {comments.map(c => (
                <View key={c.id} style={styles.commentItem}>
                  <Image source={{ uri: c.avatarUrl }} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>{c.username}</Text>
                    <Text style={styles.commentMsg}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputBar}>
              <TextInput 
                style={styles.commentInput} 
                placeholder="Add comment..." 
                placeholderTextColor="#999" 
                value={commentText} 
                onChangeText={setCommentText}
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity onPress={handleAddComment}>
                <Send size={20} color={commentText ? "#fe2c55" : "#ccc"} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* SHARE SHEET */}
      <Modal visible={showShare} transparent animationType="fade" onRequestClose={() => setShowShare(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowShare(false)}>
          <View style={styles.shareSheet}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share video</Text>
              <TouchableOpacity onPress={() => setShowShare(false)}>
                <X size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.shareLinkBox}>
              <Text style={styles.shareLabel}>Video link</Text>
              <View style={styles.shareLinkRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.shareLinkText}>{shareLink}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.shareCopyBtn} onPress={() => handleShare('Copy link')}>
                  <Text style={styles.shareCopyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.shareTargets}>
              <Text style={styles.shareLabel}>Share with</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shareButtonsRow}>
                {shareOptions.map((opt) => (
                  <TouchableOpacity key={opt} style={styles.shareTargetBtn} onPress={() => handleShare(opt)}>
                    <Text style={styles.shareTargetText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: WINDOW_WIDTH, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  rightActions: { position: 'absolute', right: 8, bottom: 20, alignItems: 'center', zIndex: 50 },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#fff' },
  plusIcon: { position: 'absolute', bottom: -8, alignSelf: 'center', backgroundColor: '#fe2c55', borderRadius: 10, padding: 2 },
  action: { alignItems: 'center', marginTop: 18 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 4 },
  bottomInfo: { position: 'absolute', bottom: 35, left: 12, paddingRight: 100 },
  username: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 5 },
  caption: { color: '#fff', fontSize: 14, marginBottom: 8, lineHeight: 18 },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  audioText: { color: '#fff', fontSize: 13, marginLeft: 6, width: WINDOW_WIDTH * 0.5 },
  musicDisc: { marginTop: 20, width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 8, borderColor: '#111' },
  discImage: { width: 22, height: 22, borderRadius: 11 },
  progressBarContainer: { position: 'absolute', bottom: 0, width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 20 },
  progressBar: { height: '100%', backgroundColor: '#fff' },
  commentSheet: { position: 'absolute', bottom: 0, width: '100%', height: '70%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 100 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  commentTitle: { fontWeight: '700', fontSize: 13, textAlign: 'center', flex: 1, color: '#000' },
  commentList: { flex: 1, padding: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  commentContent: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 12, color: '#888', marginBottom: 4 },
  commentMsg: { fontSize: 14, color: '#111' },
  commentInputBar: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 0.5, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  commentInput: { flex: 1, backgroundColor: '#f1f1f2', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, color: '#000' },
  playIconContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  shareSheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shareTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  shareLinkBox: { marginBottom: 12 },
  shareLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  shareLinkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f4f5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  shareLinkText: { color: '#111', fontSize: 13, paddingRight: 10 },
  shareCopyBtn: { backgroundColor: '#fe2c55', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  shareCopyText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  shareTargets: { marginTop: 8 },
  shareButtonsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  shareTargetBtn: { backgroundColor: '#f4f4f5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginRight: 8 },
  shareTargetText: { color: '#000', fontWeight: '700', fontSize: 13 }
});

// QUAN TRỌNG: Sử dụng memo để không re-render nhầm
export default React.memo(VideoItem);