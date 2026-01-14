import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  SafeAreaView, ActivityIndicator, StatusBar,
  Platform, Alert
} from 'react-native';
import { ArrowLeft, Wand2 } from 'lucide-react-native';
import Video from 'react-native-video';
import { generateCaption } from '../services/geminiService'; // Giữ nguyên import

interface DetailsScreenProps {
  videoPath: string;
  onBack: () => void;
  onSubmit: (caption: string, setIsLoading: (l: boolean) => void) => Promise<void> | void;
  onSaveDraft: () => void;
}

const DetailsScreen: React.FC<DetailsScreenProps> = ({ videoPath, onBack, onSubmit, onSaveDraft }) => {
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiCaption = async () => {
    if (!caption.trim()) {
      Alert.alert("Input Required", "Please enter a few keywords or a rough description first!");
      return;
    }
    setIsGenerating(true);
    try {
      const newCaption = await generateCaption(caption);
      setCaption(newCaption);
    } catch (e) {
      Alert.alert("Error", "Failed to generate caption.");
    }
    setIsGenerating(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.mediaPreviewRow}>
          <TextInput
            style={styles.captionInput}
            placeholder="Describe your video..."
            multiline
            value={caption}
            onChangeText={setCaption}
          />
          <View style={styles.smallPreview}>
            <Video source={{ uri: videoPath }} style={{ flex: 1 }} resizeMode="cover" paused={true} />
          </View>
        </View>

        <TouchableOpacity onPress={handleAiCaption} style={styles.aiButton} disabled={isGenerating}>
          <Wand2 size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {isGenerating ? 'Generating...' : 'AI Caption'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn} onPress={onSaveDraft}>
          <Text style={{ fontWeight: '600' }}>Drafts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postBtn, isLoading && styles.postBtnDisabled]}
          onPress={() => {
            if (isLoading) return; // fast guard to block rapid taps before state update
            setIsLoading(true); // immediately disable button locally
            // call submit (UploadView will still control final state via setIsLoading)
            void onSubmit(caption, setIsLoading);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 40
  },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  mediaPreviewRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  captionInput: { flex: 1, fontSize: 15, textAlignVertical: 'top' },
  smallPreview: { width: 80, height: 110, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden' },
  aiButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EE1D52', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginBottom: 20 },
  footer: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 50 },
  draftBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#eee', borderRadius: 4 },
  postBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#EE1D52', borderRadius: 4 },
  postBtnDisabled: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#cfcfcf', borderRadius: 4 },
});

export default DetailsScreen;