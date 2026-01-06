import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions,
  StatusBar,
} from 'react-native';
import { AppTab, User, Video as VideoType } from './src/types';
import { MOCK_VIDEOS } from './src/constants';
import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import AuthView from './src/components/AuthView';
import { Compass, Tv } from 'lucide-react-native';
import { firebase } from '@react-native-firebase/auth';
import { firebase as firestoreFirebase } from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { height } = Dimensions.get('window');

type FeedType = 'following' | 'foryou';

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [feedType, setFeedType] = useState<FeedType>('foryou');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>(MOCK_VIDEOS);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInChatDetail, setIsInChatDetail] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null); // Profile của người khác đang xem

  // Hàm để xem profile người khác
  const handleViewProfile = (user: User) => {
    setViewingProfile(user);
  };

  // Hàm để quay lại từ profile người khác
  const handleBackFromProfile = () => {
    setViewingProfile(null);
  };

  useEffect(() => {
    // Cấu hình Google Sign-In
    GoogleSignin.configure({
      webClientId: '760597409672-aa19hd3irh8fonlsf287iulj4o2isf63.apps.googleusercontent.com',
    });

    // Lắng nghe thay đổi trạng thái Auth (using modular API)
    const auth = firebase.auth();
    const db = firestoreFirebase.firestore();
    
    const subscriber = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            const newUser: User = {
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              avatarUrl: user.photoURL || 'https://picsum.photos/200/200',
              bio: 'Welcome to my Tictoc profile!',
              followersCount: 0,
              followingCount: 0,
            };
            await db.collection('users').doc(user.uid).set(newUser);
            setCurrentUser(newUser);
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Firestore Error:", error);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return subscriber;
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / height);
    if (index !== activeVideoIndex) setActiveVideoIndex(index);
  };

  const onPostVideo = (newVideo: any) => {
    if (!currentUser) return;
    const videoToAdd: VideoType = {
      ...newVideo,
      ownerUid: currentUser.uid,
      ownerName: currentUser.username,
      ownerAvatar: currentUser.avatarUrl,
      timestamp: Date.now(),
    };
    setVideos([videoToAdd, ...videos]);
    setActiveTab(AppTab.HOME);
  };

  const filteredVideos = feedType === 'foryou' 
    ? videos 
    : videos.filter((_, i) => i % 2 === 0);

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={activeTab === AppTab.HOME ? "light-content" : "dark-content"} />
      
      <View style={styles.content}>
        {activeTab === AppTab.HOME && !viewingProfile && (
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
                  onViewProfile={handleViewProfile}
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

        {activeTab === AppTab.UPLOAD && !viewingProfile && (
          <UploadView onClose={() => setActiveTab(AppTab.HOME)} onPost={onPostVideo} />
        )}

        {activeTab === AppTab.LIVE && !viewingProfile && (
          <LiveView onClose={() => setActiveTab(AppTab.HOME)} />
        )}

        {activeTab === AppTab.INBOX && !viewingProfile && <ChatView onChatDetailChange={setIsInChatDetail} />}
        
        {activeTab === AppTab.PROFILE && currentUser && !viewingProfile && (
          <ProfileView 
            user={currentUser} 
            userVideos={videos.filter(v => v.ownerUid === currentUser.uid)}
            currentUserId={currentUser.uid}
            isOwnProfile={true}
          />
        )}

        {/* Viewing other user's profile */}
        {viewingProfile && currentUser && (
          <ProfileView 
            user={viewingProfile} 
            userVideos={videos.filter(v => v.ownerUid === viewingProfile.uid)}
            currentUserId={currentUser.uid}
            isOwnProfile={false}
            onBack={handleBackFromProfile}
            onMessage={(user) => {
              // TODO: Navigate to chat with this user
              handleBackFromProfile();
              setActiveTab(AppTab.INBOX);
            }}
          />
        )}

        {activeTab === AppTab.DISCOVER && !viewingProfile && (
          <View style={styles.centerView}>
            <Compass color="#ddd" size={64} />
            <Text style={styles.emptyTitle}>Discover</Text>
            <Text style={styles.emptySub}>Trending content and challenges</Text>
          </View>
        )}
      </View>

      {activeTab !== AppTab.UPLOAD && activeTab !== AppTab.LIVE && !(activeTab === AppTab.INBOX && isInChatDetail) && !viewingProfile && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
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