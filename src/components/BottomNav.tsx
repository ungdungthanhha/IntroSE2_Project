
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react-native';
import { AppTab } from '../types/type';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const isHome = activeTab === AppTab.HOME;

  const getIconColor = (tab: AppTab) => {
    if (activeTab === tab) return isHome ? '#fff' : '#000';
    return isHome ? 'rgba(255,255,255,0.6)' : '#aaa';
  };

  return (
    <View style={[styles.container, !isHome && styles.containerLight]}>
      <TouchableOpacity onPress={() => setActiveTab(AppTab.HOME)} style={styles.tab}>
        <Home size={28} color={getIconColor(AppTab.HOME)} strokeWidth={activeTab === AppTab.HOME ? 2.5 : 2} />
        <Text style={[styles.label, { color: getIconColor(AppTab.HOME) }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab(AppTab.DISCOVER)} style={styles.tab}>
        <Compass size={28} color={getIconColor(AppTab.DISCOVER)} />
        <Text style={[styles.label, { color: getIconColor(AppTab.DISCOVER) }]}>Discover</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab(AppTab.UPLOAD)} style={styles.uploadTab}>
        <View style={styles.uploadBtn}>
          {/* <View style={[styles.uploadBg, isHome ? { backgroundColor: '#fff' } : { backgroundColor: '#000' }]} /> */}
          <View style={[styles.uploadBgContainer, !isHome && { opacity: 0.4 }]}>
            <View style={[styles.uploadBgHalf, { backgroundColor: '#69C9D0', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]} />
            <View style={[styles.uploadBgHalf, { backgroundColor: '#EE1D52', borderTopRightRadius: 8, borderBottomRightRadius: 8 }]} />
          </View>
          <View style={styles.uploadInner}>
            <Plus size={24} color="#000" strokeWidth={3} />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab(AppTab.INBOX)} style={styles.tab}>
        <MessageSquare size={28} color={getIconColor(AppTab.INBOX)} />
        <Text style={[styles.label, { color: getIconColor(AppTab.INBOX) }]}>Inbox</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab(AppTab.PROFILE)} style={styles.tab}>
        <User size={28} color={getIconColor(AppTab.PROFILE)} />
        <Text style={[styles.label, { color: getIconColor(AppTab.PROFILE) }]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 25,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  containerLight: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tab: { alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  uploadTab: { justifyContent: 'center', marginTop: -4 },
  uploadBtn: { width: 50, height: 32, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  uploadBgContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row', // Xếp 2 nửa nằm ngang
    borderRadius: 8,
    overflow: 'hidden' // Để 2 nửa màu không bị tràn ra khỏi góc bo tròn
  },
  uploadBgHalf: {
    flex: 1, // Mỗi nửa chiếm 50% chiều rộng
    height: '100%'
  },
  uploadBg: { position: 'absolute', width: '100%', height: '100%', opacity: 0.4, borderRadius: 8 },
  uploadInner: { width: 40, height: 32, backgroundColor: '#fff', borderRadius: 6, alignItems: 'center', justifyContent: 'center', zIndex: 2 }
});

export default BottomNav;
