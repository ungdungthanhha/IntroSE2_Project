import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Dimensions, StatusBar, Keyboard, ScrollView 
} from 'react-native';
import { getTrendingKeywords, trackSearch } from '../services/searchService';
import { Image } from 'react-native'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Clock, TrendingUp, ArrowUpLeft, ChevronLeft } from 'lucide-react-native';
import Video from 'react-native-video'; 
import { User, Video as VideoType } from '../types/type';

// IMPORT HÀM LƯU TRỮ VỪA VIẾT
import { getSearchHistory, saveSearchKeyword, removeSearchKeyword } from '../utils/SearchStorage';

const { width } = Dimensions.get('window');
const COL_WIDTH = (width - 24) / 2;

// --- Trending vẫn giả lập (hoặc gọi API sau này) ---
const MOCK_TRENDING = ["Mèo cute", "Biến hình", "Review phim", "Nhạc remix", "Bóng đá"];

interface SearchViewProps {
  allVideos: VideoType[];
  onBack: () => void;
  onSelectVideo: (video: VideoType) => void;
  onSelectUser: (user: Partial<User>) => void; 
}

type ViewState = 'default' | 'typing' | 'results';

const SearchView: React.FC<SearchViewProps> = ({ allVideos, onBack, onSelectVideo, onSelectUser }) => {
  const insets = useSafeAreaInsets();
  
  // States
  const [searchText, setSearchText] = useState('');
  const [viewState, setViewState] = useState<ViewState>('default');
  
  // Sửa: Mặc định là mảng rỗng, sẽ load từ máy lên sau
  const [history, setHistory] = useState<string[]>([]);

  const [trendingList, setTrendingList] = useState<string[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  
  const [filteredVideos, setFilteredVideos] = useState<VideoType[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // --- EFFECT: LOAD LỊCH SỬ KHI MỞ MÀN HÌNH ---
  useEffect(() => {
    loadHistoryData();
    fetchTrending();
  }, []);

  const loadHistoryData = async () => {
    const savedHistory = await getSearchHistory();
    setHistory(savedHistory);
  };

  const fetchTrending = async () => {
    setLoadingTrending(true);
    const data = await getTrendingKeywords();
    setTrendingList(data);
    setLoadingTrending(false);
  };
  // ---------------------------------------------

  // 1. Xử lý khi gõ chữ (Logic gợi ý giữ nguyên)
  // --- XỬ LÝ GỢI Ý TỪ KHÓA (AUTO-COMPLETE) ---
  const handleTextChange = (text: string) => {
    setSearchText(text);
    const cleanInput = text.toLowerCase().trim();

    if (cleanInput.length === 0) {
      setViewState('default');
      setSuggestions([]);
    } else {
      setViewState('typing');

      // 1. Tạo một Set để lưu từ khóa (giúp tự động loại bỏ trùng lặp)
      const collectedSuggestions = new Set<string>();

      // 2. Duyệt qua tất cả video để "đào" từ khóa
      allVideos.forEach(video => {
        const caption = video.caption ? video.caption.toLowerCase() : "";
        
        // --- KỸ THUẬT TÁCH TỪ ---
        // Loại bỏ ký tự đặc biệt (chấm, phẩy, icon...), chỉ giữ lại chữ cái và số
        // Regex này giữ cả tiếng Việt có dấu
        const cleanCaption = caption.replace(/[^\w\s\u00C0-\u1EF9]/g, ' '); 
        
        // Tách câu thành mảng các từ: "mèo cute lắm" -> ["mèo", "cute", "lắm"]
        const words = cleanCaption.split(/\s+/);

        // Duyệt qua từng từ trong câu
        for (let i = 0; i < words.length; i++) {
          const word = words[i];

          // Nếu từ này BẮT ĐẦU bằng từ bạn gõ
          if (word.startsWith(cleanInput)) {
            
            // OPTION A: Chỉ lấy 1 từ đơn (VD: "mèo")
            collectedSuggestions.add(word);

            // OPTION B (Nâng cao): Lấy cụm 2 từ để gợi ý thông minh hơn
            // Ví dụ: Caption là "mèo cute lắm", bạn gõ "me" -> Gợi ý "mèo cute"
            if (i + 1 < words.length) {
              const nextWord = words[i + 1];
              collectedSuggestions.add(`${word} ${nextWord}`);
            }
          }
        }
      });

      // 3. Kết hợp thêm với danh sách Trending (nếu từ khóa Trending cũng khớp)
      // Giúp gợi ý phong phú hơn
      trendingList.forEach(trend => {
        if (trend.toLowerCase().startsWith(cleanInput)) {
           collectedSuggestions.add(trend);
        }
      });

      // 4. Chuyển Set thành Array và lấy 10 kết quả đầu tiên
      const finalSuggestions = Array.from(collectedSuggestions).slice(0, 10);
      setSuggestions(finalSuggestions);
    }
  };

  // 2. Xử lý hành động TÌM KIẾM (Cập nhật logic lưu)
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) return; // Không tìm chuỗi rỗng

    Keyboard.dismiss();
    setSearchText(keyword);
    setViewState('results'); 

    // --- LƯU LỊCH SỬ THẬT ---
    const updatedHistory = await saveSearchKeyword(keyword);
    setHistory(updatedHistory); 

    // 2. [MỚI] Gửi lên Server để tính điểm Trending
    trackSearch(keyword); // Không cần await để đỡ phải chờ

    // Logic lọc video (như cũ)
    const lowerKey = keyword.toLowerCase();
    const results = allVideos.filter(video => 
      (video.caption && video.caption.toLowerCase().includes(lowerKey)) ||
      (video.ownerName && video.ownerName.toLowerCase().includes(lowerKey))
    );
    setFilteredVideos(results);
  };

  // 3. Xóa 1 dòng lịch sử thật
  const handleRemoveHistoryItem = async (itemToRemove: string) => {
    const updatedHistory = await removeSearchKeyword(itemToRemove);
    setHistory(updatedHistory);
  };

  // --- RENDER VIEW MẶC ĐỊNH ---
  const renderDefaultView = () => (
    <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
      {/* Phần Lịch sử */}
      {history.length > 0 && (
        <View style={styles.section}>
          <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems:'center'}}>
             <Text style={styles.sectionTitle}>History</Text>
             {/* Nút xóa tất cả nếu muốn làm thêm */}
          </View>
          
          {history.map((item, index) => (
            <View key={index} style={styles.rowItem}>
              <TouchableOpacity style={styles.rowContent} onPress={() => handleSearch(item)}>
                <Clock size={16} color="#888" />
                <Text style={styles.rowText}>{item}</Text>
              </TouchableOpacity>
              
              {/* Nút xóa từng cái */}
              <TouchableOpacity onPress={() => handleRemoveHistoryItem(item)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <X size={16} color="#ccc" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 2. Phần Trending: BỌC ĐIỀU KIỆN ĐỂ ẨN NẾU RỖNG */}
      {trendingList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          
          <View style={styles.trendingList}>
            {trendingList.map((item, index) => (
              <TouchableOpacity key={index} style={styles.trendingItem} onPress={() => handleSearch(item)}>
                {/* Chấm đỏ */}
                <View style={styles.trendingDot} />
                
                <Text style={styles.trendingText}>{item}</Text>
                
                {/* Nhãn HOT */}
                <View style={styles.trendingLabel}>
                  <Text style={{fontSize: 10, color: '#fe2c55'}}>Hot</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Nếu đang loading thì có thể hiện cái xoay nhẹ, hoặc ẩn luôn tùy bạn */}
      {loadingTrending && trendingList.length === 0 && (
         <View style={{marginTop: 20}}>
            {/* Để trống hoặc hiện loading */}
         </View>
      )}
    </ScrollView>
  );

  // ... (Giữ nguyên renderSuggestions, renderResults và return chính của component)
  // Chỉ cần thay thế phần renderDefaultView và logic handleSearch ở trên là xong.
  
  const renderSuggestions = () => (
    <FlatList
      data={suggestions}
      keyExtractor={(item, index) => index.toString()}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.rowItem, { paddingHorizontal: 16 }]} onPress={() => handleSearch(item)}>
          <Search size={16} color="#333" />
          <Text style={styles.rowText}>{item}</Text>
          <ArrowUpLeft size={16} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}
    />
  );

  const renderResults = () => (
    <FlatList
      data={filteredVideos}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={{ color: '#888' }}>No reuslts</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.cardItem}>
          <View style={styles.cardImgContainer}>
            {item.thumbUrl ? (
              <Image source={{ uri: item.thumbUrl }} style={styles.videoThumb} resizeMode="cover" />
            ) : (
              <Video source={{ uri: item.videoUrl }} style={styles.videoThumb} resizeMode="cover" paused={true} muted={true} controls={false} />
            )}
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => onSelectVideo(item)} activeOpacity={0.7} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardCaption} numberOfLines={2}>{item.caption || "No caption"}</Text>
            <TouchableOpacity style={styles.cardUser} onPress={() => onSelectUser({ uid: item.ownerUid, username: item.ownerName })}>
              <Image source={{ uri: item.ownerAvatar || 'https://via.placeholder.com/50' }} style={styles.miniAvatar} />
              <Text style={styles.cardUserName} numberOfLines={1}>{item.ownerName || "User"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );

  const handleBackPress = () => {
    // Nếu đang ở màn hình kết quả hoặc đang gõ chữ -> Quay về màn hình mặc định
    if (viewState === 'results' || viewState === 'typing') {
      setSearchText('');      // Xóa chữ trong ô tìm kiếm
      setViewState('default'); // Chuyển về trạng thái ban đầu (Lịch sử + Trending)
      Keyboard.dismiss();     // Ẩn bàn phím
    } else {
      // Nếu đang ở màn hình mặc định rồi -> Mới thoát hẳn ra Home
      onBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={{ paddingRight: 10 }}>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Search size={18} color="#888" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Search"
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={handleTextChange}
            onSubmitEditing={() => handleSearch(searchText)}
            autoFocus={true} 
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleTextChange('')}>
              <X size={16} color="#888" style={{ marginRight: 10 }} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => handleSearch(searchText)} style={{ marginLeft: 10 }}>
          <Text style={{ color: '#fe2c55', fontWeight: '600' }}>Search</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        {viewState === 'default' && renderDefaultView()}
        {viewState === 'typing' && renderSuggestions()}
        {viewState === 'results' && renderResults()}
      </View>
    </View>
  );
};

// ... (Giữ nguyên styles như cũ)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f2', borderRadius: 4, height: 38 },
  input: { flex: 1, fontSize: 15, color: '#000', paddingHorizontal: 8, height: '100%', paddingVertical: 0 },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 20 }, // Sửa một chút ở đây cho đẹp
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  rowContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rowText: { fontSize: 14, color: '#333', marginLeft: 10 },
  trendingList: { flexDirection: 'column' },
  trendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fe2c55', // Màu đỏ
    marginRight: 10,
    marginLeft: 2
  },
  trendingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rankCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  trendingText: { fontSize: 15, color: '#333', flex: 1 },
  trendingLabel: { backgroundColor: '#fff2f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardItem: { width: COL_WIDTH, marginBottom: 10, backgroundColor: '#fff' },
  cardImgContainer: { width: '100%', height: COL_WIDTH * 1.5, borderRadius: 4, backgroundColor: '#000', overflow: 'hidden' },
  videoThumb: { width: '100%', height: '100%' },
  cardInfo: { padding: 8, paddingLeft: 4 },
  cardCaption: { color: '#000', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  cardUser: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 6, backgroundColor: '#eee' },
  cardUserName: { color: '#666', fontSize: 12 },
});

export default SearchView;