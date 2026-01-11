import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, ActivityIndicator, StatusBar } from 'react-native';
// Thêm icon Bookmark
import { Grid3x3 as Grid, ChevronDown, Heart, LogOut, Settings, Timer, ArrowLeft, MessageCircle, UserPlus, UserMinus, Share2, MoreHorizontal, Bookmark } from 'lucide-react-native';
import { User, Video } from '../types/type';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import EditProfileView from './EditProfileView';
import TimeLimitModal from './TimeLimitModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const COL_WIDTH = width / 3;

interface ProfileViewProps {
  user: User;
  userVideos: Video[];
  currentUserId?: string;
  isOwnProfile?: boolean;
  onBack?: () => void;
  onMessage?: (user: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user: initialUser,
  userVideos, 
  currentUserId,
  isOwnProfile = true,
  onBack,
  onMessage 
}) => {
  const [currentUserData, setCurrentUserData] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(currentUserData.followersCount);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    if (!isOwnProfile && currentUserId) {
      checkFollowStatus();
    }
  }, [initialUser.uid, currentUserId, isOwnProfile]);

  useEffect(() => {
    setCurrentUserData(initialUser);
    setFollowerCount(initialUser.followersCount);
  }, [initialUser]);

  const handleUpdateSuccess = (updatedUser: User) => {
    setCurrentUserData(updatedUser);
  };

  if (isEditing) {
    return (
      <EditProfileView 
        user={currentUserData} 
        onClose={() => setIsEditing(false)} 
        onUpdateSuccess={handleUpdateSuccess}
      />
    );
  }

  const checkFollowStatus = async () => {
    if (!currentUserId) return;
    try {
      const status = await userService.isFollowing(currentUserId, currentUserData.uid);
      setIsFollowing(status);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(currentUserId, currentUserData.uid);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await userService.followUser(currentUserId, currentUserData.uid);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (onMessage) onMessage(currentUserData);
  };

  const handleShare = () => {
    Alert.alert('Share Profile', `Share @${currentUserData.username}'s profile`);
  };
  
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => authService.logoutUser() }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      {/* Header - Giống ảnh mẫu */}
      <View style={styles.header}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.headerIconLeft}>
            <UserPlus size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onBack} style={styles.headerIconLeft}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
        )}

        <View style={styles.titleWrap}>
          {/* Tên hiển thị ở giữa + icon mũi tên xuống */}
          <Text style={styles.username}>{currentUserData.displayName || currentUserData.username}</Text>
          <ChevronDown size={14} color="#000" style={{ marginTop: 2 }} />
        </View>

        <View style={styles.headerRight}>
            {isOwnProfile ? (
              <>
                {/* Giả lập icon cái dù/mắt (nếu cần) hoặc chỉ để Settings */}
                <TouchableOpacity onPress={handleLogout} style={styles.headerIcon}>
                    <Settings size={24} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setShowTimeLimitModal(true)} 
                  style={styles.headerIcon}
                >
                  <Timer size={24} color="#000" />
        </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.headerIcon}>
                <MoreHorizontal size={24} color="#000" />
              </TouchableOpacity>
            )}
        </View>
      </View>

      <TimeLimitModal visible={showTimeLimitModal} onClose={() => setShowTimeLimitModal(false)} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: currentUserData.avatarUrl }} style={styles.avatar} />
          </View>

          <Text style={styles.handle}>@{currentUserData.username || "jacob_w"}</Text>

          {/* Stats Section */}
          <View style={styles.stats}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statVal}>{currentUserData.followingCount || 14}</Text>
              <Text style={styles.statLab}>Following</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statVal}>{followerCount || 38}</Text>
              <Text style={styles.statLab}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statVal}>91</Text>
              <Text style={styles.statLab}>Likes</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                  <Text style={styles.editBtnText}>Edit profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookmarkBtn}>
                  <Bookmark size={20} color="#000" />
                </TouchableOpacity>
              </>
            ) : (
              // ... giữ nguyên logic cho profile người khác ...
              <>
                <TouchableOpacity 
                  style={[styles.followBtn, isFollowing && styles.followingBtn]} 
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? "#000" : "#fff"} />
                  ) : (
                    <>
                       <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                   <MessageCircle size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                  <ChevronDown size={20} color="#000" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.bio}>{currentUserData.bio || "Tap to add bio"}</Text>
        </View>

        {/* Tabs Navigation */}
        <View style={styles.tabs}>
          {/* Tab 1: Video */}
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Grid size={24} color={activeTab === 'videos' ? "#000" : "#ccc"} />
          </TouchableOpacity>

          {/* Tab 2: Đã lưu (Private) */}
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'locked' && styles.tabActive]}
            onPress={() => setActiveTab('locked')}
          >
            <Bookmark size={24} color={activeTab === 'locked' ? "#000" : "#ccc"} />
          </TouchableOpacity>

          {/* Tab 3: Đã thích (Heart) */}
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
            onPress={() => setActiveTab('liked')}
          >
            <Heart size={24} color={activeTab === 'liked' ? "#000" : "#ccc"} />
          </TouchableOpacity>
        </View>

        {/* Grid Videos */}
        <View style={styles.grid}>
          {userVideos.length > 0 ? (
            userVideos.map((video) => (
              <TouchableOpacity key={video.id} style={styles.gridItem}>
                <Image 
                  source={{ uri: `https://picsum.photos/seed/${video.id}/300/400` }} 
                  style={styles.gridImg} 
                />
                 <View style={styles.playCountBadge}>
                     <Text style={styles.playCountText}>▷ {Math.floor(Math.random() * 1000)}</Text>
                 </View>
              </TouchableOpacity>
            ))
          ) : (
             // Render placeholder nếu không có video (để test giao diện)
             [1,2,3,4,5,6].map((i) => (
                <View key={i} style={styles.gridItem}>
                    <View style={[styles.gridImg, {backgroundColor: '#e1e1e1'}]} />
                </View>
             ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5, 
    borderBottomColor: '#e0e0e0' ,
    position: 'relative',
  },
  headerIconLeft: { minWidth: 40, zIndex: 1, },
  headerRight: { flexDirection: 'row', alignItems: 'center', minWidth: 40, justifyContent: 'flex-end', gap: 15, zIndex: 1, },
  headerIcon: { padding: 2 },
  titleWrap: { 
    // 2. Sửa lại hoàn toàn đoạn này
    position: 'absolute', // Tách ra khỏi dòng chảy layout bình thường
    left: 0,
    right: 0,
    top: 0,
    bottom: 0, // Căng full 4 góc của header
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', // Căn giữa tuyệt đối
  },
  username: { fontSize: 17, fontWeight: '700', marginRight: 4, color: '#000' },
  
  profileInfo: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  
  handle: { fontSize: 17, fontWeight: '600', marginBottom: 16 },
  
  stats: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statItem: { alignItems: 'center', paddingHorizontal: 16 },
  statVal: { fontSize: 17, fontWeight: '700', color: '#000' },
  statLab: { fontSize: 13, color: '#888', marginTop: 2 },
  divider: { width: 1, height: 15, backgroundColor: '#e0e0e0' },

  actions: { flexDirection: 'row', paddingHorizontal: 40, gap: 6, marginBottom: 12 },
  
  // Style cho nút Edit Profile (giống ảnh)
  editBtn: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#e1e1e1', 
    height: 44, 
    borderRadius: 4, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  editBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  
  // Style cho nút Bookmark vuông bên cạnh
  bookmarkBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  // Styles cho trạng thái người khác (không đổi nhiều)
  followBtn: { flex: 1, backgroundColor: '#fe2c55', height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  followBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e1e1' },
  followingBtnText: { color: '#000' },
  messageBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  moreBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  bio: { fontSize: 14, color: '#000', marginTop: 8, paddingHorizontal: 30, textAlign: 'center' },
  
  // Tabs
  tabs: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', marginTop: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: COL_WIDTH, height: COL_WIDTH * 1.33, borderWidth: 0.5, borderColor: '#fff' },
  gridImg: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  playCountBadge: { position: 'absolute', bottom: 5, left: 5, flexDirection: 'row', alignItems: 'center' },
  playCountText: { color: '#fff', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
  
  noVideos: { width: '100%', padding: 40, alignItems: 'center' },
  noVideosText: { color: '#888' }
});

export default ProfileView;