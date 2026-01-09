
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, Plus, Mic, Smile, Image as ImageIcon, Flag, ChevronDown, Camera } from 'lucide-react-native';
import { Chat } from '../types/type';
import { MOCK_CHATS } from '../constants';

interface ChatViewProps {
  onChatDetailChange?: (isInDetail: boolean) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onChatDetailChange }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // Notify parent when entering/leaving chat detail
  useEffect(() => {
    onChatDetailChange?.(selectedChat !== null);
  }, [selectedChat, onChatDetailChange]);

  if (selectedChat) {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.headerBtn}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Image source={{ uri: selectedChat.otherUser.avatarUrl }} style={styles.headerAvatar} />
            <View>
              <Text style={styles.headerUser}>{selectedChat.otherUser.username}</Text>
              <Text style={styles.headerStatus}>Active 11m ago</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Flag color="#000" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
          <Text style={styles.dateSeparator}>Nov 30, 2023, 9:41 AM</Text>
          
          <View style={[styles.msgWrapper, styles.msgMe]}>
            <View style={styles.msgBubbleMe}>
              <Text style={styles.msgTextMe}>Hey! Check this out.</Text>
            </View>
          </View>

          <View style={[styles.msgWrapper, styles.msgOther]}>
            <Image source={{ uri: selectedChat.otherUser.avatarUrl }} style={styles.msgAvatar} />
            <View style={styles.msgBubbleOther}>
              <Text style={styles.msgTextOther}>That looks amazing! How did you do that?</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputInner}>
            <TextInput placeholder="Message..." placeholderTextColor="#999" style={styles.textInput} />
            <View style={styles.inputIcons}>
              <Mic size={20} color="#888" />
              <Smile size={20} color="#888" />
              <ImageIcon size={20} color="#888" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <View style={{ width: 40 }} />
        <TouchableOpacity style={styles.titleWrapper}>
          <Text style={styles.listTitle}>Direct messages</Text>
          <ChevronDown size={14} color="#000" strokeWidth={3} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatsList}>
        <View style={styles.activityRow}>
          <TouchableOpacity style={styles.actItem}>
            <View style={styles.actPlus}><Plus color="#888" size={20}/></View>
            <Text style={styles.actName}>Create</Text>
          </TouchableOpacity>
          {MOCK_CHATS.map((c, i) => (
            <View key={i} style={styles.actItem}>
              <Image source={{ uri: c.otherUser.avatarUrl }} style={styles.actAvatar} />
              <Text style={styles.actName}>{c.otherUser.username}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Messages</Text>
        
        {MOCK_CHATS.map((chat) => (
          <TouchableOpacity 
            key={chat.id} 
            style={styles.chatRow}
            onPress={() => setSelectedChat(chat as Chat)}
          >
            <Image source={{ uri: chat.otherUser.avatarUrl }} style={styles.rowAvatar} />
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={styles.rowUser}>{chat.otherUser.username}</Text>
                <Text style={styles.rowTime}>2h</Text>
              </View>
              <Text style={styles.rowMsg} numberOfLines={1}>{chat.lastMessage}</Text>
            </View>
            <Camera size={20} color="#ddd" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  detailContainer: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9'
  },
  headerBtn: { padding: 4 },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerUser: { fontWeight: '700', fontSize: 15, color: '#000' },
  headerStatus: { fontSize: 11, color: '#888' },
  messagesList: { flex: 1, padding: 15 },
  dateSeparator: { textAlign: 'center', fontSize: 11, color: '#bbb', marginVertical: 20, fontWeight: '700' },
  msgWrapper: { marginBottom: 15, flexDirection: 'row' },
  msgMe: { justifyContent: 'flex-end' },
  msgOther: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, alignSelf: 'flex-end' },
  msgBubbleMe: { backgroundColor: '#00a8e1', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderBottomRightRadius: 2, maxWidth: '80%' },
  msgBubbleOther: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 2, maxWidth: '80%' },
  msgTextMe: { color: '#fff', fontSize: 15 },
  msgTextOther: { color: '#000', fontSize: 15 },
  inputBar: { padding: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 30 },
  inputInner: { backgroundColor: '#f1f1f2', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  textInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#000' },
  inputIcons: { flexDirection: 'row', marginLeft: 10, gap: 10 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  titleWrapper: { flexDirection: 'row', alignItems: 'center' },
  listTitle: { fontSize: 17, fontWeight: '700', marginRight: 4, color: '#000' },
  chatsList: { flex: 1 },
  activityRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  actItem: { alignItems: 'center', marginRight: 20 },
  actPlus: { width: 60, height: 60, borderRadius: 30, borderStyle: 'dashed', borderWidth: 2, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  actAvatar: { width: 60, height: 60, borderRadius: 30 },
  actName: { fontSize: 11, marginTop: 6, color: '#555' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', paddingHorizontal: 15, marginTop: 20, marginBottom: 10 },
  chatRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  rowAvatar: { width: 56, height: 56, borderRadius: 28 },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowUser: { fontWeight: '700', fontSize: 15, color: '#000' },
  rowTime: { fontSize: 12, color: '#aaa' },
  rowMsg: { color: '#888', fontSize: 14 }
});

export default ChatView;
