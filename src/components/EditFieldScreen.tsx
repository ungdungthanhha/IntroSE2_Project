import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XCircle } from 'lucide-react-native';

interface EditFieldScreenProps {
  type: 'name' | 'username' | 'bio' | 'instagram' | 'youtube';
  initialValue: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
}

const EditFieldScreen: React.FC<EditFieldScreenProps> = ({ 
  type, 
  initialValue, 
  onSave, 
  onCancel 
}) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initialValue);
  
  // Cấu hình nội dung cứng (Tiếng Anh)
  const config = {
    name: {
      label: "Name",
      placeholder: "Name",
      maxLength: 30,
      note: "You can only change your name once every 7 days.",
      multiline: false
    },
    username: {
      label: "Username",
      placeholder: "Username",
      maxLength: 24,
      note: "You can only change your username once every 30 days. Usernames can contain only letters, numbers, underscores, and periods. Changing your username will also change your profile link.",
      multiline: false
    },
    bio: {
      label: "Bio",
      placeholder: "You can modify your bio at any time.",
      maxLength: 160,
      note: "", 
      multiline: true
    },
    instagram: {
      label: "Instagram ID",
      placeholder: "Enter your Instagram ID",
      maxLength: 30,
      note: "Add your Instagram username to your profile so people can find you.",
      multiline: false
    },
    youtube: {
      label: "Youtube Channel",
      placeholder: "Enter your Youtube Channel",
      maxLength: 30,
      note: "Add your Youtube channel to your profile so people can find you.",
      multiline: false
    }
  };

  const currentConfig = (config as any)[type];
  const canSave = text.trim().length > 0 && text !== initialValue;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10}]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerBtnLeft}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{currentConfig.label}</Text>
        
        <TouchableOpacity 
          onPress={() => onSave(text)} 
          disabled={!canSave}
          style={styles.headerBtnRight}
        >
          <Text style={[styles.saveText, !canSave && styles.disabledText]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>{currentConfig.label}</Text>

        {currentConfig.note ? (
          <Text style={styles.note}>{currentConfig.note}</Text>
        ) : null}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, currentConfig.multiline && styles.multilineInput]}
            value={text}
            onChangeText={setText}
            placeholder={currentConfig.placeholder}
            placeholderTextColor="#999"
            maxLength={currentConfig.maxLength}
            multiline={currentConfig.multiline}
            autoFocus={true}
          />
          
          {text.length > 0 && !currentConfig.multiline && (
            <TouchableOpacity onPress={() => setText('')} style={styles.clearBtn}>
              <XCircle size={20} color="#ccc" fill="#666" /> 
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footerRow}>
          
          {/* BÊN TRÁI: Link TikTok (Chỉ hiện nếu đang sửa username) */}
          <View style={styles.linkContainer}>
            {type === 'username' && (
              <Text style={styles.linkText} numberOfLines={1}>
                www.tiktok.com/@{text}
              </Text>
            )}
            {/* Thêm dòng này cho Instagram */}
            {type === 'instagram' && (
              <Text style={styles.linkText} numberOfLines={1}>www.instagram.com/{text}</Text>
            )}
          </View>
          {/* BÊN PHẢI: Bộ đếm ký tự */}
          <Text style={styles.counter}>
            {text.length}/{currentConfig.maxLength}
          </Text>
          
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    height: 50, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#eee' 
  },
  headerBtnLeft: { minWidth: 60, alignItems: 'flex-start' },
  headerBtnRight: { minWidth: 60, alignItems: 'flex-end' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  cancelText: { fontSize: 16, color: '#000' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#fe2c55' },
  disabledText: { opacity: 0.4 },

  body: { padding: 16 },
  label: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 8 },
  note: { fontSize: 14, color: '#999', marginBottom: 16, lineHeight: 18 },
  
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#f1f1f2', borderRadius: 4, paddingHorizontal: 10 
  },
  input: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 12, minHeight: 48 },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  clearBtn: { padding: 5 },
  
  counter: { alignSelf: 'flex-start', color: '#666', fontSize: 12, marginTop: 6 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Đẩy Link sang trái, Counter sang phải
    alignItems: 'flex-start',
    marginTop: 6,
  },
  linkContainer: {
    flex: 1, // Để link chiếm phần không gian còn lại, tránh bị đè counter
    paddingRight: 10
  },
  linkText: {
    fontSize: 13,
    color: '#000', // Hoặc '#666' nếu muốn màu xám
    fontWeight: '500'
  },
});

export default EditFieldScreen;