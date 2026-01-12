
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Plus, Mic, Smile, Image as ImageIcon, Flag, ChevronDown, Camera, Send } from 'lucide-react-native';
import { Chat, Message, User } from '../types/type';
import * as chatService from '../services/chatService';
import * as userService from '../services/userService';

interface ChatViewProps {
  onChatDetailChange?: (isInDetail: boolean) => void;
  currentUser: User;
}

const ChatView: React.FC<ChatViewProps> = ({ onChatDetailChange, currentUser }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);

  // Notify parent when entering/leaving chat detail
  useEffect(() => {
    onChatDetailChange?.(selectedChat !== null);
  }, [selectedChat, onChatDetailChange]);

  // Subscribe chats
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoadingChats(true);
    const unsub = chatService.subscribeChats(currentUser.uid, (list) => {
      setChats(list);
      setLoadingChats(false);
    });
    return () => unsub && unsub();
  }, [currentUser?.uid]);

  // Attach otherUser info if missing
  useEffect(() => {
    const missing = chats.filter((c) => !c.otherUser || !c.otherUser.username);
    if (!missing.length) return;

    const fill = async () => {
      const updated = await Promise.all(chats.map(async (c) => {
        if (c.otherUser && c.otherUser.username) return c;
        const otherId = c.participants.find((p) => p !== currentUser.uid);
        if (!otherId) return c;
        const other = await userService.getUserById(otherId);
        if (!other) return c;
        return { ...c, otherUser: other } as Chat;
      }));
      setChats(updated);
    };

    fill();
  }, [chats, currentUser.uid]);

  // Subscribe messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    const unsub = chatService.subscribeMessages(selectedChat.id, (list) => {
      setMessages(list);
      setLoadingMessages(false);
    });
    return () => unsub && unsub();
  }, [selectedChat]);

  const handleSend = async () => {
    if (!selectedChat) return;
    const text = input.trim();
    if (!text) return;
    setInput('');
    await chatService.sendMessage(selectedChat.id, currentUser, text, selectedChat.otherUser as User);
  };

  const selectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  if (!currentUser?.uid) {
    return (
      <View style={styles.centered}><Text>Please login to use chat.</Text></View>
    );
  }

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
          {loadingMessages ? (
            <ActivityIndicator size="small" color="#fe2c55" />
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser.uid;
              return (
                <View key={m.id} style={[styles.msgWrapper, isMe ? styles.msgMe : styles.msgOther]}>
                  {!isMe && <Image source={{ uri: selectedChat.otherUser.avatarUrl }} style={styles.msgAvatar} />}
                  <View style={isMe ? styles.msgBubbleMe : styles.msgBubbleOther}>
                    <Text style={isMe ? styles.msgTextMe : styles.msgTextOther}>{m.text}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <View style={styles.inputInner}>
              <TextInput
                placeholder="Message..."
                placeholderTextColor="#999"
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <View style={styles.inputIcons}>
                <TouchableOpacity onPress={handleSend}>
                  <Send size={20} color={input ? '#fe2c55' : '#888'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
          {chats.map((c) => (
            <View key={c.id} style={styles.actItem}>
              <Image source={{ uri: c.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.actAvatar} />
              <Text style={styles.actName}>{c.otherUser?.username || 'User'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Messages</Text>
        {loadingChats && <ActivityIndicator size="small" color="#fe2c55" style={{ marginVertical: 10 }} />}
        {!loadingChats && chats.length === 0 && (
          <Text style={{ paddingHorizontal: 15, color: '#888' }}>No messages yet</Text>
        )}
        {chats.map((chat) => (
          <TouchableOpacity 
            key={chat.id} 
            style={styles.chatRow}
            onPress={() => selectChat(chat)}
          >
            <Image source={{ uri: chat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.rowAvatar} />
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={styles.rowUser}>{chat.otherUser?.username || 'User'}</Text>
                <Text style={styles.rowTime}></Text>
              </View>
              <Text style={styles.rowMsg} numberOfLines={1}>{chat.lastMessage || ''}</Text>
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
  rowMsg: { color: '#888', fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});

export default ChatView;
