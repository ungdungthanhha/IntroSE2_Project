import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { X, Lock } from 'lucide-react-native';

interface PasscodeSetupModalProps {
    visible: boolean;
    onClose: () => void;
    onSetPasscode: (passcode: string) => void;
}

const PasscodeSetupModal: React.FC<PasscodeSetupModalProps> = ({ visible, onClose, onSetPasscode }) => {
    const [passcode, setPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [step, setStep] = useState(1); // 1: Enter, 2: Confirm
    const [error, setError] = useState('');

    const handleNext = () => {
        if (passcode.length !== 4) {
            setError('Please enter a 4-digit code');
            return;
        }
        setStep(2);
        setError('');
    };

    const handleConfirm = () => {
        if (confirmPasscode !== passcode) {
            setError('Passcodes do not match');
            return;
        }
        onSetPasscode(passcode);
        reset();
    };

    const reset = () => {
        setPasscode('');
        setConfirmPasscode('');
        setStep(1);
        setError('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <X size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Lock size={32} color="#000" />
                    </View>

                    <Text style={styles.title}>
                        {step === 1 ? 'Set a passcode' : 'Confirm passcode'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? 'Enter a 4-digit code.' : 'Re-enter your code to confirm.'}
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={step === 1 ? passcode : confirmPasscode}
                        onChangeText={step === 1 ? setPasscode : setConfirmPasscode}
                        placeholder="0000"
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        autoFocus
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={step === 1 ? handleNext : handleConfirm}
                    >
                        <Text style={styles.actionBtnText}>
                            {step === 1 ? 'Next' : 'Set Passcode'}
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
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f1f1f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24
    },
    input: {
        fontSize: 32,
        letterSpacing: 8,
        fontWeight: '600',
        borderBottomWidth: 2,
        borderBottomColor: '#ccc',
        width: 140,
        textAlign: 'center',
        marginBottom: 24,
        color: '#000'
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
        fontSize: 14
    },
    actionBtn: {
        backgroundColor: '#fe2c55',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center'
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16
    }
});

export default PasscodeSetupModal;
