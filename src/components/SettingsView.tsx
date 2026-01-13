import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import {
    ArrowLeft, ChevronRight,
    User, Lock, Video, Wallet, Share2, QrCode,
    Bell, Languages, Umbrella, Accessibility, Droplet,
    PenLine, HelpCircle, LogOut
} from 'lucide-react-native';

interface SettingsViewProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onNavigate, onLogout }) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy and settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* ACCOUNT SECTION */}
                <Text style={styles.sectionTitle}>ACCOUNT</Text>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <User size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Manage my account</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Lock size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Privacy and safety</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Video size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Content preferences</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Wallet size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Balance</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Share2 size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Share profile</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <QrCode size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>TikCode</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* GENERAL SECTION */}
                <Text style={styles.sectionTitle}>GENERAL</Text>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Bell size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Push notifications</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Languages size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Language</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => onNavigate('digital_wellbeing')}
                >
                    <View style={styles.itemLeft}>
                        <Umbrella size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Digital Wellbeing</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Accessibility size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Accessibility</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Droplet size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Data Saver</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* SUPPORT SECTION */}
                <Text style={styles.sectionTitle}>SUPPORT</Text>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <PenLine size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Report a problem</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.itemLeft}>
                        <HelpCircle size={22} color="#666" strokeWidth={1.5} />
                        <Text style={styles.itemText}>Help Center</Text>
                    </View>
                    <ChevronRight size={20} color="#ccc" />
                </TouchableOpacity>

                <View style={styles.divider} />



                <TouchableOpacity style={styles.bottomLogoutBtn} onPress={onLogout}>
                    <Text style={styles.bottomLogoutText}>Log out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        flex: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        marginTop: 24,
        marginBottom: 8,
        paddingHorizontal: 16,
        letterSpacing: 0.5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    itemText: {
        fontSize: 15,
        color: '#000',
        fontWeight: '400',
    },

    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 54, // Indent to align with text
        marginRight: 0,
        marginTop: 4,
        marginBottom: 4
    },
    versionText: {
        textAlign: 'center',
        color: '#ccc',
        fontSize: 12,
        marginTop: 20
    },
    bottomLogoutBtn: {
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: '#f2f2f2',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    bottomLogoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    }
});

export default SettingsView;
