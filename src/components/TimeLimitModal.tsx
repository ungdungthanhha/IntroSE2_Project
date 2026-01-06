import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { X, Clock, Bell } from 'lucide-react-native';
import { 
  getTimeLimit, 
  setTimeLimit, 
  getTotalUsageMinutes, 
  formatTime,
  getRemainingTime,
  TimeLimitSettings 
} from '../services/appUsageService';

interface TimeLimitModalProps {
  visible: boolean;
  onClose: () => void;
}

const TimeLimitModal: React.FC<TimeLimitModalProps> = ({ visible, onClose }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [limitMinutes, setLimitMinutes] = useState('60');
  const [reminderMinutes, setReminderMinutes] = useState('10');
  const [todayUsage, setTodayUsage] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const settings = await getTimeLimit();
      const usage = await getTotalUsageMinutes();
      const remaining = await getRemainingTime();

      setIsEnabled(settings.enabled);
      setLimitMinutes(String(settings.limitMinutes));
      setReminderMinutes(String(settings.reminderMinutes));
      setTodayUsage(usage);
      setRemainingTime(remaining);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    const limit = parseInt(limitMinutes) || 60;
    const reminder = parseInt(reminderMinutes) || 10;

    if (limit < 5) {
      Alert.alert('Invalid Limit', 'Time limit must be at least 5 minutes');
      return;
    }

    if (reminder >= limit) {
      Alert.alert('Invalid Reminder', 'Reminder time must be less than the limit');
      return;
    }

    setIsLoading(true);
    try {
      await setTimeLimit({
        enabled: isEnabled,
        limitMinutes: limit,
        reminderMinutes: reminder
      });
      Alert.alert('Success', 'Time limit settings saved!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Screen Time</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Today's Usage */}
          <View style={styles.usageCard}>
            <Clock size={32} color="#fe2c55" />
            <View style={styles.usageInfo}>
              <Text style={styles.usageLabel}>Today's Usage</Text>
              <Text style={styles.usageTime}>{formatTime(todayUsage)}</Text>
            </View>
          </View>

          {isEnabled && remainingTime > 0 && (
            <View style={styles.remainingCard}>
              <Text style={styles.remainingLabel}>Time Remaining</Text>
              <Text style={styles.remainingTime}>{formatTime(remainingTime)}</Text>
            </View>
          )}

          {/* Enable Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Time Limit</Text>
              <Text style={styles.settingDesc}>Limit daily app usage</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: '#ddd', true: '#fe2c55' }}
              thumbColor="#fff"
            />
          </View>

          {isEnabled && (
            <>
              {/* Daily Limit */}
              <View style={styles.inputRow}>
                <View style={styles.inputLabel}>
                  <Clock size={20} color="#666" />
                  <Text style={styles.inputLabelText}>Daily Limit (minutes)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={limitMinutes}
                  onChangeText={setLimitMinutes}
                  keyboardType="number-pad"
                  placeholder="60"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Reminder Before */}
              <View style={styles.inputRow}>
                <View style={styles.inputLabel}>
                  <Bell size={20} color="#666" />
                  <Text style={styles.inputLabelText}>Remind before (minutes)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={reminderMinutes}
                  onChangeText={setReminderMinutes}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor="#999"
                />
              </View>

              <Text style={styles.hint}>
                You'll receive a reminder when you have {reminderMinutes} minutes left.
              </Text>
            </>
          )}

          {/* Preset Options */}
          {isEnabled && (
            <View style={styles.presets}>
              <Text style={styles.presetsLabel}>Quick Set</Text>
              <View style={styles.presetButtons}>
                {['15', '30', '60', '120'].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.presetBtn,
                      limitMinutes === mins && styles.presetBtnActive
                    ]}
                    onPress={() => setLimitMinutes(mins)}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        limitMinutes === mins && styles.presetBtnTextActive
                      ]}
                    >
                      {parseInt(mins) >= 60 ? `${parseInt(mins) / 60}h` : `${mins}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveBtnText}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000'
  },
  closeBtn: {
    padding: 4
  },
  usageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  usageInfo: {
    marginLeft: 16
  },
  usageLabel: {
    fontSize: 14,
    color: '#666'
  },
  usageTime: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000'
  },
  remainingCard: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  remainingLabel: {
    fontSize: 12,
    color: '#2e7d32'
  },
  remainingTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingInfo: {
    flex: 1
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  settingDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  inputLabelText: {
    fontSize: 15,
    color: '#333'
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    marginBottom: 16
  },
  presets: {
    marginTop: 8,
    marginBottom: 24
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 12
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center'
  },
  presetBtnActive: {
    backgroundColor: '#fe2c55'
  },
  presetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666'
  },
  presetBtnTextActive: {
    color: '#fff'
  },
  saveBtn: {
    backgroundColor: '#fe2c55',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  saveBtnDisabled: {
    opacity: 0.6
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});

export default TimeLimitModal;
