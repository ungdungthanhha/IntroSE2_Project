import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  FlatList, Dimensions, StatusBar, Platform,
  ActivityIndicator, Alert
} from 'react-native';
import { ArrowLeft, Tv, Search } from 'lucide-react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { db, COLLECTIONS } from './src/config/firebase';

import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import AuthView from './src/components/AuthView';
import VerifyEmailView from './src/components/VerifyEmailView';
import DiscoveryView from './src/components/DiscoveryView';

import { AppTab, User, Video as VideoType } from './src/types/type';
import { MOCK_VIDEOS } from './src/constants';

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
  
  // State điều hướng
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);

  const [isInChatDetail, setIsInChatDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const ACTUAL_VIDEO_HEIGHT = WINDOW_HEIGHT - insets.top - BOTTOM_NAV_HEIGHT;
  const [setupStatus, setSetupStatus] = useState("Initializing...");

  // --- LOGIC DATABASE & AUTH (GIỮ NGUYÊN) ---
  const ensureUserDoc = async (user: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(user.uid);
      const doc = await userRef.get({ source: 'server' });

      if (!doc.exists || !doc.data()) {
        const newUser: User = {
          uid: user.uid,
          username: (user.displayName || 'user').replace(/\s/g, '').toLowerCase(),
          displayName: user.displayName || 'User',
          email: user.email || '',
          birthday: '',
          avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
          bio: 'Welcome to Tictoc!',
          followersCount: 0,
          followingCount: 0
        };
        const cleanUser = JSON.parse(JSON.stringify(newUser));
        await userRef.set(cleanUser);
        const verifyDoc = await userRef.get({ source: 'server' });
        if (!verifyDoc.exists) throw new Error("Server sync failed.");
        setCurrentUser(newUser);
        return true;
      } else {
        setCurrentUser(doc.data() as User);
        return true;
      }
    } catch (e: any) {
      Alert.alert("Database Error", e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    GoogleSignin.configure({ webClientId: '760597409672-aa19hd3irh8fonlsf287iulj4o2isf63.apps.googleusercontent.com' });
    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
          setIsVerified(false); setIsAuthenticated(true); setIsLoading(false);
        } else {
          setIsVerified(true); setIsAuthenticated(true); await ensureUserDoc(user);
        }
      } else {
        setIsAuthenticated(false); setIsVerified(false); setCurrentUser(null); setIsLoading(false);
      }
    });
    return subscriber;
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const snapshot = await db.collection('videos').get();
      if (!snapshot.empty) {
        setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoType[]);
      } else { setVideos(MOCK_VIDEOS); }
    } catch (e) { setVideos(MOCK_VIDEOS); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveVideoIndex(viewableItems[0].index || 0);
  }).current;

  // --- HANDLERS ĐIỀU HƯỚNG ---

  const handleSelectSearchedVideo = (video: VideoType) => {
    setSelectedVideo(video); // Mở Video Detail
  };

  const handleSelectSearchedUser = (user: any) => {
    setViewingProfile(user as User); // Mở Profile
  };

  const handleBackFromDetail = () => {
    setSelectedVideo(null); // Đóng Video Detail -> Về Discovery
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {!isAuthenticated ? (
        <AuthView />
      ) : !isVerified ? (
        <VerifyEmailView
          user={auth().currentUser}
          onVerified={async () => {
            if (auth().currentUser && await ensureUserDoc(auth().currentUser)) {
              Alert.alert("Verified!", "Please log in again.");
              auth().signOut();
            }
          }}
          onLogout={() => auth().signOut()}
        />
      ) : (!currentUser) ? (
        <View style={styles.loadingFull}><ActivityIndicator color="#fe2c55" size="large" /></View>
      ) : (
        // === MAIN CONTENT STRUCTURE ===
        // Chúng ta dùng View bọc ngoài để xếp lớp (Layer)
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          
          {/* LAYER 1: CONTENT (HOME / DISCOVERY / VIDEO DETAIL) */}
          {selectedVideo ? (
            // --- TRƯỜNG HỢP: ĐANG XEM VIDEO CHI TIẾT ---
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <StatusBar barStyle="light-content" />
              <VideoItem 
                video={selectedVideo} 
                shouldLoad={true}
                isActive={true} 
                itemHeight={WINDOW_HEIGHT}
                // Khi bấm avatar trong video -> Set viewingProfile -> Profile sẽ hiện đè lên (Layer 2)
                onViewProfile={setViewingProfile} 
              />
              <TouchableOpacity 
                style={{ position: 'absolute', top: insets.top + 10, left: 16, zIndex: 999, padding: 8 }}
                onPress={handleBackFromDetail}
              >
                <ArrowLeft color="#fff" size={30} style={{ shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 2 }}/>
              </TouchableOpacity>
            </View>
          ) : (
            // --- TRƯỜNG HỢP: GIAO DIỆN CHÍNH (TABS) ---
            <>
              <View style={styles.content}>
                {activeTab === AppTab.HOME && (
                  <View style={styles.homeContainer}>
                     {/* Header Home */}
                    <View style={[styles.homeHeader, { top: insets.top + 10 }]}>
                      <View style={styles.headerSide}><TouchableOpacity onPress={() => setActiveTab(AppTab.LIVE)}><Tv color="#fff" size={24} /></TouchableOpacity></View>
                      <View style={styles.headerCenter}>
                        <View style={styles.headerTabs}>
                          <Text onPress={() => setFeedType('friends')} style={[styles.headerTab, feedType === 'friends' && styles.headerTabActive]}>Friends</Text>
                          <Text onPress={() => setFeedType('following')} style={[styles.headerTab, feedType === 'following' && styles.headerTabActive]}>Following</Text>
                          <Text onPress={() => setFeedType('foryou')} style={[styles.headerTab, feedType === 'foryou' && styles.headerTabActive]}>For You</Text>
                        </View>
                      </View>
                      <View style={styles.headerSide}><Search color="#fff" size={26} /></View>
                    </View>

                    {/* Video List */}
                    <View style={{ marginTop: insets.top, height: ACTUAL_VIDEO_HEIGHT }}>
                      {isLoading ? <ActivityIndicator style={{marginTop: 50}} color="#fe2c55" /> : (
                        <FlatList
                          data={videos}
                          keyExtractor={item => item.id}
                          renderItem={({ item, index }) => (
                            <VideoItem
                              video={item}
                              isActive={activeVideoIndex === index}
                              shouldLoad={Math.abs(activeVideoIndex - index) <= 1}
                              itemHeight={ACTUAL_VIDEO_HEIGHT}
                              onViewProfile={setViewingProfile}
                            />
                          )}
                          snapToInterval={ACTUAL_VIDEO_HEIGHT}
                          snapToAlignment="start"
                          decelerationRate="fast"
                          pagingEnabled
                          showsVerticalScrollIndicator={false}
                          onViewableItemsChanged={onViewableItemsChanged}
                          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
                          getItemLayout={(_, index) => ({ length: ACTUAL_VIDEO_HEIGHT, offset: ACTUAL_VIDEO_HEIGHT * index, index })}
                          windowSize={2}
                        />
                      )}
                    </View>
                  </View>
                )}

                {activeTab === AppTab.DISCOVER && (
                  <DiscoveryView 
                    allVideos={videos} 
                    onSelectVideo={handleSelectSearchedVideo}
                    onSelectUser={handleSelectSearchedUser} 
                  />
                )}
                
                {activeTab === AppTab.LIVE && <LiveView onClose={() => setActiveTab(AppTab.HOME)} />}
                {activeTab === AppTab.UPLOAD && <UploadView onClose={() => setActiveTab(AppTab.HOME)} currentUser={currentUser} onPost={async () => { await fetchVideos(); setActiveTab(AppTab.HOME); }} />}
                {activeTab === AppTab.INBOX && <ChatView onChatDetailChange={setIsInChatDetail} />}
                
                {/* Khi bấm Tab Profile chính chủ */}
                {activeTab === AppTab.PROFILE && currentUser && (
                  <ProfileView
                    user={currentUser}
                    isOwnProfile={true}
                    onBack={() => setActiveTab(AppTab.HOME)} 
                    userVideos={[]} 
                  />
                )}
              </View>
              {!isInChatDetail && activeTab !== AppTab.LIVE && activeTab !== AppTab.UPLOAD && (
                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
              )}
            </>
          )}

          {/* LAYER 2: PROFILE OVERLAY (QUAN TRỌNG NHẤT) */}
          {/* Lớp này nằm đè lên TẤT CẢ (cả Video Detail lẫn Main Tabs) */}
          {viewingProfile && currentUser && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: '#fff' }]}>
               <ProfileView
                 user={viewingProfile}
                 isOwnProfile={false}
                 onBack={() => {
                   // Khi bấm Back ở Profile:
                   // Chỉ tắt Profile đi -> Lộ ra lớp bên dưới (Video Detail hoặc Discovery)
                   setViewingProfile(null); 
                 }}
                 userVideos={[]} 
               />
            </View>
          )}

        </View>
      )}
    </View>
  );
};

const App = () => (<SafeAreaProvider><AppContent /></SafeAreaProvider>);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1 },
  homeContainer: { flex: 1 },
  homeHeader: { position: 'absolute', width: '100%', flexDirection: 'row', zIndex: 100, alignItems: 'center', paddingHorizontal: 16 },
  headerSide: { flex: 1, alignItems: 'center' },
  headerCenter: { flex: 5, alignItems: 'center' },
  headerTabs: { flexDirection: 'row', alignItems: 'center' },
  headerTab: { color: '#fff', opacity: 0.6, marginHorizontal: 8, fontWeight: 'bold', fontSize: 16 },
  headerTabActive: { opacity: 1, borderBottomWidth: 2, borderBottomColor: '#fff', paddingBottom: 4 },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default App;