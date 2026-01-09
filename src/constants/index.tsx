import { Video } from '../types/type';

export const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    ownerUid: 'user1',
    ownerName: 'nature_vibe', // Chỉnh từ username -> ownerName
    ownerAvatar: 'https://picsum.photos/seed/user1/200/200', // userAvatar -> ownerAvatar
    videoUrl: 'https://res.cloudinary.com/dvzhdawxp/video/upload/v1767858412/samples/elephants.mp4',
    caption: 'Nature is healing 🌿✨ #nature #peace #vibe', // description -> caption
    likesCount: 12400,
    commentsCount: 856,
    savesCount: 120, // Bổ sung savesCount
    timestamp: Date.now() - 1000000, // Chỉnh createdAt (string) -> timestamp (number)
  },
  {
    id: '2',
    ownerUid: 'user2',
    ownerName: 'urban_explorer',
    ownerAvatar: 'https://picsum.photos/seed/user2/200/200',
    videoUrl: 'https://res.cloudinary.com/dvzhdawxp/video/upload/v1767858410/samples/sea-turtle.mp4',
    caption: 'City lights at 3 AM. No sleep in the neon world 🏙️🔋',
    likesCount: 8900,
    commentsCount: 432,
    savesCount: 89,
    timestamp: Date.now() - 2000000,
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
