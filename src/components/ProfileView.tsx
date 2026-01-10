import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Grid3x3 as Grid, ChevronDown, Heart, LogOut, Settings, Timer, ArrowLeft, MessageCircle, UserPlus, UserMinus, Share2, MoreHorizontal } from 'lucide-react-native';
import { User, Video } from '../types/type';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import TimeLimitModal from './TimeLimitModal';

const { width } = Dimensions.get('window');
const COL_WIDTH = width / 3;

interface ProfileViewProps {
  user: User;
  userVideos: Video[];
  currentUserId?: string; // ID của user đang đăng nhập
  isOwnProfile?: boolean; // true nếu đang xem profile của chính mình
  onBack?: () => void; // Callback khi nhấn nút back (xem profile người khác)
  onMessage?: (user: User) => void; // Callback khi nhấn nút message
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  userVideos, 
  currentUserId,
  isOwnProfile = true,
  onBack,
  onMessage 
}) => {
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(user.followersCount);
  
  // Check if current user is following this profile
  useEffect(() => {
    if (!isOwnProfile && currentUserId) {
      checkFollowStatus();
    }
  }, [user.uid, currentUserId, isOwnProfile]);

  const checkFollowStatus = async () => {
    if (!currentUserId) return;
    try {
      const status = await userService.isFollowing(currentUserId, user.uid);
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
        await userService.unfollowUser(currentUserId, user.uid);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await userService.followUser(currentUserId, user.uid);
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
    if (onMessage) {
      onMessage(user);
    }
  };

  const handleShare = () => {
    Alert.alert('Share Profile', `Share @${user.username}'s profile`);
  };
  
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: async () => {
            const result = await authService.logoutUser();
            if (!result.success) {
              Alert.alert("Error", result.error);
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - Different for own profile vs other's profile */}
      {isOwnProfile ? (
        <View style={styles.header}>
          <TouchableOpacity>
            <Settings size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.username}>{user.username}</Text>
            <ChevronDown size={14} />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowTimeLimitModal(true)} style={styles.headerIcon}>
              <Timer size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <LogOut size={24} color="#fe2c55" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerIcon}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.username}>{user.username}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleShare} style={styles.headerIcon}>
              <Share2 size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <MoreHorizontal size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Time Limit Modal */}
      <TimeLimitModal 
        visible={showTimeLimitModal} 
        onClose={() => setShowTimeLimitModal(false)} 
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.handle}>@{user.username}</Text>
          
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{user.followingCount}</Text>
              <Text style={styles.statLab}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{followerCount.toLocaleString()}</Text>
              <Text style={styles.statLab}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>0</Text>
              <Text style={styles.statLab}>Likes</Text>
            </View>
          </View>

          {/* Actions - Different for own profile vs other's profile */}
          {isOwnProfile ? (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[
                  styles.followBtn, 
                  isFollowing && styles.followingBtn
                ]} 
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#000" : "#fff"} />
                ) : (
                  <>
                    {isFollowing ? (
                      <UserMinus size={16} color="#000" />
                    ) : (
                      <UserPlus size={16} color="#fff" />
                    )}
                    <Text style={[
                      styles.followBtnText, 
                      isFollowing && styles.followingBtnText
                    ]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                <MessageCircle size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreBtn}>
                <ChevronDown size={18} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.bio}>{user.bio || "No bio yet."}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <View style={[styles.tab, styles.tabActive]}>
            <Grid size={24} color="#000" />
          </View>
          <View style={styles.tab}>
            <Heart size={24} color="#ccc" />
          </View>
        </View>

        {/* Video Grid */}
        <View style={styles.grid}>
          {userVideos.length > 0 ? (
            userVideos.map((video) => (
              <TouchableOpacity key={video.id} style={styles.gridItem}>
                <Image 
                  source={{ uri: `https://picsum.photos/seed/${video.id}/300/400` }} 
                  style={styles.gridImg} 
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noVideos}>
              <Text style={styles.noVideosText}>No videos posted yet.</Text>
            </View>
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
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f2f2f2' 
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerIcon: { padding: 2 },
  titleWrap: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 17, fontWeight: '700', marginRight: 4 },
  profileInfo: { alignItems: 'center', paddingVertical: 20 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: '#eee', padding: 4 },
  avatar: { width: '100%', height: '100%', borderRadius: 48 },
  handle: { fontSize: 17, fontWeight: '600', marginTop: 12, marginBottom: 20 },
  bio: { fontSize: 14, color: '#000', marginTop: 15, paddingHorizontal: 40, textAlign: 'center' },
  stats: { flexDirection: 'row', marginBottom: 20 },
  statItem: { alignItems: 'center', marginHorizontal: 15 },
  statVal: { fontSize: 18, fontWeight: '700' },
  statLab: { fontSize: 13, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', width: '100%', paddingHorizontal: 40, gap: 8 },
  editBtn: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#eee', 
    height: 44, 
    borderRadius: 4, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  editBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  followBtn: { 
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fe2c55', 
    height: 44, 
    borderRadius: 4, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6
  },
  followBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  followingBtn: {
    backgroundColor: '#f1f1f2',
    borderWidth: 1,
    borderColor: '#e1e1e1'
  },
  followingBtnText: { color: '#000' },
  messageBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f2'
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f2'
  },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', marginTop: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: COL_WIDTH, height: COL_WIDTH * 1.33, padding: 0.5 },
  gridImg: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  noVideos: { width: '100%', padding: 40, alignItems: 'center' },
  noVideosText: { color: '#888' }
});

export default ProfileView;