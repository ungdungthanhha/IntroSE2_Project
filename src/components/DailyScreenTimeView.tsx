import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { getTimeLimit, setTimeLimit, startSession, getTotalUsageMinutes } from '../services/appUsageService';
import TimeSelectorModal from './TimeSelectorModal';
import PasscodeSetupModal from './PasscodeSetupModal';

interface DailyScreenTimeViewProps {
    onBack: () => void;
}

const DailyScreenTimeView: React.FC<DailyScreenTimeViewProps> = ({ onBack }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isCustomDays, setIsCustomDays] = useState(false);
    const [usageMinutes, setUsageMinutes] = useState(0);

    // Default limit
    const [limitMinutes, setLimitMinutes] = useState(60);

    // Custom limits for each day
    const [customLimits, setCustomLimits] = useState<{ [key: string]: number }>({
        'Monday': 60,
        'Tuesday': 60,
        'Wednesday': 60,
        'Thursday': 60,
        'Friday': 60,
        'Saturday': 60,
        'Sunday': 60
    });

    const [loading, setLoading] = useState(true);

    // Modal controls
    const [modalVisible, setModalVisible] = useState(false);
    const [selectingDay, setSelectingDay] = useState<string | null>(null); // null means "Same limit" mode

    // Passcode State
    const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
    const [hasPasscode, setHasPasscode] = useState(false);
    const [storedPasscode, setStoredPasscode] = useState<string | undefined>(undefined);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getTimeLimit();
            setIsEnabled(settings.enabled);
            setLimitMinutes(settings.limitMinutes);
            if (settings.isCustomDays !== undefined) {
                setIsCustomDays(settings.isCustomDays);
            }
            if (settings.customDailyLimits) {
                setCustomLimits({ ...customLimits, ...settings.customDailyLimits });
            }
            if (settings.passcode) {
                setHasPasscode(true);
                setStoredPasscode(settings.passcode);
            }
            const used = await getTotalUsageMinutes();
            setUsageMinutes(used);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-update usage time every minute
    useEffect(() => {
        const updateUsage = async () => {
            const used = await getTotalUsageMinutes();
            setUsageMinutes(used);
        };

        const interval = setInterval(updateUsage, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const saveSettings = async (newState: any) => {
        try {
            await setTimeLimit({
                enabled: newState.isEnabled,
                limitMinutes: newState.limitMinutes,
                reminderMinutes: 10, // Keep default for now
                isCustomDays: newState.isCustomDays,
                customDailyLimits: newState.customLimits,
                passcode: newState.passcode || storedPasscode
            });

            // If updated passcode
            if (newState.passcode) {
                setStoredPasscode(newState.passcode);
                setHasPasscode(true);
            }

            // If enabled, ensure session tracking starts
            if (newState.isEnabled) {
                await startSession();
            }
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    // Wrapper to update state and save immediately (like iOS settings)
    const updateState = (updates: any) => {
        const newState = {
            isEnabled,
            limitMinutes,
            isCustomDays,
            customLimits,
            ...updates
        };

        // Update local state
        if (updates.isEnabled !== undefined) setIsEnabled(updates.isEnabled);
        if (updates.limitMinutes !== undefined) setLimitMinutes(updates.limitMinutes);
        if (updates.isCustomDays !== undefined) setIsCustomDays(updates.isCustomDays);
        if (updates.customLimits !== undefined) setCustomLimits(updates.customLimits);

        // Save to storage
        saveSettings(newState);
    };

    const handleTimeSelect = (minutes: number) => {
        if (selectingDay) {
            // Updating a specific day
            const newLimits = { ...customLimits, [selectingDay]: minutes };
            updateState({ customLimits: newLimits });
        } else {
            // Updating the "Same limit"
            updateState({ limitMinutes: minutes });
        }
    };

    const openTimeSelector = (day: string | null) => {
        setSelectingDay(day);
        setModalVisible(true);
    };

    // Helper to format time text
    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (m === 0) return `${h} hour${h > 1 ? 's' : ''}`;
        if (h === 0) return `${m} minute${m > 1 ? 's' : ''}`;
        return `${h}h ${m}m`;
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#000" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Screen time</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>

                {/* Usage Summary */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryLabel}>Daily time used</Text>
                    <Text style={styles.summaryValue}>{formatDuration(usageMinutes)}</Text>
                </View>
                <View style={styles.divider} />

                {/* Main Toggle */}
                <View style={styles.sectionItem}>
                    <Text style={styles.sectionText}>Limit time using TikTok</Text>
                    <Switch
                        trackColor={{ false: "#e0e0e0", true: "#fe2c55" }}
                        thumbColor={"#fff"}
                        onValueChange={(val) => {
                            if (val && !hasPasscode) {
                                // Trying to enable but no passcode set
                                setPasscodeModalVisible(true);
                            } else {
                                updateState({ isEnabled: val });
                            }
                        }}
                        value={isEnabled}
                    />
                </View>

                {isEnabled && (
                    <>
                        <View style={styles.divider} />

                        {/* Radio Options */}
                        <TouchableOpacity
                            style={styles.radioItem}
                            onPress={() => updateState({ isCustomDays: false })}
                        >
                            <Text style={styles.itemText}>Set the same limit for every day</Text>
                            <View style={[styles.radioOuter, !isCustomDays && styles.radioSelectedBorder]}>
                                {!isCustomDays && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>

                        {/* "Time" row when using Same Limit */}
                        {!isCustomDays && (
                            <TouchableOpacity
                                style={styles.subItem}
                                onPress={() => openTimeSelector(null)}
                            >
                                <Text style={styles.subItemLabel}>Time</Text>
                                <View style={styles.rowCenter}>
                                    <Text style={styles.valText}>{formatDuration(limitMinutes)}</Text>
                                    <ChevronRight size={16} color="#ccc" />
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.radioItem}
                            onPress={() => updateState({ isCustomDays: true })}
                        >
                            <Text style={styles.itemText}>Set custom limits for each day</Text>
                            <View style={[styles.radioOuter, isCustomDays && styles.radioSelectedBorder]}>
                                {isCustomDays && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>

                        {/* Days List when using Custom Limits */}
                        {isCustomDays && (
                            <View style={styles.daysList}>
                                {daysOfWeek.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={styles.dayItem}
                                        onPress={() => openTimeSelector(day)}
                                    >
                                        <Text style={styles.dayName}>{day}</Text>
                                        <View style={styles.rowCenter}>
                                            <Text style={styles.valText}>{formatDuration(customLimits[day] || 60)}</Text>
                                            <ChevronRight size={16} color="#ccc" />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}

            </ScrollView>

            <TimeSelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={handleTimeSelect}
                currentValue={selectingDay ? customLimits[selectingDay] : limitMinutes}
            />

            <PasscodeSetupModal
                visible={passcodeModalVisible}
                onClose={() => setPasscodeModalVisible(false)}
                onSetPasscode={(code) => {
                    setPasscodeModalVisible(false);
                    // Enable and save code
                    updateState({ isEnabled: true, passcode: code });
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
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
        flex: 1,
    },
    sectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    summaryContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f8f8',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    sectionText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500' // Changed to 500
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 16
    },
    radioItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    itemText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500' // Changed to 500
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioSelectedBorder: {
        borderColor: '#fe2c55',
        borderWidth: 6, // Make it look solid or thick
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff' // Not needed if we use thick border trick, but good for safety
    },
    subItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingLeft: 16,
        paddingRight: 16,
    },
    subItemLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000'
    },
    valText: {
        fontSize: 15,
        color: '#888',
        marginRight: 4
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    daysList: {
        marginTop: 0,
        paddingBottom: 20
    },
    dayItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    dayName: {
        fontSize: 16,
        color: '#000'
    }
});

export default DailyScreenTimeView;
