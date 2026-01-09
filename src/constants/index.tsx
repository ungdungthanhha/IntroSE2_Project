
export const MOCK_VIDEOS = [
  {
    id: '1',
    ownerUid: 'user1',
    ownerName: 'nature_vibe',
    ownerAvatar: 'https://picsum.photos/seed/user1/200/200',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    caption: 'Nature is healing 🌿✨ #nature #peace #vibe',
    likesCount: 12400,
    commentsCount: 856,
    savesCount: 120,
    timestamp: Date.now() - 1000000,
  },
  {
    id: '2',
    ownerUid: 'user2',
    ownerName: 'urban_explorer',
    ownerAvatar: 'https://picsum.photos/seed/user2/200/200',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-city-lighting-at-night-14028-large.mp4',
    caption: 'City lights at 3 AM. No sleep in the neon world 🏙️🔋',
    likesCount: 8900,
    commentsCount: 432,
    savesCount: 89,
    timestamp: Date.now() - 2000000,
  },
  {
    id: '3',
    ownerUid: 'user3',
    ownerName: 'chef_master',
    ownerAvatar: 'https://picsum.photos/seed/user3/200/200',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-pizza-slice-being-lifted-42643-large.mp4',
    caption: 'The perfect slice. Homemade and crusty 🍕🔥 #foodie #pizza',
    likesCount: 25600,
    commentsCount: 1204,
    savesCount: 540,
    timestamp: Date.now() - 500000,
  }
];

export const MOCK_CHATS = [
  {
    id: 'chat1',
    participants: ['me', 'user1'],
    lastMessage: 'Check out this video!',
    timestamp: Date.now(),
    otherUser: {
      username: 'nature_vibe',
      avatarUrl: 'https://picsum.photos/seed/user1/200/200'
    }
  },
  {
    id: 'chat2',
    participants: ['me', 'user3'],
    lastMessage: 'The pizza recipe was fire',
    timestamp: Date.now() - 3600000,
    otherUser: {
      username: 'chef_master',
      avatarUrl: 'https://picsum.photos/seed/user3/200/200'
    }
  }
];
