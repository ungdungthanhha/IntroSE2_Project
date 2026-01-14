
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { X, Users, Heart } from 'lucide-react-native';
import Video from 'react-native-video';

import { User } from '../types/type';

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
}

interface LiveViewProps {
  onClose: () => void;
  currentUser: User | null;
}

const LiveView: React.FC<LiveViewProps> = ({ onClose, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [viewerCount, setViewerCount] = useState(1204);
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [hearts, setHearts] = useState<{ id: number, anim: any }[]>([]);
  const heartIdCounter = useRef(0);

  useEffect(() => {
    // Simulated live chat removed
    const interval = setInterval(() => {
      //  // Logic kept for viewer count/hearts only
      setViewerCount(prev => prev + Math.floor(Math.random() * 10 - 2));

      // Random hearts from "viewers"
      if (Math.random() > 0.7) triggerHeart();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [comments]);

  const triggerHeart = () => {
    const id = heartIdCounter.current++;
    const anim = new Animated.Value(0);
    setHearts(prev => [...prev, { id, anim }]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: currentUser?.displayName || currentUser?.username || 'You',
      avatar: currentUser?.avatarUrl || 'https://picsum.photos/seed/user/100/100',
      text: inputText
    };

    setComments(prev => [...prev, newComment]);
    setInputText('');
  };

  const handleGift = () => {
    Alert.alert("Gift Sent!", "You sent a 🎁 to the host!");
    triggerHeart();
    triggerHeart();
    triggerHeart();
  };

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4" }}
        style={styles.background}
        resizeMode="cover"
        repeat={true}
        muted={true}
      />

      {/* Header Overlay */}
      <View style={styles.header}>
        <View style={styles.hostInfo}>
          <Image source={{ uri: "https://picsum.photos/seed/host/200/200" }} style={styles.hostAvatar} />
          <View style={styles.hostText}>
            <Text style={styles.hostName}>NatureVibe</Text>
            <Text style={styles.hostLikes}>12.4K Likes</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.viewerBadge}>
            <Users size={12} color="#fff" />
            <Text style={styles.viewerCountText}>{viewerCount.toLocaleString()}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Hearts Layer */}
      <View style={styles.heartsContainer} pointerEvents="none">
        {hearts.map(heart => {
          const translateY = heart.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -200]
          });
          const opacity = heart.anim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0]
          });
          const translateX = heart.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.random() * 40 - 20]
          });

          return (
            <Animated.View
              key={heart.id}
              style={[
                styles.floatingHeart,
                {
                  opacity,
                  transform: [{ translateY }, { translateX }]
                }
              ]}
            >
              <Heart size={30} color={['#ff0000', '#ff69b4', '#fe2c55'][heart.id % 3]} fill={['#ff0000', '#ff69b4', '#fe2c55'][heart.id % 3]} />
            </Animated.View>
          );
        })}
      </View>

      {/* Dynamic Scrolling Comments */}
      <View style={styles.commentsWrapper}>
        <ScrollView
          ref={scrollRef}
          style={styles.commentsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsContainer}
        >
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUser}>{comment.user}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Actions */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.bottomBar}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Add comment..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.commentInput}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={triggerHeart}>
            <Heart size={20} color="#fe2c55" fill="#fe2c55" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.giftBtn} onPress={handleGift}>
            <Text style={styles.giftEmoji}>🎁</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 48,
    zIndex: 10,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 4,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  hostText: {
    marginRight: 16,
  },
  hostName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  hostLikes: {
    color: '#ccc',
    fontSize: 9,
  },
  followBtn: {
    backgroundColor: '#fe2c55',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 4,
  },
  viewerCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heartsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 300,
    zIndex: 9,
    alignItems: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 0,
  },
  commentsWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
    height: 200,
    zIndex: 10,
  },
  commentsScroll: {
    flex: 1,
  },
  commentsContainer: {
    paddingBottom: 20,
    gap: 8,
  },
  commentItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  commentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  commentContent: {
    flexShrink: 1,
  },
  commentUser: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentText: {
    color: '#fff',
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
  },
  commentInput: {
    color: '#fff',
    fontSize: 12,
    height: 40,
  },
  actionBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 20,
  }
});

export default LiveView;
