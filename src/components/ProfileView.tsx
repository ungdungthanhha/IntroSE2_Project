import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, ActivityIndicator, StatusBar, BackHandler, FlatList } from 'react-native';
import { Grid3x3 as Grid, ChevronDown, Heart, LogOut, Settings, Umbrella, ArrowLeft, MessageCircle, UserPlus, UserMinus, Share2, MoreHorizontal, Bookmark, Menu } from 'lucide-react-native';
import { User, Video } from '../types/type';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as videoService from '../services/videoService'; // Import videoService
import EditProfileView from './EditProfileView';
import SettingsView from './SettingsView';
import DigitalWellbeingView from './DigitalWellbeingView';
import DailyScreenTimeView from './DailyScreenTimeView';
import FollowListModal from './FollowListModal';
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
  onSubViewChange?: (isSubView: boolean) => void;
  onUserUpdate?: (user: User) => void;
  onCurrentUserUpdate?: (user: User) => void;
  onSelectVideo?: (video: Video) => void;
  onVideoUpdate?: (videoId: string, action: 'delete' | 'unlike' | 'unsave') => void;
  onLikeChange?: (videoId: string, isLiked: boolean) => void;
  onSaveChange?: (videoId: string, isSaved: boolean) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  user: initialUser,
  userVideos,
  currentUserId,
  isOwnProfile = true,
  onBack,
  onMessage,
  onSubViewChange,
  onUserUpdate,
  onCurrentUserUpdate,
  onSelectVideo,
  onVideoUpdate,
  onLikeChange,
  onSaveChange
}) => {
  // Use props directly instead of destructing to access onVideoUpdate in callback
  const props = { onUserUpdate, onSelectVideo, onVideoUpdate };
  const [currentUserData, setCurrentUserData] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(currentUserData.followersCount);
  const [totalLikes, setTotalLikes] = useState(0);

  // New State for Tabs
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Settings Navigation Stack
  const [settingsPath, setSettingsPath] = useState<string[]>([]);
  
  // Follow List Modal
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'Followers' | 'Following'>('Followers');
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isOwnProfile && currentUserId) {
      checkFollowStatus();
    }
  }, [initialUser.uid, currentUserId, isOwnProfile]);

  // Fetch full user data from Firebase on mount or when uid changes
  useEffect(() => {
    const fetchFullUserData = async () => {
      if (!initialUser.uid) return;
      try {
        const fullUserData = await userService.getUserById(initialUser.uid);
        if (fullUserData) {
          console.log('ProfileView - Fetched full user data from Firebase:', fullUserData);
          setCurrentUserData(fullUserData);
          setFollowerCount(fullUserData.followersCount || 0);
        }
      } catch (error) {
        console.error('Error fetching full user data:', error);
        // Fallback to initialUser if fetch fails
        setCurrentUserData(initialUser);
        setFollowerCount(initialUser.followersCount || 0);
      }
    };
    
    fetchFullUserData();
  }, [initialUser.uid]);

  useEffect(() => {
    setCurrentUserData(initialUser);
    setFollowerCount(initialUser.followersCount);
    console.log('ProfileView - initialUser:', initialUser);
  }, [initialUser]);

  // Sync followerCount when currentUserData changes
  useEffect(() => {
    setFollowerCount(currentUserData.followersCount);
    console.log('ProfileView - currentUserData updated:', currentUserData);
  }, [currentUserData.followersCount]);

  // Calculate total likes from user's videos
  useEffect(() => {
    const total = userVideos.reduce((sum, video) => sum + (video.likesCount || 0), 0);
    setTotalLikes(total);
    console.log('ProfileView - Total likes calculated:', total);
  }, [userVideos]);

  // Fetch videos when tab changes - Always refetch to ensure fresh data and auto-remove unliked/unsaved videos
  useEffect(() => {
    const fetchTabVideos = async () => {
      if (!initialUser.uid) return;

      if (activeTab === 'liked') {
        setLoadingVideos(true);
        try {
          const vids = await videoService.getLikedVideos(initialUser.uid);
          setLikedVideos(vids);
        } catch (error) {
          console.error('Error fetching liked videos:', error);
        } finally {
          setLoadingVideos(false);
        }
      } else if (activeTab === 'locked') { // 'locked' tab for Saved
        setLoadingVideos(true);
        try {
          const vids = await videoService.getSavedVideos(initialUser.uid);
          setSavedVideos(vids);
        } catch (error) {
          console.error('Error fetching saved videos:', error);
        } finally {
          setLoadingVideos(false);
        }
      }
    };

    fetchTabVideos();
  }, [activeTab, initialUser.uid]);

  // Handle video status changes (unlike/unsave) - immediately remove from gallery
  // This is called when videos are unliked/unsaved from VideoItem detail view
  useEffect(() => {
    // This effect helps sync the profile view when a video's like/save status changes
    // The primary sync happens when switching tabs (which triggers a refetch)
  }, [likedVideos, savedVideos]);

  useEffect(() => {
    const backAction = () => {
      if (settingsPath.length > 0) {
        setSettingsPath(prev => prev.slice(0, -1));
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [settingsPath]);

  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(settingsPath.length > 0);
    }
  }, [settingsPath, onSubViewChange]);

  const handleUpdateSuccess = (updatedUser: User) => {
    setCurrentUserData(updatedUser);
    if (onUserUpdate) onUserUpdate(updatedUser);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => authService.logoutUser() }
    ]);
  };

  // Determine which videos to show
  const getDisplayVideos = () => {
    switch (activeTab) {
      case 'liked': return likedVideos;
      case 'locked': return savedVideos;
      case 'videos': default: return userVideos;
    }
  };

  const displayVideos = getDisplayVideos();

  // Helper to get thumbnail
  const getThumbnail = (video: Video) => {
    if (video.thumbUrl) return video.thumbUrl;
    if (video.videoUrl) {
      return video.videoUrl.replace(/\.[^/.]+$/, ".jpg");
    }
    return `https://picsum.photos/seed/${video.id}/300/400`;
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

  const currentView = settingsPath[settingsPath.length - 1];

  if (currentView === 'daily_screen_time') {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <DailyScreenTimeView onBack={() => setSettingsPath(prev => prev.slice(0, -1))} />
      </View>
    );
  }

  if (currentView === 'digital_wellbeing') {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <DigitalWellbeingView
          onBack={() => setSettingsPath(prev => prev.slice(0, -1))}
          onNavigate={(screen) => setSettingsPath(prev => [...prev, screen])}
        />
      </View>
    );
  }

  if (currentView === 'settings') {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <SettingsView
          onBack={() => setSettingsPath([])}
          onNavigate={(screen) => setSettingsPath(prev => [...prev, screen])}
          onLogout={handleLogout}
        />
      </View>
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
      } else {
        await userService.followUser(currentUserId, currentUserData.uid);
        setIsFollowing(true);
      }
      
      // Fetch updated user data from Firebase
      const updatedUser = await userService.getUserById(currentUserData.uid);
      if (updatedUser) {
        setCurrentUserData(updatedUser);
        setFollowerCount(updatedUser.followersCount);
        if (onUserUpdate) onUserUpdate(updatedUser);
        console.log('Updated user after follow toggle:', updatedUser);
      }
      
      // Callback to update current user's following count
      if (onCurrentUserUpdate) {
        const currentUser = await userService.getUserById(currentUserId);
        if (currentUser) {
          onCurrentUserUpdate(currentUser);
          console.log('Updated current user:', currentUser);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (onMessage) onMessage(currentUserData);
  };

  // Handle realtime removal of videos when unliked/unsaved
  const handleVideoLikeChange = (videoId: string, isLiked: boolean) => {
    if (!isLiked) {
      // Video was unliked - remove from liked gallery immediately
      setLikedVideos(prev => prev.filter(v => v.id !== videoId));
    }
    // Forward to parent if provided
    if (onLikeChange) {
      onLikeChange(videoId, isLiked);
    }
  };

  const handleVideoSaveChange = (videoId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Video was unsaved - remove from saved gallery immediately
      setSavedVideos(prev => prev.filter(v => v.id !== videoId));
    }
    // Forward to parent if provided
    if (onSaveChange) {
      onSaveChange(videoId, isSaved);
    }
  };

  // Wrap onSelectVideo to pass handlers
  const handleSelectVideo = (video: Video) => {
    // Attach handlers to the video object so VideoItem can use them
    (video as any).__profileViewLikeHandler = handleVideoLikeChange;
    (video as any).__profileViewSaveHandler = handleVideoSaveChange;
    
    if (onSelectVideo) {
      onSelectVideo(video);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.headerIconLeft}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
        ) : isOwnProfile ? (
          <TouchableOpacity style={styles.headerIconLeft}>
            <UserPlus size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onBack} style={styles.headerIconLeft}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.username}>{currentUserData.displayName || currentUserData.username}</Text>
          <ChevronDown size={14} color="#000" style={{ marginTop: 2 }} />
        </View>

        <View style={styles.headerRight}>
          {isOwnProfile && !onBack ? (
            <>
              <TouchableOpacity onPress={() => setSettingsPath(['digital_wellbeing'])} style={styles.headerIcon}>
                <Umbrella size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSettingsPath(['settings'])} style={styles.headerIcon}>
                <Menu size={24} color="#000" />
              </TouchableOpacity>
            </>
          ) : !isOwnProfile ? (
            <TouchableOpacity style={styles.headerIcon}>
              <MoreHorizontal size={24} color="#000" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={displayVideos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: currentUserData.avatarUrl }} style={styles.avatar} />
              </View>

              <Text style={styles.handle}>@{currentUserData.username || "jacob_w"}</Text>

              {/* Stats Section */}
              <View style={styles.stats}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setFollowModalType('Following');
                    setShowFollowModal(true);
                  }}
                >
                  <Text style={styles.statVal}>{currentUserData.followingCount || 0}</Text>
                  <Text style={styles.statLab}>Following</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setFollowModalType('Followers');
                    setShowFollowModal(true);
                  }}
                >
                  <Text style={styles.statVal}>{currentUserData.followersCount || 0}</Text>
                  <Text style={styles.statLab}>Followers</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statVal}>{totalLikes || 0}</Text>
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
              <TouchableOpacity
                style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
                onPress={() => setActiveTab('videos')}
              >
                <Grid size={24} color={activeTab === 'videos' ? "#000" : "#ccc"} />
              </TouchableOpacity>

              {isOwnProfile && (
                <>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'locked' && styles.tabActive]}
                    onPress={() => setActiveTab('locked')}
                  >
                    <Bookmark size={24} color={activeTab === 'locked' ? "#000" : "#ccc"} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
                    onPress={() => setActiveTab('liked')}
                  >
                    <Heart size={24} color={activeTab === 'liked' ? "#000" : "#ccc"} />
                  </TouchableOpacity>
                </>
              )}
            </View>
            {loadingVideos && (
              <ActivityIndicator size="large" color="#000" style={{ marginTop: 20, width: '100%' }} />
            )}
          </>
        }
        renderItem={({ item: video }) => (
          <TouchableOpacity
            key={video.id}
            style={styles.gridItem}
            onPress={() => handleSelectVideo(video)}
            onLongPress={() => {
              // ONLY allow long-press for user's own videos tab (Case 1)
              // Disable long-press for liked and saved tabs
              if (!currentUserId) return;

              // CASE 1: DELETE MY VIDEO (Only allow this)
              if (activeTab === 'videos' && isOwnProfile && currentUserId === video.ownerUid) {
                Alert.alert(
                  "Delete Video",
                  "Are you sure you want to delete this video?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete", style: "destructive", onPress: async () => {
                        const res = await videoService.deleteVideo(video.id, currentUserId);
                        if (res.success) {
                          Alert.alert("Deleted", "Video has been removed.");
                          if (props.onVideoUpdate) props.onVideoUpdate(video.id, 'delete');
                        } else {
                          Alert.alert("Error", res.error || "Failed");
                        }
                      }
                    }
                  ]
                );
              }
              // Long-press disabled for liked and saved tabs
            }}
          >
            <Image
              source={{ uri: getThumbnail(video) }}
              style={styles.gridImg}
              resizeMode="cover"
            />
            <View style={styles.playCountBadge}>
              <Text style={styles.playCountText}>▷ {(video.viewCount || 0).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loadingVideos ? (
            <View style={styles.noVideos}>
              <Text style={styles.noVideosText}>
                {activeTab === 'liked' ? "No liked videos" :
                  activeTab === 'locked' ? "No saved videos" :
                    "No videos yet"}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Follow List Modal */}
      <FollowListModal
        visible={showFollowModal}
        title={followModalType}
        userId={currentUserData.uid}
        onClose={() => setShowFollowModal(false)}
        onUserPress={(user) => {
          // Navigate to user profile
          if (onSelectVideo) {
            // Use a hack to navigate - in a real app you'd use proper navigation
            setViewingProfile(user);
          }
        }}
      />
    </View >
  );

  // This is used to track when viewing another user's profile (for the hack above)
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);

  // If viewing a profile, show that instead
  if (viewingProfile) {
    return (
      <ProfileView
        user={viewingProfile}
        isOwnProfile={false}
        currentUserId={currentUserId}
        onBack={() => setViewingProfile(null)}
        userVideos={[]}
        onMessage={onMessage}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.headerIconLeft}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
        ) : isOwnProfile ? (
          <TouchableOpacity style={styles.headerIconLeft}>
            <UserPlus size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onBack} style={styles.headerIconLeft}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.username}>{currentUserData.displayName || currentUserData.username}</Text>
          <ChevronDown size={14} color="#000" style={{ marginTop: 2 }} />
        </View>

        <View style={styles.headerRight}>
          {isOwnProfile && !onBack ? (
            <>
              <TouchableOpacity onPress={() => setSettingsPath(['digital_wellbeing'])} style={styles.headerIcon}>
                <Umbrella size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSettingsPath(['settings'])} style={styles.headerIcon}>
                <Menu size={24} color="#000" />
              </TouchableOpacity>
            </>
          ) : !isOwnProfile ? (
            <TouchableOpacity style={styles.headerIcon}>
              <MoreHorizontal size={24} color="#000" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={displayVideos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: currentUserData.avatarUrl }} style={styles.avatar} />
              </View>

              <Text style={styles.handle}>@{currentUserData.username || "jacob_w"}</Text>

              {/* Stats Section */}
              <View style={styles.stats}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setFollowModalType('Following');
                    setShowFollowModal(true);
                  }}
                >
                  <Text style={styles.statVal}>{currentUserData.followingCount || 0}</Text>
                  <Text style={styles.statLab}>Following</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setFollowModalType('Followers');
                    setShowFollowModal(true);
                  }}
                >
                  <Text style={styles.statVal}>{currentUserData.followersCount || 0}</Text>
                  <Text style={styles.statLab}>Followers</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statVal}>{totalLikes || 0}</Text>
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
              <TouchableOpacity
                style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
                onPress={() => setActiveTab('videos')}
              >
                <Grid size={24} color={activeTab === 'videos' ? "#000" : "#ccc"} />
              </TouchableOpacity>

              {isOwnProfile && (
                <>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'locked' && styles.tabActive]}
                    onPress={() => setActiveTab('locked')}
                  >
                    <Bookmark size={24} color={activeTab === 'locked' ? "#000" : "#ccc"} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
                    onPress={() => setActiveTab('liked')}
                  >
                    <Heart size={24} color={activeTab === 'liked' ? "#000" : "#ccc"} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectVideo && onSelectVideo(item)}
            style={{ width: COL_WIDTH, aspectRatio: 9 / 16, marginBottom: 2, marginRight: 2, backgroundColor: '#f0f0f0' }}
          >
            {item.thumbUrl && <Image source={{ uri: item.thumbUrl }} style={{ flex: 1 }} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loadingVideos ? (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Text style={{ color: '#999' }}>
                {activeTab === 'liked' ? "No liked videos" :
                  activeTab === 'locked' ? "No saved videos" :
                    "No videos yet"}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Follow List Modal */}
      <FollowListModal
        visible={showFollowModal}
        title={followModalType}
        userId={currentUserData.uid}
        onClose={() => setShowFollowModal(false)}
        onUserPress={(user) => {
          // Navigate to user profile
          setViewingProfile(user);
        }}
      />
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0', position: 'relative',
  },
  headerIconLeft: { minWidth: 40, zIndex: 1, },
  headerRight: { flexDirection: 'row', alignItems: 'center', minWidth: 40, justifyContent: 'flex-end', gap: 15, zIndex: 1, },
  headerIcon: { padding: 2 },
  titleWrap: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
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
  editBtn: { flex: 1, borderWidth: 1, borderColor: '#e1e1e1', height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  editBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  bookmarkBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  followBtn: { flex: 1, backgroundColor: '#fe2c55', height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  followBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e1e1' },
  followingBtnText: { color: '#000' },
  messageBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  moreBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  bio: { fontSize: 14, color: '#000', marginTop: 8, paddingHorizontal: 30, textAlign: 'center' },
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
