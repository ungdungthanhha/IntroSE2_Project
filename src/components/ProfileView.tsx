
import React from 'react';
// Fix: Switch to 'react-native' for correct Dimensions and component property types
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Grid3x3 as Grid, ChevronLeft, ChevronDown, UserPlus, Heart } from 'lucide-react-native';
import { User, Video } from '../types';

const { width } = Dimensions.get('window');
const COL_WIDTH = width / 3;

interface ProfileViewProps {
  user: User;
  userVideos: Video[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, userVideos }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><ChevronLeft size={28} /></TouchableOpacity>
        <TouchableOpacity style={styles.titleWrap}>
          <Text style={styles.username}>{user.username}</Text>
          <ChevronDown size={14} />
        </TouchableOpacity>
        <TouchableOpacity><UserPlus size={24} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.handle}>@{user.username}</Text>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{user.followingCount}</Text>
              <Text style={styles.statLab}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{user.followersCount.toLocaleString()}</Text>
              <Text style={styles.statLab}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>91</Text>
              <Text style={styles.statLab}>Likes</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.btnText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secBtn}>
              <ChevronDown size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <View style={[styles.tab, styles.tabActive]}>
            <Grid size={24} color="#000" />
          </View>
          <View style={styles.tab}>
            <Heart size={24} color="#ccc" />
          </View>
        </View>

        <View style={styles.grid}>
          {userVideos.map((video) => (
            <TouchableOpacity key={video.id} style={styles.gridItem}>
              <Image source={{ uri: `https://picsum.photos/seed/${video.id}/300/400` }} style={styles.gridImg} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  titleWrap: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 17, fontWeight: '700', marginRight: 4 },
  profileInfo: { alignItems: 'center', paddingVertical: 20 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#eee', padding: 2 },
  avatar: { width: '100%', height: '100%', borderRadius: 45 },
  handle: { fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 20 },
  stats: { flexDirection: 'row', marginBottom: 25 },
  statItem: { alignItems: 'center', marginHorizontal: 15 },
  statVal: { fontSize: 18, fontWeight: '700' },
  statLab: { fontSize: 13, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', width: '100%', paddingHorizontal: 40 },
  primaryBtn: { flex: 1, backgroundColor: '#fe2c55', height: 44, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  // Fix: Changed borderWeight to borderWidth
  secBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#eee', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: COL_WIDTH, height: COL_WIDTH * 1.33, padding: 0.5 },
  gridImg: { width: '100%', height: '100%', backgroundColor: '#eee' }
});

export default ProfileView;
