import React, { useState, useRef, useEffect, memo } from 'react'; // Thêm memo để tối ưu
import { 
  View, Text, StyleSheet, Dimensions, Image, 
  TouchableOpacity, Animated, Easing, Platform,
  ScrollView, TextInput, KeyboardAvoidingView, Pressable 
} from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Bookmark, Plus, Music, Share2, X, Send } from 'lucide-react-native';
import { Video as VideoType, User } from '../types/type';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface VideoItemProps {
  video: VideoType;
  isActive: boolean;
  onViewProfile?: (user: User) => void;
  itemHeight: number; // Chiều cao chuẩn từ App.tsx
}

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive, onViewProfile, itemHeight }) => {
  // 1. QUẢN LÝ VÒNG ĐỜI (CHỐNG VĂNG KHI CHUYỂN TRANG NHANH)
  const isMounted = useRef(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [isSaved, setIsSaved] = useState(video.isSaved || false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: '1', user: 'alex_j', text: 'Phở ngon quá bạn ơi! 🔥', likes: 12 },
    { id: '2', user: 'chef_master', text: 'Landmark 81 view đỉnh thật.', likes: 5 },
  ]);

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
      {isActive ? (
        <Video
          source={{ uri: video.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover" // Tràn viền dọc khít màn hình
          repeat={true}
          paused={!isActive}
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
              style={[styles.plusIcon, isFollowing && {backgroundColor: '#fff'}]}
            >
               <Plus size={12} color={isFollowing ? "#fe2c55" : "#fff"} strokeWidth={4} />
            </Pressable>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setIsLiked(!isLiked)}>
            <Heart size={35} color={isLiked ? "#fe2c55" : "#fff"} fill={isLiked ? "#fe2c55" : "none"} />
            <Text style={styles.actionText}>
              {(video.likesCount + (isLiked ? 1 : 0)).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setShowComments(true)}>
            <MessageCircle size={35} color="#fff" />
            <Text style={styles.actionText}>{video.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setIsSaved(!isSaved)}>
            <Bookmark size={35} color={isSaved ? "#facd00" : "#fff"} fill={isSaved ? "#facd00" : "none"} />
            <Text style={styles.actionText}>
              {(video.savesCount + (isSaved ? 1 : 0)).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action}>
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
            <Text style={styles.commentTitle}>{comments.length} comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <X size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.commentList} showsVerticalScrollIndicator={false}>
            {comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
                <Image source={{ uri: `https://picsum.photos/seed/${c.user}/100/100` }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUser}>{c.user}</Text>
                  <Text style={styles.commentMsg}>{c.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputBar}>
              <TextInput style={styles.commentInput} placeholder="Add comment..." placeholderTextColor="#999" value={commentText} onChangeText={setCommentText} />
              <TouchableOpacity onPress={() => { if(commentText.trim()) { setComments([{id: Date.now().toString(), user: 'Me', text: commentText, likes: 0}, ...comments]); setCommentText(''); }}}>
                <Send size={20} color={commentText ? "#fe2c55" : "#ccc"} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
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
  commentInput: { flex: 1, backgroundColor: '#f1f1f2', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, color: '#000' }
});

// QUAN TRỌNG: Sử dụng memo để không re-render nhầm
export default React.memo(VideoItem);