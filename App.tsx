import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  FlatList, Dimensions, StatusBar, Platform,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { ArrowLeft, Tv, Search } from 'lucide-react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { db, COLLECTIONS } from './src/config/firebase';
import * as videoService from './src/services/videoService';

import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import AuthView from './src/components/AuthView';
import VerifyEmailView from './src/components/VerifyEmailView';
import DiscoveryView from './src/components/DiscoveryView';
import SearchView from './src/components/SearchView';
import TimeLimitExceededView from './src/components/TimeLimitExceededView';

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

  // Mới: State để biết Profile đang ở màn hình con (như Settings)
  const [isProfileSubView, setIsProfileSubView] = useState(false);

  // State video của user state
  const [myVideos, setMyVideos] = useState<VideoType[]>([]);
  const [otherVideos, setOtherVideos] = useState<VideoType[]>([]);

  const ACTUAL_VIDEO_HEIGHT = WINDOW_HEIGHT - insets.top - BOTTOM_NAV_HEIGHT;
  const [setupStatus, setSetupStatus] = useState("Initializing...");
  const [isSearching, setIsSearching] = useState(false);

  // Screen Time State
  const [isTimeLimitReached, setIsTimeLimitReached] = useState(false);
  const [isTimeLimitIgnored, setIsTimeLimitIgnored] = useState(false);

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
          role: 'user',
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
      console.error('ensureUserDoc Error:', e);
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

  // --- APP USAGE TRACKING ---
  const { startSession, endSession, isLimitExceeded } = require('./src/services/appUsageService');
  const { AppState } = require('react-native');

  useEffect(() => {
    // Start initial session
    startSession();

    const subscription = AppState.addEventListener('change', (nextAppState: any) => {
      if (nextAppState === 'active') {
        startSession();
      } else if (nextAppState.match(/inactive|background/)) {
        endSession();
      }
    });

    return () => {
      endSession();
      subscription.remove();
    };
  }, []);

  // Check Time Limit Periodically
  useEffect(() => {
    const checkLimit = async () => {
      // If already ignored for this session/day, don't check
      if (isTimeLimitIgnored) return;

      const exceeded = await isLimitExceeded();
      setIsTimeLimitReached(exceeded);
    };

    // Check immediately and then every 10 seconds
    checkLimit();
    const interval = setInterval(checkLimit, 10000);

    return () => clearInterval(interval);
  }, [isTimeLimitIgnored]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVideos = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const allVideos = await videoService.getAllVideos(currentUser?.uid);
      if (allVideos.length > 0) {
        setVideos(allVideos);
      } else { setVideos(MOCK_VIDEOS); }
    } catch (e) { setVideos(MOCK_VIDEOS); }
    finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchVideos(false);
    setIsRefreshing(false);
  };

  // Fetch videos on mount and when currentUser changes
  useEffect(() => { 
    fetchVideos(); 
  }, [currentUser?.uid]);

  // Fetch My Videos
  useEffect(() => {
    if (currentUser?.uid) {
      videoService.getVideosByUser(currentUser.uid).then(setMyVideos);
    }
  }, [currentUser?.uid, activeTab === AppTab.PROFILE]);

  // Fetch Other User Videos
  useEffect(() => {
    if (viewingProfile?.uid) {
      setOtherVideos([]); // Clear old data
      videoService.getVideosByUser(viewingProfile.uid).then(setOtherVideos);
    }
  }, [viewingProfile?.uid]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveVideoIndex(viewableItems[0].index || 0);
  }).current;

  // --- ĐIỀU HƯỚNG MỚI (STACK-BASED) ---
  const [navStack, setNavStack] = useState<string[]>(['home']);
  const currentScreen = navStack[navStack.length - 1] || 'home';

  const pushScreen = (screen: string) => {
    setNavStack(prev => [...prev, screen]);
  };

  const popScreen = () => {
    setNavStack(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  const getZIndex = (screenName: string) => {
    const idx = navStack.lastIndexOf(screenName);
    return idx === -1 ? -1 : idx + 1000;
  };

  // --- HANDLERS ĐIỀU HƯỚNG ---

  const handleSelectSearchedVideo = (video: VideoType) => {
    setSelectedVideo(video); // Mở Video Detail
    pushScreen('video');
  };

  const handleSelectSearchedUser = (user: any) => {
    setViewingProfile(user as User); // Mở Profile
    pushScreen('profile');
  };

  const handleBackFromDetail = () => {
    setSelectedVideo(null); // Đóng Video Detail
    popScreen();
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
          {isSearching ? (
            <View style={{ flex: 1, zIndex: getZIndex('search') }}>
              <SearchView
                allVideos={videos}
                onBack={() => {
                  setIsSearching(false);
                  popScreen();
                }}
                onSelectVideo={handleSelectSearchedVideo}
                onSelectUser={handleSelectSearchedUser}
              />
            </View>
          ) : (
            <View style={{ flex: 1, zIndex: getZIndex('home') }}>
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
                      <View style={styles.headerSide}>
                        <TouchableOpacity onPress={() => {
                          setIsSearching(true);
                          pushScreen('search');
                        }}>
                          <Search color="#fff" size={26} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Video List */}
                    <View style={{ marginTop: insets.top, height: ACTUAL_VIDEO_HEIGHT }}>
                      {isLoading ? <ActivityIndicator style={{ marginTop: 50 }} color="#fe2c55" /> : (
                        <FlatList
                          data={videos}
                          refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#fff" />
                          }
                          keyExtractor={item => item.id}
                          renderItem={({ item, index }) => (
                            <VideoItem
                              video={item}
                              isActive={activeVideoIndex === index && currentScreen === 'home'}
                              shouldLoad={Math.abs(activeVideoIndex - index) <= 1}
                              itemHeight={ACTUAL_VIDEO_HEIGHT}
                              onViewProfile={(user) => {
                                setViewingProfile(user);
                                pushScreen('profile');
                              }}
                              currentUserId={currentUser?.uid} // Pass currentUserId
                              onLikeChange={() => fetchVideos(false)} // Refresh videos when user likes
                              onSaveChange={() => fetchVideos(false)} // Refresh videos when user saves
                              onCommentAdded={() => fetchVideos(false)} // Refresh videos when user comments
                            />
                          )}
                          snapToInterval={ACTUAL_VIDEO_HEIGHT}
                          snapToAlignment="start"
                          decelerationRate="fast"
                          pagingEnabled
                          disableIntervalMomentum={true}
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

                {activeTab === AppTab.LIVE && <LiveView onClose={() => setActiveTab(AppTab.HOME)} currentUser={currentUser} />}
                {activeTab === AppTab.UPLOAD && <UploadView onClose={() => setActiveTab(AppTab.HOME)} currentUser={currentUser} onPost={async () => { await fetchVideos(); if (currentUser?.uid) videoService.getVideosByUser(currentUser.uid).then(setMyVideos); setActiveTab(AppTab.HOME); }} />}
                {activeTab === AppTab.INBOX && <ChatView onChatDetailChange={setIsInChatDetail} currentUser={currentUser!} />}

                {/* Khi bấm Tab Profile chính chủ */}
                {activeTab === AppTab.PROFILE && currentUser && (
                  <ProfileView
                    user={currentUser}
                    isOwnProfile={true}
                    currentUserId={currentUser.uid} // Added currentUserId
                    // Removed onBack to keep navbar (settings/wellbeing) and show UserPlus icon
                    userVideos={myVideos}
                    onSubViewChange={setIsProfileSubView}
                    onUserUpdate={(updatedUser) => {
                      setCurrentUser(updatedUser);
                      // Update local video state without re-fetching everything (Optimistic update)
                      setVideos(prev => prev.map(v =>
                        v.ownerUid === updatedUser.uid
                          ? { ...v, ownerAvatar: updatedUser.avatarUrl, ownerName: updatedUser.displayName || updatedUser.username }
                          : v
                      ));

                      // Also update myVideos list
                      setMyVideos(prev => prev.map(v =>
                        v.ownerUid === updatedUser.uid
                          ? { ...v, ownerAvatar: updatedUser.avatarUrl, ownerName: updatedUser.displayName || updatedUser.username }
                          : v
                      ));
                    }}
                    onSelectVideo={(video) => {
                      // Store references to ProfileView's handlers before navigating
                      handleSelectSearchedVideo(video);
                    }}
                    onVideoUpdate={(videoId, action) => {
                      if (action === 'delete') {
                        setMyVideos(prev => prev.filter(v => v.id !== videoId));
                        setVideos(prev => prev.filter(v => v.id !== videoId));
                      } else if (action === 'unlike') {
                        // Giảm like count trong list videos
                        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likesCount: Math.max(0, v.likesCount - 1), isLiked: false } : v));
                        // Nếu user đang xem list của chính mình, cũng update luôn
                        setMyVideos(prev => prev.map(v => v.id === videoId ? { ...v, likesCount: Math.max(0, v.likesCount - 1), isLiked: false } : v));
                      } else if (action === 'unsave') {
                        // Giảm save count
                        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, savesCount: Math.max(0, (v.savesCount || 0) - 1), isSaved: false } : v));
                        setMyVideos(prev => prev.map(v => v.id === videoId ? { ...v, savesCount: Math.max(0, (v.savesCount || 0) - 1), isSaved: false } : v));
                      }
                    }}
                  />
                )}
              </View>

              {currentScreen === 'home' && !isInChatDetail && !isProfileSubView && activeTab !== AppTab.LIVE && activeTab !== AppTab.UPLOAD && (
                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
              )}
            </View>
          )}

          {/* LAYER 2: PROFILE OVERLAY */}
          {viewingProfile && currentUser && (
            <View style={[StyleSheet.absoluteFill, { zIndex: getZIndex('profile'), backgroundColor: '#fff' }]}>
              <ProfileView
                user={viewingProfile}
                isOwnProfile={viewingProfile.uid === currentUser.uid}
                currentUserId={currentUser.uid} // Added currentUserId
                onBack={() => {
                  setViewingProfile(null);
                  popScreen();
                }}
                userVideos={otherVideos}
                onSelectVideo={handleSelectSearchedVideo}
                onUserUpdate={(updatedProfile) => {
                  setViewingProfile(updatedProfile);
                }}
                onCurrentUserUpdate={(updatedCurrentUser) => {
                  setCurrentUser(updatedCurrentUser);
                }}
              />
            </View>
          )}

          {/* LAYER 3: VIDEO DETAIL OVERLAY */}
          {selectedVideo && (
            <View style={[StyleSheet.absoluteFill, { zIndex: getZIndex('video'), backgroundColor: '#000' }]}>
              <VideoItem
                video={selectedVideo}
                shouldLoad={true}
                isActive={currentScreen === 'video'}
                itemHeight={WINDOW_HEIGHT}
                onViewProfile={(user) => {
                  setViewingProfile(user);
                  pushScreen('profile');
                }}
                currentUserId={currentUser?.uid}
                onLikeChange={(videoId, isLiked) => {
                  // Call ProfileView's handler if attached to video object
                  const handler = (selectedVideo as any).__profileViewLikeHandler;
                  if (handler) {
                    handler(videoId, isLiked);
                  }
                  // Also refresh main feed
                  fetchVideos(false);
                }}
                onSaveChange={(videoId, isSaved) => {
                  // Call ProfileView's handler if attached to video object
                  const handler = (selectedVideo as any).__profileViewSaveHandler;
                  if (handler) {
                    handler(videoId, isSaved);
                  }
                  // Also refresh main feed
                  fetchVideos(false);
                }}
                onCommentAdded={() => fetchVideos(false)} // Refresh videos when user comments
              />
              <TouchableOpacity
                style={{ position: 'absolute', top: insets.top + 10, left: 16, zIndex: 9991, padding: 8 }}
                onPress={handleBackFromDetail}
              >
                <ArrowLeft color="#fff" size={30} style={{ shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 2 }} />
              </TouchableOpacity>
            </View>
          )}

        </View>
      )}
      {/* TIME LIMIT OVERLAY */}
      <TimeLimitExceededView
        visible={isTimeLimitReached && !isTimeLimitIgnored}
        onUnlock={() => setIsTimeLimitIgnored(true)}
      />
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