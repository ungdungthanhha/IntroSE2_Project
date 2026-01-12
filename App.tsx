import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  FlatList, Dimensions, StatusBar, Platform,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
// REMOVED raw firestore import to use consistent config
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { db, COLLECTIONS } from './src/config/firebase';

import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import AuthView from './src/components/AuthView';
import VerifyEmailView from './src/components/VerifyEmailView'; // NEW COMPONENT

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
  const [isVerified, setIsVerified] = useState(false); // Track verification status

  // --- CÔNG THỨC KHÓA KHUNG HÌNH TUYỆT ĐỐI ---
  const ACTUAL_VIDEO_HEIGHT = WINDOW_HEIGHT - insets.top - BOTTOM_NAV_HEIGHT;

  // Helper: Create DB Doc if missing (Verify-First Logic)
  // Helper: Create DB Doc if missing (Verify-First Logic)
  const [setupStatus, setSetupStatus] = useState("Initializing..."); // NEW DEBUG STATE

  const ensureUserDoc = async (user: any): Promise<boolean> => {
    setIsLoading(true);
    setSetupStatus("Connecting to Database server...");
    try {
      // Force server fetch to ensure we don't hit empty cache
      const userRef = db.collection(COLLECTIONS.USERS).doc(user.uid);
      setSetupStatus("Checking if profile exists...");
      const doc = await userRef.get({ source: 'server' }); // FORCE SERVER

      if (!doc.exists || !doc.data()) {
        setSetupStatus("Profile missing. Creating new record...");
        const newUser: User = {
          uid: user.uid,
          username: (user.displayName || 'user').replace(/\s/g, '').toLowerCase(),
          email: user.email || '',
          birthday: '',
          avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
          bio: 'Welcome to Tictoc!',
          followersCount: 0,
          followingCount: 0
        };
        const cleanUser = JSON.parse(JSON.stringify(newUser));

        setSetupStatus("Writing to Firestore...");
        await userRef.set(cleanUser);
        console.log("DB Doc Write Initiated:", cleanUser);

        // CRITICAL FIX: Verify the write actually hit the server
        setSetupStatus("Verifying server storage...");
        const verifyDoc = await userRef.get({ source: 'server' });

        if (!verifyDoc.exists) {
          throw new Error("Server sync failed. Data was written locally but not found on server.");
        }

        console.log("DB Doc Created & Verified on Server");

        setSetupStatus("Success! Loading app...");
        setCurrentUser(newUser);
        return true;
      } else {
        console.log("DB Doc Exists:", doc.data());
        setSetupStatus("Profile found. Syncing...");
        setCurrentUser(doc.data() as User);
        return true;
      }
    } catch (e: any) {
      console.log("Error ensureUserDoc:", e);
      setSetupStatus("FAILED: " + e.message);
      Alert.alert("Database Error", "Failed to save profile.\n" + e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 1. LOGIC AUTH & GOOGLE SIGN-IN
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '760597409672-aa19hd3irh8fonlsf287iulj4o2isf63.apps.googleusercontent.com',
    });

    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // 1. Check Verification Status
        if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
          setIsVerified(false);
          setIsAuthenticated(true); // Still authenticated, just not verified
          // We do NOT load user data yet
          setIsLoading(false);
        } else {
          setIsVerified(true);
          setIsAuthenticated(true);
          await ensureUserDoc(user); // Now we fetch/create data
        }
      } else {
        setIsAuthenticated(false);
        setIsVerified(false);
        setCurrentUser(null);
        setIsLoading(false);
      }
    });
    return subscriber;
  }, []);

  // 2. LOGIC FETCH VIDEO (Refactored for reuse)
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const snapshot = await db.collection('videos').get();
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoType[];
        setVideos(data);
      } else { setVideos(MOCK_VIDEOS); }
    } catch (e) { setVideos(MOCK_VIDEOS); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
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
      ) : !isVerified ? (
        <VerifyEmailView
          user={auth().currentUser}
          onVerified={async () => {
            // 1. Create DB Record NOW while logged in
            let success = false;
            if (auth().currentUser) {
              success = await ensureUserDoc(auth().currentUser);
            }

            // 2. Only if DB write success, kick them out
            if (success) {
              Alert.alert("Verified!", "Your email has been verified and profile created.\nPlease log in to continue.");
              auth().signOut();
            } else {
              // If failed, stay here so they can try "I have verified" again
              Alert.alert("Setup Failed", "We verified your email but couldn't create your profile. Please check your connection and tap 'I have verified' again.");
            }
          }}
          onLogout={() => auth().signOut()}
        />
      ) : (!currentUser) ? (
        // If verified but no user data yet (loading)
        <View style={styles.loadingFull}>
          <ActivityIndicator color="#fe2c55" size="large" />
          <Text style={{ color: '#fff', marginTop: 10, marginBottom: 5, fontWeight: 'bold' }}>Setting up profile...</Text>
          <Text style={{ color: '#aaa', marginBottom: 20, fontSize: 12 }}>{setupStatus}</Text>

          <TouchableOpacity
            onPress={() => { auth().signOut(); }}
            style={{ padding: 10, backgroundColor: '#333', borderRadius: 5 }}
          >
            <Text style={{ color: '#fff' }}>Log Out & Retry</Text>
          </TouchableOpacity>
        </View>
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
                          shouldLoad={Math.abs(activeVideoIndex - index) <= 1} // Preload logic: Load Current, Prev, and Next
                          itemHeight={ACTUAL_VIDEO_HEIGHT}
                          onViewProfile={setViewingProfile}
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
            {activeTab === AppTab.UPLOAD && <UploadView onClose={() => setActiveTab(AppTab.HOME)} currentUser={currentUser} onPost={async () => { await fetchVideos(); setActiveTab(AppTab.HOME); }} />}
            {activeTab === AppTab.INBOX && <ChatView onChatDetailChange={setIsInChatDetail} />}

            {(activeTab === AppTab.PROFILE || viewingProfile) && currentUser && (
              <ProfileView
                user={viewingProfile || currentUser}
                isOwnProfile={!viewingProfile}
                onBack={() => { setViewingProfile(null); setActiveTab(AppTab.HOME); }} userVideos={[]} />
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