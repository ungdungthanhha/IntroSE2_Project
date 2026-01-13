import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Lock, Clock } from 'lucide-react-native';
import { getTimeLimit } from '../services/appUsageService';

interface TimeLimitExceededViewProps {
    visible: boolean;
    onUnlock: () => void;
}

const TimeLimitExceededView: React.FC<TimeLimitExceededViewProps> = ({ visible, onUnlock }) => {
    const [showPasscodeInfo, setShowPasscodeInfo] = useState(false);
    const [passcode, setPasscode] = useState('');

    const handleEnterPasscode = async () => {
        const settings = await getTimeLimit();
        const storedPasscode = settings.passcode;

        if (storedPasscode && passcode === storedPasscode) {
            setPasscode('');
            setShowPasscodeInfo(false);
            onUnlock();
        } else if (!storedPasscode && passcode === '1234') {
            // Fallback for legacy/testing
            setPasscode('');
            setShowPasscodeInfo(false);
            onUnlock();
        } else {
            Alert.alert('Error', 'Incorrect passcode');
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent={false}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Clock size={48} color="#fff" />
                    </View>
                    <Text style={styles.title}>You've reached your daily limit</Text>
                    <Text style={styles.subtitle}>
                        You have used TikTok for your set screen time limit today.
                    </Text>

                    {showPasscodeInfo ? (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Enter passcode (1234)</Text>
                            <TextInput
                                style={styles.input}
                                value={passcode}
                                onChangeText={setPasscode}
                                placeholder="Passcode"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                secureTextEntry
                                autoFocus
                            />
                            <View style={styles.inputButtons}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowPasscodeInfo(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.verifyBtn}
                                    onPress={handleEnterPasscode}
                                >
                                    <Text style={styles.verifyBtnText}>Enter</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setShowPasscodeInfo(true)}
                        >
                            <Text style={styles.buttonText}>Enter passcode</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#161823', // TikTok dark theme background
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 300,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2f303b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#fe2c55',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        minWidth: 160,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inputContainer: {
        width: '100%',
        alignItems: 'center',
    },
    inputLabel: {
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        backgroundColor: '#2f303b',
        color: '#fff',
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 18,
    },
    inputButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        padding: 12,
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 4,
    },
    cancelBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    verifyBtn: {
        padding: 12,
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fe2c55',
        borderRadius: 4,
    },
    verifyBtnText: {
        color: '#fff',
        fontWeight: '600',
    }
});

export default TimeLimitExceededView;
