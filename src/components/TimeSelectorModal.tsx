import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput
} from 'react-native';
import { X } from 'lucide-react-native';

interface TimeSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (minutes: number) => void;
    currentValue?: number;
}

const TimeSelectorModal: React.FC<TimeSelectorModalProps> = ({ visible, onClose, onSelect, currentValue }) => {
    const options = [
        { label: '30 minutes', value: 30 },
        { label: '1 hour', value: 60 },
        { label: '1 hour and 30 minutes', value: 90 },
        { label: '2 hours', value: 120 },
    ];

    const [isCustom, setIsCustom] = useState(false);
    const [customValue, setCustomValue] = useState('');

    const handleSelect = (value: number) => {
        onSelect(value);
        onClose();
    };

    const handleCustomSubmit = () => {
        const minutes = parseInt(customValue);
        if (!isNaN(minutes) && minutes > 0) {
            onSelect(minutes);
            onClose();
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
                        <Text style={styles.title}>Choose time</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={styles.option}
                            onPress={() => handleSelect(option.value)}
                        >
                            <Text style={styles.optionText}>{option.label}</Text>
                            {(currentValue === option.value && !isCustom) ? (
                                <View style={styles.radioSelected} />
                            ) : (
                                <View style={styles.radioUnselected} />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Custom Option */}
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setIsCustom(true);
                        }}
                    >
                        <Text style={styles.optionText}>Custom</Text>
                        {isCustom ? (
                            <View style={styles.radioSelected} />
                        ) : (
                            <View style={styles.radioUnselected} />
                        )}
                    </TouchableOpacity>

                    {isCustom && (
                        <View style={styles.customInputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter minutes"
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                                value={customValue}
                                onChangeText={setCustomValue}
                                autoFocus
                            />
                            <TouchableOpacity style={styles.setBtn} onPress={handleCustomSubmit}>
                                <Text style={styles.setBtnText}>Set</Text>
                            </TouchableOpacity>
                        </View>
                    )}

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
        paddingBottom: 40,
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
        paddingHorizontal: 16
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        top: 0
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    optionText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500' // Matches screenshot
    },
    radioUnselected: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    radioSelected: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 6, // Thick border makes it look like a dot inside if we use color
        borderColor: '#fe2c55', // TikTok Red
        backgroundColor: '#fff'
    },
    customInputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 10,
        gap: 10
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#000'
    },
    setBtn: {
        backgroundColor: '#fe2c55',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 8
    },
    setBtnText: {
        color: '#fff',
        fontWeight: '600'
    }
});

export default TimeSelectorModal;
