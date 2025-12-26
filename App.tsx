
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions,
  TextInput,
  StatusBar,
  Alert,
  Pressable
} from 'react-native';
import { AppTab, User, Video as VideoType } from './src/types';
import { MOCK_VIDEOS } from './src/constants';
import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import { Compass, Tv } from 'lucide-react-native';

const { height } = Dimensions.get('window');

const defaultUser: User = {
  uid: 'me',
  username: 'johndoe_dev',
  email: 'john@example.com',
  avatarUrl: 'https://picsum.photos/seed/me/200/200',
  bio: 'Building the future of short videos 🚀 | Fullstack Engineer',
  followersCount: 15400,
  followingCount: 430
};

type FeedType = 'following' | 'foryou';

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [feedType, setFeedType] = useState<FeedType>('foryou');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>(MOCK_VIDEOS);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');

  const handleAuth = () => {
    // Đăng nhập/đăng ký luôn thành công (mock auth)
    setIsAuthenticated(true);
  };

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / height);
    if (index !== activeVideoIndex) setActiveVideoIndex(index);
  };

  const onPostVideo = (newVideo: any) => {
    const videoToAdd: VideoType = {
      ...newVideo,
      ownerUid: defaultUser.uid,
      ownerName: defaultUser.username,
      ownerAvatar: defaultUser.avatarUrl,
      timestamp: Date.now(),
    };
    setVideos([videoToAdd, ...videos]);
    setActiveTab(AppTab.HOME);
  };

  const filteredVideos = feedType === 'foryou' 
    ? videos 
    : videos.filter((_, i) => i % 2 === 0);

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.authTitle}>TokStar</Text>
        <View style={styles.form}>
          {isRegistering && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={authUsername}
              onChangeText={setAuthUsername}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            value={authEmail}
            onChangeText={setAuthEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={authPassword}
            onChangeText={setAuthPassword}
          />
          <Pressable 
            style={({pressed}) => [
              styles.primaryButton,
              pressed && {opacity: 0.7}
            ]} 
            onPress={handleAuth}
          >
            <Text style={styles.primaryButtonText}>{isRegistering ? 'Sign up' : 'Log In'}</Text>
          </Pressable>
        </View>
        <Pressable 
          style={({pressed}) => [
            styles.switchAuth,
            pressed && {opacity: 0.7}
          ]} 
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={styles.switchAuthText}>
            {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={activeTab === AppTab.HOME ? "light-content" : "dark-content"} />
      
      <View style={styles.content}>
        {activeTab === AppTab.HOME && (
          <View style={styles.homeContainer}>
            <ScrollView 
              pagingEnabled 
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.videoList}
            >
              {filteredVideos.map((video, idx) => (
                <VideoItem 
                  key={video.id} 
                  video={video} 
                  isActive={activeVideoIndex === idx} 
                />
              ))}
            </ScrollView>

            <View style={styles.homeHeader}>
              <TouchableOpacity onPress={() => setActiveTab(AppTab.LIVE)} style={styles.liveIcon}>
                <Tv color="#fff" size={24} />
                <Text style={styles.liveLabel}>LIVE</Text>
              </TouchableOpacity>
              <View style={styles.headerTabs}>
                <TouchableOpacity onPress={() => setFeedType('following')}>
                  <Text style={[styles.headerTab, feedType === 'following' && styles.headerTabActive]}>Following</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFeedType('foryou')}>
                  <Text style={[styles.headerTab, feedType === 'foryou' && styles.headerTabActive]}>For You</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </View>
        )}

        {activeTab === AppTab.UPLOAD && (
          <UploadView onClose={() => setActiveTab(AppTab.HOME)} onPost={onPostVideo} />
        )}

        {activeTab === AppTab.LIVE && (
          <LiveView onClose={() => setActiveTab(AppTab.HOME)} />
        )}

        {activeTab === AppTab.INBOX && <ChatView />}
        
        {activeTab === AppTab.PROFILE && (
          <ProfileView 
            user={defaultUser} 
            userVideos={videos.filter(v => v.ownerUid === defaultUser.uid)} 
          />
        )}

        {activeTab === AppTab.DISCOVER && (
          <View style={styles.centerView}>
            <Compass color="#ddd" size={64} />
            <Text style={styles.emptyTitle}>Discover</Text>
            <Text style={styles.emptySub}>Trending content and challenges</Text>
          </View>
        )}
      </View>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  authContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 30 },
  logoCircle: { width: 80, height: 80, backgroundColor: '#000', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  authTitle: { fontSize: 24, fontWeight: '800', marginBottom: 40 },
  form: { width: '100%' },
  input: { backgroundColor: '#f8f8f8', padding: 15, borderRadius: 4, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#eee', color: '#000' },
  primaryButton: { backgroundColor: '#fe2c55', padding: 16, borderRadius: 4, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchAuth: { marginTop: 30 },
  switchAuthText: { color: '#fe2c55', fontWeight: '600' },
  homeContainer: { flex: 1, backgroundColor: '#000' },
  videoList: { flex: 1 },
  homeHeader: { position: 'absolute', top: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  headerTabs: { flexDirection: 'row' },
  headerTab: { color: 'rgba(255,255,255,0.6)', fontSize: 17, fontWeight: '700', marginHorizontal: 12 },
  headerTabActive: { color: '#fff', borderBottomWidth: 2, borderBottomColor: '#fff', paddingBottom: 4 },
  liveIcon: { alignItems: 'center' },
  liveLabel: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 2 },
  centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 20 },
  emptySub: { color: '#888', marginTop: 4 }
});

export default App;
