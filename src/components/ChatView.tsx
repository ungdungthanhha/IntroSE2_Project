
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { ArrowLeft, Plus, Mic, Smile, Image as ImageIcon, Flag, Send, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat, Message, User } from '../types/type';
import * as chatService from '../services/chatService';
import * as userService from '../services/userService';
import * as notificationService from '../services/notificationService';
import ActivityView from './ActivityView';

interface ChatViewProps {
  onChatDetailChange?: (isInDetail: boolean) => void;
  currentUser: User;
}

type InboxTab = 'activity' | 'messages';

const ChatView: React.FC<ChatViewProps> = ({ onChatDetailChange, currentUser }) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<InboxTab>('messages');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  // Notify parent when entering/leaving chat detail
  // Hide bottom nav only when: in chat conversation OR in activity page
  useEffect(() => {
    onChatDetailChange?.(selectedChat !== null || activeTab === 'activity');
  }, [selectedChat, activeTab, onChatDetailChange]);

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
    if (!chats || chats.length === 0) return;
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

  // Subscribe to notifications for badge
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = notificationService.getNotifications(currentUser.uid, (list) => {
      const unread = list.filter(n => !n.isRead).length;
      setUnreadNotiCount(unread);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

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

  const goBackToMessages = () => {
    setSelectedChat(null);
  };

  if (!currentUser?.uid) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />
        <Text>Please login to use chat.</Text>
      </View>
    );
  }

  // Activity View
  if (activeTab === 'activity') {
    return <ActivityView currentUser={currentUser} onBack={() => setActiveTab('messages')} />;
  }

  // Chat Conversation View
  if (selectedChat) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={goBackToMessages} style={styles.headerBtn}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Image source={{ uri: selectedChat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.chatHeaderAvatar} />
            <View>
              <Text style={styles.chatHeaderName}>{selectedChat.otherUser?.username || 'User'}</Text>
              <Text style={styles.chatHeaderStatus}>Active 11m ago</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Flag color="#000" size={20} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.messagesContent}>
          {loadingMessages ? (
            <ActivityIndicator size="small" color="#00d4ff" style={{ marginTop: 20 }} />
          ) : (
            messages.map((m, index) => {
              const isMe = m.senderId === currentUser.uid;
              return (
                <View key={m.id || index}>
                  <View style={[styles.msgWrapper, isMe ? styles.msgMe : styles.msgOther]}>
                    {!isMe && <Image source={{ uri: selectedChat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.msgAvatar} />}
                    <View style={isMe ? styles.msgBubbleMe : styles.msgBubbleOther}>
                      <Text style={isMe ? styles.msgTextMe : styles.msgTextOther}>{m.text}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
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
                <TouchableOpacity style={styles.inputIconBtn}>
                  <Mic size={22} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIconBtn}>
                  <Smile size={22} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIconBtn}>
                  <ImageIcon size={22} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Direct Messages View (Main)
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      {/* Header */}
      <View style={styles.messagesHeader}>
        <TouchableOpacity onPress={() => setActiveTab('activity')} style={styles.headerBtn}>
          <View>
            <Bell color="#000" size={22} />
            {unreadNotiCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotiCount > 99 ? '99+' : unreadNotiCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.messagesTitle}>Direct messages</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Plus color="#000" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loadingChats ? (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
        </View>
      ) : chats.length === 0 ? (
        // Empty State
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Send size={60} color="#ccc" strokeWidth={1} />
          </View>
          <Text style={styles.emptyTitle}>Message your friends</Text>
          <Text style={styles.emptySubtitle}>Share videos or start a conversation</Text>
        </View>
      ) : (
        // Chat List
        <ScrollView style={styles.chatsList}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatRow}
              onPress={() => selectChat(chat)}
            >
              <Image source={{ uri: chat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.rowAvatar} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowUser}>{chat.otherUser?.username || 'User'}</Text>
                <Text style={styles.rowMsg} numberOfLines={1}>{chat.lastMessage || 'Tap to start chatting'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  // Messages Header
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messagesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fe2c55',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Chat Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },

  headerBtn: {
    padding: 8,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Chat List
  chatsList: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rowUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  rowMsg: {
    fontSize: 14,
    color: '#888',
  },

  // Messages
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  msgWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  msgMe: {
    justifyContent: 'flex-end',
  },
  msgOther: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  msgBubbleMe: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '75%',
  },
  msgBubbleOther: {
    backgroundColor: '#f1f1f2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    maxWidth: '75%',
  },
  msgTextMe: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextOther: {
    color: '#000',
    fontSize: 15,
    lineHeight: 20,
  },

  // Input Bar
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  inputInner: {
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 4,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  inputIconBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ChatView;
