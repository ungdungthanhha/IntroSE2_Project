import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { Mail, RefreshCw, LogOut } from 'lucide-react-native';
import { User } from '../types/type';
import * as authService from '../services/authService';

interface VerifyEmailViewProps {
    user: any; // Firebase User
    onVerified: () => void;
    onLogout: () => void;
}

const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ user, onVerified, onLogout }) => {
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');

    // AUTO-POLL: Check verification status every 3 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // Stop polling if logged out
                if (!auth().currentUser) {
                    clearInterval(interval);
                    return;
                }

                await user.reload(); // Reload user data from Firebase
                if (user.emailVerified) {
                    clearInterval(interval);
                    onVerified(); // Trigger App transition
                }
            } catch (e) {
                console.log("Polling error:", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [user]);

    const handleResend = async () => {
        setIsResending(true);
        try {
            await user.sendEmailVerification();
            Alert.alert('Sent!', 'A new verification link has been sent to ' + user.email);
        } catch (e: any) {
            if (e.code === 'auth/too-many-requests') {
                Alert.alert('Too Many Requests', 'Please wait check your inbox. We cannot send another link locally yet.');
            } else {
                Alert.alert('Error', e.message);
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Mail size={80} color="#FE2C55" style={styles.icon} />
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                    We sent a verification link to:{'\n'}
                    <Text style={styles.email}>{user.email}</Text>
                </Text>

                <Text style={styles.hint}>
                    Click the link in the email to verify your account.{'\n'}
                    The app will automatically update when you're done.
                </Text>

                <View style={styles.loaderRow}>
                    <ActivityIndicator size="small" color="#FE2C55" />
                    <Text style={styles.loaderText}>Waiting for verification...</Text>
                </View>

                <TouchableOpacity
                    style={[styles.resendBtn, { backgroundColor: '#FE2C55', borderWidth: 0 }]}
                    onPress={async () => {
                        setIsResending(true);
                        try {
                            // 1. Force refresh from server
                            await auth().currentUser?.reload();

                            // 2. Get fresh instance
                            const freshUser = auth().currentUser;
                            console.log("Verification confirm status:", freshUser?.emailVerified);

                            if (freshUser?.emailVerified) {
                                onVerified();
                            } else {
                                Alert.alert('Not Verified', 'Firebase still reports "Unverified".\n\nTip: Try closing and reopening the app if you are sure.');
                            }
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setIsResending(false);
                        }
                    }}
                    disabled={isResending}
                >
                    <Text style={[styles.resendText, { color: '#fff' }]}>I have verified!</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleResend}
                    disabled={isResending}
                >
                    {isResending ? <ActivityIndicator color="#000" /> : <Text style={styles.resendText}>Resend Email</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                    <LogOut size={20} color="#888" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: { backgroundColor: '#fff', width: '100%', padding: 30, borderRadius: 20, alignItems: 'center', minHeight: 400 },
    icon: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    email: { fontWeight: 'bold', color: '#000' },
    hint: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 30 },
    loaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    loaderText: { color: '#FE2C55', marginLeft: 10, fontWeight: '600' },
    resendBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, borderWidth: 1, borderColor: '#ddd', marginBottom: 20, width: '100%', alignItems: 'center' },
    resendText: { color: '#000', fontWeight: '600', fontSize: 15 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', opacity: 0.7 },
    logoutText: { marginLeft: 8, color: '#888', fontSize: 15 }
});

export default VerifyEmailView;
