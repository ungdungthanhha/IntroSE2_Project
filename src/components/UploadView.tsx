
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { X, Wand2, ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import Video from 'react-native-video';
import { generateCaption } from '../services/geminiService';

interface UploadViewProps {
  onClose: () => void;
  onPost: (video: any) => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onClose, onPost }) => {
  const [step, setStep] = useState<'record' | 'details'>('record');
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCapture = () => {
    setPreviewUrl('https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-city-lighting-at-night-14028-large.mp4');
    setStep('details');
  };

  const handleAiCaption = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    const aiCaption = await generateCaption("a girl walking in neon city lights at night");
    setCaption(aiCaption);
    setIsGenerating(false);
  };

  const handleSubmit = () => {
    onPost({
      id: Date.now().toString(),
      videoUrl: previewUrl,
      caption: caption,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0
    });
    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === 'record' ? (
        <View style={styles.recordContainer}>
          <View style={styles.recordHeader}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.durationSelector}>
              <Text style={[styles.durationText, styles.activeDuration]}>60s</Text>
              <Text style={styles.durationText}>15s</Text>
              <Text style={styles.durationText}>Templates</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.cameraPlaceholder}>
            <View style={styles.cameraContent}>
              <Camera size={64} color="#333" />
              <Text style={styles.cameraText}>Recording View</Text>
            </View>
            
            <View style={styles.sideTools}>
              <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolIconWrap}><ArrowLeft style={{ transform: [{ rotate: '90deg' }] }} size={20} color="#fff"/></View>
                <Text style={styles.toolLabel}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolIconWrap}><Wand2 size={20} color="#fff"/></View>
                <Text style={styles.toolLabel}>Filters</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.recordFooter}>
            <TouchableOpacity style={styles.footerAction}>
              <View style={styles.uploadIconWrap}>
                <ImageIcon size={20} color="#fff" />
              </View>
              <Text style={styles.footerActionText}>Upload</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleCapture} style={styles.recordBtnOuter}>
              <View style={styles.recordBtnInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerAction}>
              <View style={[styles.uploadIconWrap, { backgroundColor: '#9333ea' }]}>
                <Text>✨</Text>
              </View>
              <Text style={styles.footerActionText}>Effects</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.detailsContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('record')} style={styles.headerBtn}>
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            <View style={styles.captionSection}>
              <TextInput
                multiline
                value={caption}
                onChangeText={setCaption}
                placeholder="Describe your video..."
                placeholderTextColor="#999"
                style={styles.captionInput}
              />
              <View style={styles.previewThumbnail}>
                <Video 
                  source={{ uri: previewUrl! }} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode="cover"
                  paused={true}
                />
              </View>
            </View>

            <View style={styles.wizardSection}>
              <TouchableOpacity 
                onPress={handleAiCaption}
                disabled={isGenerating}
                style={styles.wizardBtn}
              >
                <Wand2 size={18} color="#fe2c55" />
                <Text style={styles.wizardBtnText}>
                  {isGenerating ? "Generating..." : "AI Caption Wizard"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRows}>
              <TouchableOpacity style={styles.settingRow}>
                <Text style={styles.settingLabel}>Location</Text>
                <Text style={styles.settingValue}>Add Location {'>'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingRow}>
                <Text style={styles.settingLabel}>Who can watch</Text>
                <Text style={styles.settingValue}>Everyone {'>'}</Text>
              </TouchableOpacity>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Allow Comments</Text>
                <View style={styles.toggleOn}>
                  <View style={styles.toggleThumb} />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.detailsFooter}>
            <TouchableOpacity style={styles.draftBtn} onPress={onClose}>
              <Text style={styles.draftBtnText}>Drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postBtn} onPress={handleSubmit}>
              <Text style={styles.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  recordContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  iconBtn: {
    padding: 8,
  },
  durationSelector: {
    flexDirection: 'row',
    gap: 16,
  },
  durationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '700',
  },
  activeDuration: {
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#fe2c55',
    paddingBottom: 4,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContent: {
    alignItems: 'center',
  },
  cameraText: {
    color: '#444',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  sideTools: {
    position: 'absolute',
    right: 16,
    top: 40,
    gap: 24,
  },
  toolItem: {
    alignItems: 'center',
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  recordFooter: {
    padding: 30,
    paddingBottom: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  footerAction: {
    alignItems: 'center',
  },
  uploadIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerActionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
  },
  recordBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnInner: {
    width: 64,
    height: 64,
    backgroundColor: '#fe2c55',
    borderRadius: 32,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  captionSection: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  captionInput: {
    flex: 1,
    height: 120,
    fontSize: 15,
    color: '#000',
    textAlignVertical: 'top',
  },
  previewThumbnail: {
    width: 96,
    height: 128,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  wizardSection: {
    paddingVertical: 24,
  },
  wizardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254,44,85,0.05)',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254,44,85,0.2)',
    gap: 10,
  },
  wizardBtnText: {
    color: '#fe2c55',
    fontSize: 14,
    fontWeight: '700',
  },
  settingRows: {
    gap: 24,
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  toggleOn: {
    width: 44,
    height: 24,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  detailsFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 12,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  draftBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  postBtn: {
    flex: 1,
    backgroundColor: '#fe2c55',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  postBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default UploadView;
