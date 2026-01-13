import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

interface DigitalWellbeingViewProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
}

const DigitalWellbeingView: React.FC<DigitalWellbeingViewProps> = ({ onBack, onNavigate }) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Digital wellbeing</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Daily screen time */}
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => onNavigate('daily_screen_time')}
                >
                    <Text style={styles.itemTitle}>Daily screen time</Text>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Screen time breaks */}
                <TouchableOpacity style={styles.item}>
                    <Text style={styles.itemTitle}>Screen time breaks</Text>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Sleep reminders */}
                <TouchableOpacity style={styles.item}>
                    <Text style={styles.itemTitle}>Sleep reminders</Text>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e0e0e0',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    content: {
        paddingTop: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 18, // Bit more spacing
    },
    itemTitle: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500'
    }
});

export default DigitalWellbeingView;
