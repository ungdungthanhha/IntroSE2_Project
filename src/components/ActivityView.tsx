
import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { ArrowLeft, BellOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActivityViewProps {
    onBack: () => void;
}

const ActivityView: React.FC<ActivityViewProps> = ({ onBack }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
                    <ArrowLeft color="#000" size={24} />
                </TouchableOpacity>
                <View style={styles.titleWrapper}>
                    <Text style={styles.title}>All activity</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Empty State */}
            <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconContainer}>
                    <BellOff size={60} color="#ccc" strokeWidth={1} />
                </View>
                <Text style={styles.emptyTitle}>Notifications aren't available</Text>
                <Text style={styles.emptySubtitle}>Notifications about your account will appear here</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerBtn: {
        padding: 8,
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ActivityView;
