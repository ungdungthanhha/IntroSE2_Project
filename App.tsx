import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  FlatList, Dimensions, StatusBar, Platform,
  ActivityIndicator, 
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import AuthView from './src/components/AuthView';

import { AppTab, User, Video as VideoType } from './src/types/type';
import { MOCK_VIDEOS } from './src/constants';
import { Tv, Search } from 'lucide-react-native';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const BOTTOM_NAV_HEIGHT = 60; 

const AppContent = () => {
  const insets = useSafeAreaInsets(); 
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [feedType, setFeedType] = useState<'foryou' | 'following' | 'friends'>('foryou');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>([]); 
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [isInChatDetail, setIsInChatDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- CÔNG THỨC KHÓA KHUNG HÌNH TUYỆT ĐỐI ---
  const ACTUAL_VIDEO_HEIGHT = WINDOW_HEIGHT - insets.top - BOTTOM_NAV_HEIGHT;

  // 1. LOGIC AUTH & GOOGLE SIGN-IN
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '760597409672-aa19hd3irh8fonlsf287iulj4o2isf63.apps.googleusercontent.com',
    });

    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userRef = firestore().collection('users').doc(user.uid);
        try {
          const doc = await userRef.get().catch(() => null);
          if (doc && !doc.exists) {
            const newUser: User = {
              uid: user.uid,
              username: user.displayName?.replace(/\s/g, '').toLowerCase() || 'user',
              email: user.email || '',
              birthday: '',
              avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
              bio: 'Welcome to Tictoc!',
              followersCount: 0,
              followingCount: 0
            };
            await userRef.set(newUser);
            setCurrentUser(newUser);
          } else if (doc) {
            setCurrentUser(doc.data() as User);
          }
        } catch (e) { console.log("Auth Error:", e); }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    return subscriber;
  }, []);

  // 2. LOGIC FETCH VIDEO
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const snapshot = await firestore().collection('videos').get();
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoType[];
          setVideos(data);
        } else { setVideos(MOCK_VIDEOS); }
      } catch (e) { setVideos(MOCK_VIDEOS); }
      finally { setIsLoading(false); }
    };
    fetchVideos();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveVideoIndex(viewableItems[0].index || 0);
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {!isAuthenticated ? (
        <AuthView />
      ) : (
        <>
          <View style={styles.content}>
            {/* MÀN HÌNH CHÍNH (HOME) */}
            {activeTab === AppTab.HOME && !viewingProfile && (
              <View style={styles.homeContainer}>
                
                {/* HEADER: Theo mẫu ảnh Friends - Following - For You */}
                <View style={[styles.homeHeader, { top: insets.top + 10 }]}>
                  <View style={styles.headerSide}>
                    <TouchableOpacity onPress={() => setActiveTab(AppTab.LIVE)}>
                        <Tv color="#fff" size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.headerCenter}>
                    <View style={styles.headerTabs}>
                      <TouchableOpacity onPress={() => setFeedType('friends')}>
                        <Text style={[styles.headerTab, feedType === 'friends' && styles.headerTabActive]}>Friends</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setFeedType('following')}>
                        <Text style={[styles.headerTab, feedType === 'following' && styles.headerTabActive]}>Following</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setFeedType('foryou')}>
                        <Text style={[styles.headerTab, feedType === 'foryou' && styles.headerTabActive]}>For You</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.headerSide}>
                    <TouchableOpacity style={styles.searchIcon}><Search color="#fff" size={26} /></TouchableOpacity>
                  </View>
                </View>

                {/* VÙNG CHỨA VIDEO "KHÓA KHUNG" */}
                <View style={{ marginTop: insets.top, height: ACTUAL_VIDEO_HEIGHT, overflow: 'hidden' }}>
                  {isLoading ? (
                    <View style={styles.loadingFull}><ActivityIndicator color="#fe2c55" size="large" /></View>
                  ) : (
                    <FlatList
                      data={videos}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item, index }) => (
                        <VideoItem 
                          video={item} 
                          isActive={activeVideoIndex === index} 
                          itemHeight={ACTUAL_VIDEO_HEIGHT}
                          onViewProfile={setViewingProfile} // Thêm logic xem Profile
                        />
                      )}
                      snapToInterval={ACTUAL_VIDEO_HEIGHT}
                      snapToAlignment="start"
                      decelerationRate="fast"
                      disableIntervalMomentum={true}
                      pagingEnabled={Platform.OS === 'ios'}
                      showsVerticalScrollIndicator={false}
                      onViewableItemsChanged={onViewableItemsChanged}
                      viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
                      getItemLayout={(_, index) => ({
                        length: ACTUAL_VIDEO_HEIGHT,
                        offset: ACTUAL_VIDEO_HEIGHT * index,
                        index,
                      })}
                      removeClippedSubviews={true}
                      windowSize={2}
                    />
                  )}
                </View>
              </View>
            )}

            {/* CÁC TAB KHÁC THEO LOGIC CỦA APP */}
            {activeTab === AppTab.LIVE && <LiveView onClose={() => setActiveTab(AppTab.HOME)} />}
            {activeTab === AppTab.UPLOAD && <UploadView onClose={() => setActiveTab(AppTab.HOME)} currentUser={currentUser} onPost={() => setActiveTab(AppTab.HOME)} />}
            {activeTab === AppTab.INBOX && <ChatView onChatDetailChange={setIsInChatDetail} />}
            
            {(activeTab === AppTab.PROFILE || viewingProfile) && currentUser && (
              <ProfileView 
                  user={viewingProfile || currentUser}
                  isOwnProfile={!viewingProfile}
                  onBack={() => { setViewingProfile(null); setActiveTab(AppTab.HOME); } } userVideos={[]}              />
            )}
          </View>

          {/* CHỈ HIỆN BOTTOM NAV KHI KHÔNG TRONG CHAT CHI TIẾT */}
          {!viewingProfile && !isInChatDetail && activeTab !== AppTab.LIVE && activeTab !== AppTab.UPLOAD && (
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </>
      )}
    </View>
  );
};

const App = () => (
  <SafeAreaProvider><AppContent /></SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1 },
  homeContainer: { flex: 1 },
  homeHeader: { 
    position: 'absolute', 
    width: '100%', 
    flexDirection: 'row', 
    zIndex: 100, 
    alignItems: 'center',
    paddingHorizontal: 16
  },
  headerSide: { flex: 1, alignItems: 'center' },
  headerCenter: { flex: 5, alignItems: 'center' },
  headerTabs: { flexDirection: 'row', alignItems: 'center' },
  headerTab: { color: '#fff', opacity: 0.6, marginHorizontal: 8, fontWeight: 'bold', fontSize: 16 },
  headerTabActive: { opacity: 1, borderBottomWidth: 2, borderBottomColor: '#fff', paddingBottom: 4 },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchIcon: { alignItems: 'flex-end' }
});

export default App;