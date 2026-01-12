import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  TextInput, ScrollView, Alert, ActivityIndicator, SafeAreaView, Modal, 
  TouchableWithoutFeedback,
  StatusBar
} from 'react-native';
import { ChevronLeft, Camera, ChevronRight, Copy, XCircle } from 'lucide-react-native';
import { User } from '../types/type';
import * as userService from '../services/userService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, Asset, launchCamera } from 'react-native-image-picker';
import EditFieldScreen from './EditFieldScreen';
import Clipboard from '@react-native-clipboard/clipboard';

interface EditProfileViewProps {
  user: User;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: User) => void;
}

const EditProfileView: React.FC<EditProfileViewProps> = ({ user, onClose, onUpdateSuccess }) => {
  // State lưu dữ liệu đang chỉnh sửa
  const [draftProfile, setDraftProfile] = useState({
    displayName: user.displayName || '',
    username: user.username || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    instagramHandle: user.instagramHandle || '',
    youtubeHandle: user.youtubeHandle || ''
  });
  
  const [showPhotoOptions, setShowPhotoOptions] = useState(false); // Modal menu
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const [newAvatarFile, setNewAvatarFile] = useState<Asset | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [editingField, setEditingField] = useState<'name' | 'username' | 'bio' | 'instagram' | 'youtube' | null>(null);

  const handleCopyLink = () => {
    const link = `https://www.tiktok.com/@${draftProfile.username}`;
    Clipboard.setString(link);
    
    // Tận dụng cái Toast message bạn đã làm ở bước trước để báo thành công
    setToastMessage('Link copied to clipboard'); 
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  const handleFieldSave = (newValue: string) => {
    if (editingField) {
      // Cập nhật giá trị vào draftProfile
      const fieldMap = {
        name: 'displayName',
        username: 'username',
        bio: 'bio',
        instagram: 'instagramHandle',
        youtube: 'youtubeHandle'
      };
      
      setDraftProfile(prev => ({
        ...prev,
        [fieldMap[editingField]]: newValue
      }));
      
      // Đóng màn hình con
      setEditingField(null);
    }
  };

  if (editingField) {
    let initialValue = '';
    if (editingField === 'name') initialValue = draftProfile.displayName;
    if (editingField === 'username') initialValue = draftProfile.username;
    if (editingField === 'bio') initialValue = draftProfile.bio;
    if (editingField === 'instagram') initialValue = draftProfile.instagramHandle;
    if (editingField === 'youtube') initialValue = draftProfile.youtubeHandle;

    return (
      <EditFieldScreen 
        type={editingField}
        initialValue={initialValue}
        onSave={handleFieldSave} // Hàm này ở các câu trả lời trước, bạn nhớ giữ lại nhé
        onCancel={() => setEditingField(null)}
      />
    );
  }

  // Kiểm tra xem có thay đổi nào chưa lưu không
  const hasUnsavedChanges = () => {
    return (
      draftProfile.displayName !== (user.displayName || '') ||
      draftProfile.username !== (user.username || '') ||
      draftProfile.bio !== (user.bio || '') ||
      draftProfile.avatarUrl !== (user.avatarUrl || '') ||
      draftProfile.instagramHandle !== (user.instagramHandle || '') ||
      draftProfile.youtubeHandle !== (user.youtubeHandle || '')
    );
  };

  // Hàm xử lý lưu dữ liệu
  const handleSave = async () => {
    setIsSaving(true);
    const result = await userService.updateUserProfile(user.uid, draftProfile);
    setIsSaving(false);
    

    if (result.success) {
      // Cập nhật lại state user ở App/ProfileView
      onUpdateSuccess({ ...user, ...draftProfile });
      setToastMessage('Changes saved.');
      setTimeout(() => {
        setToastMessage('');
        }, 3000);
    } else {
      Alert.alert('Error', 'Failed to save profile changes.');
    }
  };

  // Xử lý nút Back (Kiểm tra lưu)
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save them?",
        [
          {
            text: "Don't Save",
            style: "destructive",
            onPress: onClose
          },
          {
            text: "Save",
            onPress: handleSave
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } else {
      onClose();
    }
  };

  // 2. Hàm xử lý chung sau khi có ảnh (từ Camera hoặc Thư viện đều dùng hàm này)
  const processImageResult = (result: any) => {
    // Nếu hủy hoặc lỗi
    if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
    }

    const selectedImage = result.assets[0];

    // Kiểm tra dung lượng (5MB)
    if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
        Alert.alert("File too large", "Please choose an image under 5MB");
        return;
    }

    // Cập nhật State
    if (selectedImage.uri) {
        setDraftProfile(prev => ({
        ...prev,
        avatarUrl: selectedImage.uri || ''
        }));
        setNewAvatarFile(selectedImage);
        setShowPhotoOptions(false); // Đóng menu sau khi chọn xong
    }
  };

  const onPickFromLibrary = async () => {
    try {
        const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        });
        processImageResult(result);
    } catch (error) {
        console.error("Library Error:", error);
    }
  };

  const onTakePhoto = async () => {
    try {
        const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false, // Có lưu vào thư viện đt hay không
        cameraType: 'front', // Mặc định cam trước cho selfie
        });
        processImageResult(result);
    } catch (error) {
        // Lưu ý: Trên máy thật cần cấp quyền Camera, giả lập thì tự động ok
        console.error("Camera Error:", error);
        Alert.alert("Error", "Could not open camera. Check permissions.");
    }
  };

  const onViewPhoto = () => {
    setShowPhotoOptions(false); // Đóng menu trước
    setTimeout(() => {
        setShowImagePreview(true); // Mở xem ảnh sau
    }, 300); // Delay nhẹ để tránh xung đột modal trên iOS
  };

  // Giả lập chọn ảnh (Bạn hãy tích hợp react-native-image-picker vào đây)
  const handleChangePhoto = () => {
    setShowPhotoOptions(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={[styles.headerBtn, { alignItems: 'flex-start' }]}>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit profile</Text>
        
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving || !hasUnsavedChanges()}
          style={styles.headerBtn}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fe2c55" />
          ) : (
            <Text style={[
              styles.saveText, 
              !hasUnsavedChanges() && { opacity: 0.3 }
            ]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* AVATAR SECTION */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrapper}>
            <Image source={{ uri: draftProfile.avatarUrl }} style={styles.avatar} />
            <View style={styles.cameraIconBg}>
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        {/* FORM FIELDS SECTION */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>About you</Text>
          
          {/* NAME */}
          <TouchableOpacity style={styles.row} onPress={() => setEditingField('name')}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText} numberOfLines={1}>
                {draftProfile.displayName}
              </Text>
              <ChevronRight size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* USERNAME */}
          <TouchableOpacity style={styles.row} onPress={() => setEditingField('username')}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText} numberOfLines={1}>
                {draftProfile.username}
              </Text>
              <ChevronRight size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.inputHelper} 
            onPress={handleCopyLink} // <--- Gọi hàm copy khi bấm vào
            activeOpacity={0.7}      // <--- Hiệu ứng mờ nhẹ khi bấm
          >
            <Text style={styles.helperText}>tiktok.com/@{draftProfile.username}</Text>
            <Copy size={12} color="#000" style={{marginLeft: 5}}/>
          </TouchableOpacity>

          {/* BIO */}
          <TouchableOpacity style={styles.row} onPress={() => setEditingField('bio')}>
            <Text style={styles.label}>Bio</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText} numberOfLines={1}>
                {draftProfile.bio || "Add a bio to your profile"}
              </Text>
              <ChevronRight size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* SOCIAL LINKS (Static/Placeholder như ảnh) */}
        <View style={[styles.formSection, { marginTop: 20 }]}>
          <Text style={styles.sectionLabel}>Social</Text>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setEditingField('instagram')} // <-- Bấm vào để sửa
          >
            <Text style={styles.label}>Instagram</Text>
            
            <View style={styles.valueContainer}>
              {/* Nếu có handle thì hiện handle, không thì hiện chữ "Add..." màu xám */}
              {draftProfile.instagramHandle ? (
                <Text style={styles.valueText} numberOfLines={1}>
                  @{draftProfile.instagramHandle}
                </Text>
              ) : (
                <Text style={[styles.valueText, { color: '#ccc' }]}>
                  Add Instagram to your profile
                </Text>
              )}
              <ChevronRight size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setEditingField('youtube')} // <-- Bấm vào để sửa
          >
            <Text style={styles.label}>YouTube</Text>
            
            <View style={styles.valueContainer}>
              {/* Nếu có handle thì hiện handle, không thì hiện chữ "Add..." màu xám */}
              {draftProfile.youtubeHandle ? (
                <Text style={styles.valueText} numberOfLines={1}>
                  {draftProfile.youtubeHandle}
                </Text>
              ) : (
                <Text style={[styles.valueText, { color: '#ccc' }]}>
                  Add YouTube to your profile
                </Text>
              )}
              <ChevronRight size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      {/* --- MODAL 1: MENU TÙY CHỌN (Action Sheet) --- */}
        <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
        >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowPhotoOptions(false)}
        >
            <View style={styles.actionSheet}>
            {/* Nút Xem ảnh */}
            <TouchableOpacity style={styles.actionButton} onPress={onViewPhoto}>
                <Text style={styles.actionText}>View photo</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />

            {/* Nút Chụp ảnh */}
            <TouchableOpacity style={styles.actionButton} onPress={onTakePhoto}>
                <Text style={styles.actionText}>Take photo</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />

            {/* Nút Chọn từ thư viện */}
            <TouchableOpacity style={styles.actionButton} onPress={onPickFromLibrary}>
                <Text style={styles.actionText}>Choose from library</Text>
            </TouchableOpacity> 
            </View>
        </TouchableOpacity>
        </Modal>

        {/* --- MODAL 2: XEM ẢNH FULL MÀN HÌNH --- */}
        <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
        >
        <View style={styles.previewContainer}>
            {/* Nút đóng */}
            <TouchableOpacity 
            style={[styles.closePreviewBtn, { top: insets.top + 10 }]} 
            onPress={() => setShowImagePreview(false)}
            >
            <XCircle size={30} color="#fff" />
            </TouchableOpacity>

            {/* Ảnh to */}
            <Image 
            source={{ uri: draftProfile.avatarUrl }} 
            style={styles.fullImage} 
            resizeMode="contain"
            />
        </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, height: 50, borderBottomWidth: 0.5, borderBottomColor: '#eee' 
  },
  headerBtn: { minWidth: 50, alignItems: 'center' }, // Để dễ bấm hơn
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#fe2c55' }, // Màu đỏ TikTok

  content: { flex: 1 },
  
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, opacity: 0.8 },
  cameraIconBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 50
  },
  changePhotoText: { fontSize: 15, fontWeight: '500', color: '#000' },

  formSection: { paddingHorizontal: 16 },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 8, marginTop: 8 },
  row: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, 
  },
  label: { width: 100, fontSize: 15, fontWeight: '500', color: '#000' },
  input: { 
    flex: 1, fontSize: 15, color: '#000', 
    marginRight: 10, textAlign: 'right' // Căn phải giống ảnh
  },
  inputHelper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 },
  helperText: { fontSize: 14, color: '#000' },
  toastContainer: {
    position: 'absolute',
    bottom: 40,           // Cách đáy màn hình một khoảng vừa phải
    alignSelf: 'center',  // Tự động căn giữa màn hình
    backgroundColor: '#323232', // Màu xám đen chuẩn Material Design
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,      // Bo góc nhẹ giống Android (không tròn vo như iOS)
    zIndex: 999,          // Đảm bảo luôn nổi lên trên cùng
    
    // Đổ bóng nhẹ để nổi bật trên nền trắng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,         // Đổ bóng cho Android
  },
  
  // Style cho chữ bên trong
  toastText: {
    color: '#FFFFFF',     // Chữ trắng
    fontSize: 14,
    fontWeight: '400',    // Font thường, không quá đậm
    textAlign: 'center',
  },
  
  // Style mới cho phần hiển thị giá trị text (bên phải)
  valueContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end',
    gap: 4 
  },
  valueText: { 
    fontSize: 15, 
    color: '#000', 
    textAlign: 'right',
    maxWidth: 200 // Giới hạn chiều rộng để không đè lên label nếu text quá dài
  },
  // --- Style cho Modal Menu ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 30, // Cho dòng iPhone X trở lên
    paddingTop: 10,
  },
  actionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#000',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },

  // --- Style cho Modal Xem Ảnh ---
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closePreviewBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 5,
  }
});

export default EditProfileView;