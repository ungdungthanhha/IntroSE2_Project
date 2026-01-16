
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { ArrowLeft, Plus, Mic, Smile, Image as ImageIcon, Flag, Send, Bell, MoreVertical } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat, Message, User, Video as VideoType } from '../types/type';
import * as chatService from '../services/chatService';
import * as userService from '../services/userService';
import * as notificationService from '../services/notificationService';
import ActivityView from './ActivityView';
import FollowListModal from './FollowListModal';

interface ChatViewProps {
  onChatDetailChange?: (isInDetail: boolean) => void;
  currentUser: User;
  onSelectUser: (user: Partial<User>) => void;
  onSelectVideo: (video: VideoType) => void;
  startChatWithUser?: User | null;
  onChatOpened?: () => void;
}

type InboxTab = 'activity' | 'messages';

const ChatView: React.FC<ChatViewProps> = ({
  onChatDetailChange,
  currentUser,
  onSelectUser,
  onSelectVideo,
  startChatWithUser,
  onChatOpened
}) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<InboxTab>('messages');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  // Handle startChatWithUser prop
  useEffect(() => {
    const initChat = async () => {
      console.log("ChatView: initChat triggered", { startChatWithUser, currentUser: currentUser?.uid });
      if (startChatWithUser && currentUser) {
        // Switch to messages tab first
        setActiveTab('messages');

        // Check if we already have a chat with this user
        setIsLoadingChat(true);
        try {
          const chat = await chatService.getOrCreateChat(currentUser, startChatWithUser);

          // Correct the otherUser using chat.id parsing
          console.log("ChatView: getOrCreateChat result:", chat);
          let finalChat = chat;
          const parts = chat.id.split('_');
          const otherId = parts.find(p => p !== currentUser.uid);

          if (otherId && (!chat.otherUser || chat.otherUser.uid === currentUser.uid)) {
            const correctOther = await userService.getUserById(otherId);
            if (correctOther) {
              finalChat = { ...chat, otherUser: correctOther };
            }
          }

          setSelectedChat(finalChat);
          if (onChatOpened) onChatOpened();
        } catch (error) {
          console.error("Error starting chat:", error);
        } finally {
          setIsLoadingChat(false);
        }
      }
    };
    initChat();
  }, [startChatWithUser, currentUser]);



  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

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

  // Attach correct otherUser info using chat.id parsing
  useEffect(() => {
    if (!chats || chats.length === 0 || !currentUser.uid) return;

    const fill = async () => {
      const updated = await Promise.all(chats.map(async (c) => {
        // Always parse otherId from chat.id (format: uid1_uid2, sorted)
        const parts = c.id.split('_');
        const otherId = parts.find(p => p !== currentUser.uid);

        // If no otherId found, keep original
        if (!otherId) return c;

        // If c.otherUser already matches otherId, keep it
        if (c.otherUser && c.otherUser.uid === otherId) {
          return c;
        }

        // Otherwise, fetch the correct user info
        const other = await userService.getUserById(otherId);
        if (!other) return c;

        return { ...c, otherUser: other } as Chat;
      }));

      // Only update if there are actual changes
      const needsUpdate = updated.some((u, i) => u.otherUser?.uid !== chats[i].otherUser?.uid);
      if (needsUpdate) {
        setChats(updated);
      }
    };

    fill();
  }, [chats, currentUser.uid]);



  // Sync selectedChat with latest data from chats list (to get corrected otherUser)
  useEffect(() => {
    if (selectedChat) {
      const updatedChat = chats.find(c => c.id === selectedChat.id);
      if (updatedChat && updatedChat !== selectedChat) {
        // Only update if reference changed (meaning data potentially updated)
        setSelectedChat(updatedChat);
      }
    }
  }, [chats]);

  // Subscribe messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    // Mark as read immediately
    if (currentUser?.uid) {
      chatService.markChatRead(selectedChat.id, currentUser.uid);
    }

    setLoadingMessages(true);
    const unsub = chatService.subscribeMessages(selectedChat.id, (list) => {
      setMessages(list);
      setLoadingMessages(false);
      // Also mark read when new messages arrive while open? 
      // Yes, if we are viewing it.
      if (currentUser?.uid) {
        chatService.markChatRead(selectedChat.id, currentUser.uid);
      }
    });
    return () => unsub && unsub();
  }, [selectedChat?.id]);

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
    if (!input.trim() || !selectedChat) return;
    const text = input;
    setInput('');
    // Pass otherUser (casted to User) to ensure unread count is incremented
    await chatService.sendMessage(selectedChat.id, currentUser, text, selectedChat.otherUser as User);
  };

  const selectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const goBackToMessages = () => {
    setSelectedChat(null);
  };

  console.log("ChatView Render: selectedChat ID =", selectedChat?.id, "otherUser =", selectedChat?.otherUser?.username);

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
    return (
      <ActivityView
        currentUser={currentUser}
        onBack={() => setActiveTab('messages')}
        onSelectUser={onSelectUser}
        onSelectVideo={onSelectVideo}
      />
    );
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
            <TouchableOpacity onPress={() => selectedChat.otherUser && onSelectUser(selectedChat.otherUser)}>
              <Image source={{ uri: selectedChat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.chatHeaderAvatar} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectedChat.otherUser && onSelectUser(selectedChat.otherUser)}>
              <Text style={styles.chatHeaderName}>{selectedChat.otherUser?.username || 'User'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Alert.alert(
                "Chat Settings",
                "Manage this conversation",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Conversation",
                    style: "destructive",
                    onPress: async () => {
                      if (!selectedChat) return;
                      Alert.alert(
                        "Confirm Delete",
                        "This will hide the conversation from your list.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await chatService.deleteChatForUser(selectedChat.id, currentUser.uid);
                                setSelectedChat(null);
                              } catch (e) {
                                Alert.alert("Error", "Could not delete chat");
                              }
                            }
                          }
                        ]
                      );
                    }
                  },
                  { text: "Report", onPress: () => Alert.alert("Report", "Report feature coming soon.") },
                  { text: "Block User", onPress: () => Alert.alert("Block", "Block feature coming soon.") }
                ]
              );
            }}
          >
            <MoreVertical color="#000" size={24} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.messagesContent}>
          {loadingMessages ? (
            <ActivityIndicator size="small" color="#00d4ff" style={{ marginTop: 20 }} />
          ) : (
            (() => {
              // Derive user IDs from chat.id (format: uid1_uid2, sorted)
              const chatIdParts = selectedChat.id.split('_');
              // Find which part of the chat ID matches the current user
              const myUidFromChat = chatIdParts.find(uid => uid === currentUser.uid);

              // 1. Filter visible messages first
              const visibleMessages = messages.filter(m => {
                // Filter out messages deleted for me
                if (m.deletedFor?.includes(currentUser.uid)) return false;
                // Filter out messages cleared by "Delete Conversation"
                const clearedTime = selectedChat.clearedTimestamps?.[currentUser.uid] || 0;
                if (m.timestamp <= clearedTime) return false;
                return true;
              });

              return visibleMessages.map((m, index) => {
                // Use senderId matched against myUidFromChat (derived from chat ID)
                const isMe = myUidFromChat ? m.senderId === myUidFromChat : m.senderId === currentUser.uid;

                // 2. Check for Date Separator
                let showDate = false;
                const currentDate = new Date(m.timestamp);

                if (index === 0) {
                  showDate = true;
                } else {
                  const prevDate = new Date(visibleMessages[index - 1].timestamp);
                  if (currentDate.getDate() !== prevDate.getDate() ||
                    currentDate.getMonth() !== prevDate.getMonth() ||
                    currentDate.getFullYear() !== prevDate.getFullYear()) {
                    showDate = true;
                  }
                }

                // Format Separator Date
                const dateText = currentDate.getDate() === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear()
                  ? 'Today' : currentDate.toLocaleDateString();

                return (
                  <View key={m.id || index}>
                    {showDate && (
                      <View style={styles.dateSeparator}>
                        <Text style={styles.dateSeparatorText}>{dateText}</Text>
                      </View>
                    )}
                    <View style={[styles.msgWrapper, isMe ? styles.msgMe : styles.msgOther]}>
                      {!isMe && (
                        <TouchableOpacity onPress={() => selectedChat.otherUser && onSelectUser(selectedChat.otherUser)}>
                          <Image source={{ uri: selectedChat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.msgAvatar} />
                        </TouchableOpacity>
                      )}
                      <View style={isMe ? styles.msgBubbleMe : styles.msgBubbleOther}>
                        <Text style={isMe ? styles.msgTextMe : styles.msgTextOther}>{m.text}</Text>
                        <Text style={[styles.msgTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: 'rgba(0,0,0,0.5)' }]}>
                          {(() => {
                            const d = new Date(m.timestamp);
                            const now = new Date();
                            const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                            return isToday
                              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : `${d.getDate()}/${d.getMonth() + 1} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          })()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              });
            })()
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
                onSubmitEditing={() => selectedChat.otherUser && handleSend()}
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
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowNewChatModal(true)}>
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
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: '#fe2c55', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 }}
            onPress={() => setShowNewChatModal(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Chat List
        <ScrollView style={styles.chatsList}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatRow}
              onPress={() => selectChat(chat)}
              onLongPress={() => {
                Alert.alert(
                  "Delete Conversation",
                  "Are you sure you want to delete this conversation?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await chatService.deleteChatForUser(chat.id, currentUser.uid);
                          // Optimistic update handled by snapshot subscription filter
                        } catch (e) {
                          Alert.alert("Error", "Could not delete chat");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Image source={{ uri: chat.otherUser?.avatarUrl || 'https://picsum.photos/200' }} style={styles.rowAvatar} />
              <View style={styles.rowInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.rowUser}>{chat.otherUser?.username || 'User'}</Text>
                  {chat.unreadCounts?.[currentUser.uid] ? (
                    <View style={{ backgroundColor: 'red', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{chat.unreadCounts[currentUser.uid]}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.rowMsg, (chat.unreadCounts?.[currentUser.uid] || 0) > 0 && { fontWeight: 'bold', color: '#000' }]} numberOfLines={1}>
                  {chat.lastMessage || 'Tap to start chatting'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* New Chat Modal */}
      <FollowListModal
        visible={showNewChatModal}
        title="Friends"
        enableTabs={true}
        userId={currentUser.uid}
        onClose={() => setShowNewChatModal(false)}
        onUserPress={async (user) => {
          setShowNewChatModal(false);
          setIsLoadingChat(true);
          try {
            const chat = await chatService.getOrCreateChat(currentUser, user);
            setSelectedChat(chat);
          } catch (error) {
            console.error("Error creating chat:", error);
          } finally {
            setIsLoadingChat(false);
          }
        }}
      />
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
    width: '100%',
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
    paddingVertical: 12,
    borderRadius: 22,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  msgBubbleOther: {
    backgroundColor: '#f1f1f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
  },
  msgTextMe: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  msgTextOther: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
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

  // Date Separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
    marginBottom: 12,
  },
  dateSeparatorText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default ChatView;
