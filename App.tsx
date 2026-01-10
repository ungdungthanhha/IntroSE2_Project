import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, Dimensions, StatusBar
} from 'react-native';
import auth from '@react-native-firebase/auth'; // Sử dụng instance trực tiếp để tránh lỗi
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as videoService from './src/services/videoService'; // Import service
import { AppTab, User, Video as VideoType } from './src/types/type';
import { MOCK_VIDEOS } from './src/constants';
import VideoItem from './src/components/VideoItem';
import BottomNav from './src/components/BottomNav';
import ProfileView from './src/components/ProfileView';
import ChatView from './src/components/ChatView';
import UploadView from './src/components/UploadView';
import LiveView from './src/components/LiveView';
import AuthView from './src/components/AuthView';
import { Compass, Tv } from 'lucide-react-native';


const { height } = Dimensions.get('window');

const App = () => {
  // --- 1. TẤT CẢ HOOKS LUÔN ĐẶT Ở TRÊN CÙNG (Fix lỗi "Fewer hooks than expected") ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [feedType, setFeedType] = useState<'following' | 'friends' | 'foryou'>('foryou');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [isInChatDetail, setIsInChatDetail] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '760597409672-aa19hd3irh8fonlsf287iulj4o2isf63.apps.googleusercontent.com',
    });

    // Sử dụng auth() trực tiếp để tuân thủ Modular API mới
    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          // Đồng bộ dữ liệu User từ Firestore
          const userRef = firestore().collection('users').doc(user.uid);
          const unsubUser = userRef.onSnapshot(doc => {
            if (doc.exists()) setCurrentUser(doc.data() as User);
          });
        } catch (e) {
          console.error("Profile sync error:", e);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return subscriber;
  }, []);


  useEffect(() => {
    const fetchRealVideos = async () => {
      // Gọi hàm lấy video từ Firestore
      const data = await videoService.getAllVideos();
      if (data.length > 0) {
        setVideos(data); // Cập nhật video thực vào Feed
      } else {
        setVideos(MOCK_VIDEOS); // Nếu chưa có video nào thì hiện tạm mẫu
      }
    };

    fetchRealVideos();
    // ... giữ logic auth cũ
  }, []);

  // --- 2. LOGIC FUNCTIONS ---
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / height);
    if (index !== activeVideoIndex) setActiveVideoIndex(index);
  };

  const filteredVideos = feedType === 'foryou'
    ? videos
    : videos.filter((_, i) => i % 2 === 0);

  // --- 3. UI RENDER (Sử dụng toán tử điều kiện bên trong, KHÔNG dùng return sớm) ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Tùy chỉnh màu thanh trạng thái dựa trên màn hình */}
      <StatusBar barStyle={activeTab === AppTab.HOME ? "light-content" : "dark-content"} />

      {!isAuthenticated ? (
        <AuthView />
      ) : (
        <>
          <View style={styles.content}>
            {/* HOME FEED VIEW */}
            {activeTab === AppTab.HOME && !viewingProfile && (
              <View style={styles.homeContainer}>
                <ScrollView
                  pagingEnabled
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {filteredVideos.map((v, idx) => (
                    <VideoItem
                      key={v.id}
                      video={v}
                      isActive={activeVideoIndex === idx}
                      onViewProfile={setViewingProfile}
                    />
                  ))}
                </ScrollView>

                {/* Header với nút LIVE theo thiết kế TikTok */}
                <View style={styles.homeHeader}>
                  <TouchableOpacity onPress={() => setActiveTab(AppTab.LIVE)} style={styles.liveIcon}>
                    <Tv color="#fff" size={24} />
                    <Text style={styles.liveLabel}>LIVE</Text>
                  </TouchableOpacity>
                  <View style={styles.headerTabs}>
                    <TouchableOpacity onPress={() => setFeedType('following')}>
                      <Text style={[styles.headerTab, feedType === 'following' && styles.headerTabActive]}>Following</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFeedType('friends')}>
                      <Text style={[styles.headerTab, feedType === 'friends' && styles.headerTabActive]}>Friends</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFeedType('foryou')}>
                      <Text style={[styles.headerTab, feedType === 'foryou' && styles.headerTabActive]}>For You</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: 40 }} />
                </View>
              </View>
            )}

            {/* LIVE & UPLOAD VIEWS */}
            {activeTab === AppTab.LIVE && <LiveView onClose={() => setActiveTab(AppTab.HOME)} />}
            {activeTab === AppTab.UPLOAD && <UploadView onClose={() => setActiveTab(AppTab.HOME)} onPost={() => { }} currentUser={currentUser} />}

            {/* INBOX & DISCOVER */}
            {activeTab === AppTab.INBOX && <ChatView onChatDetailChange={setIsInChatDetail} />}
            {activeTab === AppTab.DISCOVER && (
              <View style={styles.centerView}>
                <Compass color="#ddd" size={64} />
                <Text style={styles.emptyTitle}>Discover</Text>
                <Text style={styles.emptySub}>Find trending content on Tictoc</Text>
              </View>
            )}

            {/* PROFILE VIEW (Tài khoản của tôi hoặc người khác) */}
            {(activeTab === AppTab.PROFILE || viewingProfile) && currentUser && (
              <ProfileView
                user={viewingProfile || currentUser}
                userVideos={videos.filter(v => v.ownerUid === (viewingProfile?.uid || currentUser.uid))}
                isOwnProfile={!viewingProfile}
                onBack={() => {
                  setViewingProfile(null);
                  setActiveTab(AppTab.HOME);
                }}
              />
            )}
          </View>

          {/* Ẩn thanh điều hướng dưới khi đang ở chế độ đặc biệt hoặc xem chi tiết chat */}
          {!viewingProfile && activeTab !== AppTab.LIVE && activeTab !== AppTab.UPLOAD && !isInChatDetail && (
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  homeContainer: { flex: 1, backgroundColor: '#000' },
  homeHeader: { position: 'absolute', top: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  headerTabs: { flexDirection: 'row' },
  headerTab: { color: 'rgba(255,255,255,0.6)', fontSize: 17, fontWeight: '700', marginHorizontal: 12 },
  headerTabActive: { color: '#fff', borderBottomWidth: 2, borderBottomColor: '#fff', paddingBottom: 4 },
  liveIcon: { alignItems: 'center' },
  liveLabel: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 2 },
  centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#161823', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#86878B', marginTop: 5 }
});

export default App;