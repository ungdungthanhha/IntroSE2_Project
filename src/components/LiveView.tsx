
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { X, Users, Heart } from 'lucide-react-native';
import Video from 'react-native-video';
import { simulateLiveChat } from '../services/geminiService';

interface LiveViewProps {
  onClose: () => void;
}

const LiveView: React.FC<LiveViewProps> = ({ onClose }) => {
  const [comments, setComments] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(1204);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchInitial = async () => {
      const initial = await simulateLiveChat("Nature exploring");
      setComments(initial);
    };
    fetchInitial();

    const interval = setInterval(async () => {
      const newComment = await simulateLiveChat("Nature exploring");
      setComments(prev => [...prev.slice(-15), newComment[0]]);
      setViewerCount(prev => prev + Math.floor(Math.random() * 10 - 2));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [comments]);

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

      {/* Dynamic Scrolling Comments */}
      <View style={styles.commentsWrapper}>
        <ScrollView 
          ref={scrollRef}
          style={styles.commentsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsContainer}
        >
          {comments.map((text, idx) => (
            <View key={idx} style={styles.commentItem}>
              <Image source={{ uri: `https://picsum.photos/seed/viewer${idx}/100/100` }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUser}>User_{idx + 5}</Text>
                <Text style={styles.commentText}>{text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Add comment..." 
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.commentInput}
          />
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Heart size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.giftBtn}>
          <Text style={styles.giftEmoji}>🎁</Text>
        </TouchableOpacity>
      </View>
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
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
