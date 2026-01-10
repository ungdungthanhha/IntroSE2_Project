import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, Image, 
  TouchableOpacity, Animated, Easing, Platform,
  ScrollView, TextInput, KeyboardAvoidingView
} from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Bookmark, Plus, Music, Share2, X, Send } from 'lucide-react-native';
import { Video as VideoType, User } from '../types/type';

const { width, height: WINDOW_HEIGHT } = Dimensions.get('window');

// 1. TÍNH TOÁN CHIỀU CAO KHÍT MÀN HÌNH
const BOTTOM_NAV_HEIGHT = 60; // Chiều cao thanh Bottom Tab màu đen
const VIDEO_ITEM_HEIGHT = WINDOW_HEIGHT - BOTTOM_NAV_HEIGHT;

interface VideoItemProps {
  video: VideoType;
  isActive: boolean;
  onViewProfile?: (user: User) => void;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive, onViewProfile }) => {
  const [progress, setProgress] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [isSaved, setIsSaved] = useState(video.isSaved || false);
  const [isFollowing, setIsFollowing] = useState(false);

  // 2. LOGIC ĐĨA NHẠC XOAY
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
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

  const handleLike = () => setIsLiked(!isLiked); 
  const handleSave = () => setIsSaved(!isSaved);
  const handleFollow = (e: any) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
  };

  // --- 1. LOGIC BÌNH LUẬN (State & Mock Data) ---
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: '1', user: 'alex_j', text: 'Phở ngon quá bạn ơi! 🔥', likes: 12 },
    { id: '2', user: 'chef_master', text: 'Landmark 81 view đỉnh thật.', likes: 5 },
  ]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = { id: Date.now().toString(), user: 'Me', text: commentText, likes: 0 };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <View style={[styles.container, { height: VIDEO_ITEM_HEIGHT }]}>
      {/* 3. TRÌNH PHÁT VIDEO: contain để hỗ trợ video ngang */}
      <Video
        source={{ uri: video.videoUrl }}
        style={styles.video}
        resizeMode="contain" 
        repeat={true}
        paused={!isActive}
        onProgress={(e) => setProgress(e.currentTime / e.seekableDuration)}
        poster={video.videoUrl?.replace(".mp4", ".jpg")}
      />
      
      {/* 4. LỚP OVERLAY TƯƠNG TÁC: pointerEvents="box-none" giúp ấn được nút */}
      <View style={styles.overlay} pointerEvents="box-none">
        
        {/* SIDEBAR (Cụm nút bên phải) */}
        <View style={styles.rightActions} pointerEvents="box-none">
          {/* Nút Avatar & Follow */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => {
              if (onViewProfile) {
                const owner: User = {
                  uid: video.ownerUid,
                  username: video.ownerName,
                  birthday: '',
                  email: '',
                  avatarUrl: video.ownerAvatar,
                  bio: '',
                  followersCount: 0,
                  followingCount: 0
                };
                onViewProfile(owner);
              }
            }}
          >
            <Image source={{ uri: video.ownerAvatar }} style={styles.avatar} />
            <View style={styles.plusIcon}><Plus size={12} color="#fff" strokeWidth={4} /></View>
          </TouchableOpacity>

          {/* Like Logic: Thay đổi màu và số lượng */}
          <TouchableOpacity style={styles.action} onPress={handleLike}>
            <Heart size={32} color={isLiked ? "#fe2c55" : "#fff"} fill={isLiked ? "#fe2c55" : "none"} />
            <Text style={styles.actionText}>
              {(video.likesCount + (isLiked ? 1 : 0)).toLocaleString()}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity style={styles.action} onPress={() => setShowComments(true)}>
            <MessageCircle size={32} color="#fff" />
            <Text style={styles.actionText}>{video.commentsCount}</Text>
          </TouchableOpacity>

          {/* Save/Bookmark Logic */}
          <TouchableOpacity style={styles.action} onPress={handleSave}>
            <Bookmark size={32} color={isSaved ? "#facd00" : "#fff"} fill={isSaved ? "#facd00" : "none"} />
            <Text style={styles.actionText}>
              {(video.savesCount + (isSaved ? 1 : 0)).toLocaleString()}
            </Text>
          </TouchableOpacity>

          {/* Nút Share */}
          <TouchableOpacity style={styles.action}>
            <Share2 size={32} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          {/* 5. ĐĨA NHẠC QUAY */}
          <Animated.View style={[styles.musicDisc, { transform: [{ rotate: spin }] }]}>
            <Image source={{ uri: video.ownerAvatar }} style={styles.discImage} />
          </Animated.View>
        </View>

        {/* THÔNG TIN (Trái dưới) */}
        <View style={styles.bottomInfo} pointerEvents="none">
          <Text style={styles.username}>@{video.ownerName}</Text>
          <Text style={styles.caption} numberOfLines={2}>{video.caption}</Text>
          <View style={styles.audioRow}>
            <Music size={14} color="#fff" />
            <Text style={styles.audioText} numberOfLines={1}>
              original sound - {video.ownerName}
            </Text>
          </View>
        </View>

      {/* 6. THANH PROGRESS TRẮNG SIÊU MỎNG */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    </View>

    {/* --- 2. BẢNG BÌNH LUẬN (BOTTOM SHEET) --- */}
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
                <View style={styles.commentLike}>
                  <Heart size={14} color="#888" />
                  <Text style={styles.commentLikeCount}>{c.likes}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Ô nhập liệu có hỗ trợ bàn phím */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputBar}>
              <TextInput 
                style={styles.commentInput} 
                placeholder="Add comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={handleAddComment}>
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
  container: { width: width, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  
  // Sidebar căn chỉnh theo mẫu ảnh
  rightActions: { 
    position: 'absolute', 
    right: 8, 
    bottom: 20, 
    alignItems: 'center', 
    zIndex: 50,
    elevation: 5
  },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#fff' },
  plusIcon: { 
    position: 'absolute', 
    bottom: -8, 
    alignSelf: 'center', 
    backgroundColor: '#fe2c55', 
    borderRadius: 10, 
    padding: 2 
  },
  action: { alignItems: 'center', marginTop: 18 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 },

  // Thông tin caption bên trái
  bottomInfo: { 
    position: 'absolute', 
    bottom: 30, 
    left: 12, 
    paddingRight: 100 
  },
  username: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 5 },
  caption: { color: '#fff', fontSize: 14, marginBottom: 8, lineHeight: 18 },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  audioText: { color: '#fff', fontSize: 13, marginLeft: 6, width: width * 0.5 },

  // Style đĩa nhạc xoay
  musicDisc: {
    marginTop: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#111',
  },
  discImage: { width: 22, height: 22, borderRadius: 11 },

  // Thanh Progress mỏng sát đáy video
  progressBarContainer: { 
    position: 'absolute', 
    bottom: 15, 
    width: '100%', 
    height: 1.5, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: '#fff' 
  },
  commentSheet: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    height: '70%', // Chiều cao chiếm 70% màn hình
    backgroundColor: '#fff', 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    zIndex: 100, // Nằm trên tất cả
  },
  commentHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#eee' 
  },
  commentTitle: { 
    fontWeight: '700', 
    fontSize: 13, 
    textAlign: 'center', 
    flex: 1, 
    color: '#000' 
  },
  commentList: { flex: 1, padding: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  commentContent: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 12, color: '#888', marginBottom: 4 },
  commentMsg: { fontSize: 14, color: '#111' },
  commentLike: { alignItems: 'center' },
  commentLikeCount: { fontSize: 10, color: '#888', marginTop: 2 },
  commentInputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderTopWidth: 0.5, 
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20 
  },
  commentInput: { 
    flex: 1, 
    backgroundColor: '#f1f1f2', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    marginRight: 10, 
    color: '#000' 
  }
});

export default VideoItem;