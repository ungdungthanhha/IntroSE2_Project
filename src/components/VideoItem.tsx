
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Heart, MessageCircle, Bookmark, Plus, Music, Send, X } from 'lucide-react-native';
import Video from 'react-native-video';
import { Video as VideoType } from '../types';

const { width, height } = Dimensions.get('window');

interface VideoItemProps {
  video: VideoType;
  isActive: boolean;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: '1', user: 'alex_j', text: 'This is so cool! 🔥', likes: 12 },
    { id: '2', user: 'chef_master', text: 'Need the tutorial now!', likes: 5 },
  ]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: 'me',
      text: commentText,
      likes: 0
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: video.videoUrl }}
        style={styles.video}
        resizeMode="cover"
        repeat={true}
        paused={!isActive}
        muted={false}
        playInBackground={false}
        playWhenInactive={false}
      />
      
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.rightActions}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: video.ownerAvatar }} style={styles.avatar} />
            <TouchableOpacity 
              onPress={() => setIsFollowing(true)}
              style={[styles.followButton, isFollowing && { backgroundColor: '#fff' }]}
            >
              <Plus size={12} color={isFollowing ? "#fe2c55" : "#fff"} strokeWidth={4} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.action} onPress={() => setIsLiked(!isLiked)}>
            <Heart size={32} color={isLiked ? "#fe2c55" : "#fff"} fill={isLiked ? "#fe2c55" : "none"} />
            <Text style={styles.actionText}>{(video.likesCount + (isLiked ? 1 : 0)).toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setShowComments(true)}>
            <MessageCircle size={32} color="#fff" />
            <Text style={styles.actionText}>{video.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => setIsSaved(!isSaved)}>
            <Bookmark size={32} color={isSaved ? "#facd00" : "#fff"} fill={isSaved ? "#facd00" : "none"} />
            <Text style={styles.actionText}>{(video.savesCount + (isSaved ? 1 : 0)).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{video.ownerName}</Text>
          <Text style={styles.caption} numberOfLines={3}>{video.caption}</Text>
          <View style={styles.audioRow}>
            <Music size={14} color="#fff" />
            <Text style={styles.audioText}>Original Audio - {video.ownerName}</Text>
          </View>
        </View>
      </View>

      {/* Comment Bottom Sheet Simulation */}
      {showComments && (
        <View style={styles.commentSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>{comments.length} comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <X size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.commentList}>
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
  container: { width: width, height: height, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  rightActions: { position: 'absolute', right: 12, bottom: 120, alignItems: 'center' },
  avatarContainer: { marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  followButton: { position: 'absolute', bottom: -8, alignSelf: 'center', backgroundColor: '#fe2c55', borderRadius: 10, padding: 2 },
  action: { alignItems: 'center', marginTop: 20 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 4 },
  bottomInfo: { marginBottom: 100, paddingRight: 80 },
  username: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  caption: { color: '#fff', fontSize: 15, lineHeight: 20, marginBottom: 12 },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  audioText: { color: '#fff', fontSize: 14, marginLeft: 8 },
  // Comment Sheet Styles
  commentSheet: { position: 'absolute', bottom: 0, width: '100%', height: '60%', backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, zIndex: 100 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  commentTitle: { fontWeight: '700', fontSize: 13, textAlign: 'center', flex: 1, color: '#000' },
  commentList: { flex: 1, padding: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  commentContent: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 12, color: '#888', marginBottom: 4 },
  commentMsg: { fontSize: 14, color: '#111' },
  commentLike: { alignItems: 'center' },
  commentLikeCount: { fontSize: 10, color: '#888', marginTop: 2 },
  commentInputBar: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 30 },
  commentInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, color: '#000' }
});

export default VideoItem;
