import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  Alert, SafeAreaView, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { ArrowLeft, User, Mail } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import * as authService from '../services/authService';

const AuthView = () => {
  // --- 1. HOOKS ---
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [viewMode, setViewMode] = useState<'social' | 'phone' | 'email' | 'otp' | 'complete_info'>('social');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');

  // --- 2. LOGIC FUNCTIONS ---

  // Xử lý gửi mã OTP qua Phone
  const handlePhoneAuth = async () => {
    if (!phoneNumber) return Alert.alert('Error', 'Please enter a phone number');
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(`+84${phoneNumber}`);
      setConfirm(confirmation);
      setViewMode('otp');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally { setLoading(false); }
  };

  // Xác thực OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await confirm.confirm(otpCode);
      if (isSignUp) {
        setViewMode('complete_info'); // Đăng ký thành công OTP -> Qua bước nhập thông tin
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code');
    } finally { setLoading(false); }
  };

  // Chuyển bước khi nhập Email
  const handleEmailNextStep = () => {
    const cleanEmail = email.trim();
    if (!authService.validateEmail(cleanEmail)) {
      return Alert.alert('Error', 'Invalid email format');
    }
    if (isSignUp) {
      setViewMode('complete_info'); // Đăng ký bằng Email -> Qua bước nhập thông tin
    } else {
      handleEmailLogin();
    }
  };

  // Đăng nhập bằng Email
  const handleEmailLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return Alert.alert('Error', 'Please fill in all fields');

    setLoading(true);
    try {
      const result = await authService.loginUser(cleanEmail, password);
      if (!result.success) {
        if (result.status === 'requires_verification') {
          Alert.alert('Verification Sent', result.error);
        } else {
          Alert.alert('Login Failed', result.error);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally { setLoading(false); }
  };

  // Hoàn tất đăng ký cuối cùng
  const handleFinalRegistration = async () => {
    if (password !== rePassword) return Alert.alert('Error', 'Passwords do not match');
    if (!authService.validatePassword(password)) return Alert.alert('Error', 'Password must be at least 6 characters');

    setLoading(true);
    // Gọi registerUser với đầy đủ tham số email, pass, username, birthday
    const result = await authService.registerUser(email.trim() || phoneNumber, password, username, birthday);
    if (!result.success) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', 'Account created! We have sent a verification email to your inbox. Please verify it.');
    }
    setLoading(false);
  };

  const SocialButton = ({ title, icon, color, onPress, isCustomIcon = false }: any) => (
    <TouchableOpacity style={styles.socialBtn} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: isCustomIcon ? 'transparent' : color }]}>
        {isCustomIcon ? icon : <Text style={styles.iconText}>{icon}</Text>}
      </View>
      <Text style={styles.socialText}>{title}</Text>
    </TouchableOpacity>
  );

  // --- 3. RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#FE2C55" />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content}>
          {viewMode !== 'social' && (
            <TouchableOpacity onPress={() => setViewMode('social')} style={styles.backBtn}>
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
          )}

          <View style={styles.header}>
            <Text style={styles.title}>{isSignUp ? 'Sign up' : 'Log in'}</Text>
            {viewMode === 'social' && (
              <Text style={styles.subtitle}>
                {isSignUp ? 'Create account, follow others, and more.' : 'Manage account, check notifications, and more.'}
              </Text>
            )}
          </View>

          {/* MÀN HÌNH CHỌN PHƯƠNG THỨC (SOCIAL) */}
          {viewMode === 'social' && (
            <View style={styles.btnList}>
              <SocialButton
                title={isSignUp ? "Continue with phone / email" : "Use phone / email / username"}
                icon={<User color="#000" size={20} />}
                isCustomIcon
                onPress={() => setViewMode('phone')}
              />
              <SocialButton title="Continue with Google" icon="G" color="#4285F4" onPress={() => authService.loginWithGoogle()} />
              <SocialButton title="Continue with Apple" icon="" color="#000" onPress={() => { }} />
              <SocialButton title="Continue with Facebook" icon="f" color="#1877F2" onPress={() => { }} />
            </View>
          )}

          {/* MÀN HÌNH NHẬP PHONE / EMAIL (Shared for Login & Signup) */}
          {(viewMode === 'phone' || viewMode === 'email') && (
            <>
              <View style={styles.tabBar}>
                <TouchableOpacity style={[styles.tab, viewMode === 'phone' && styles.activeTab]} onPress={() => setViewMode('phone')}>
                  <Text style={[styles.tabText, viewMode === 'phone' && styles.activeTabText]}>Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, viewMode === 'email' && styles.activeTab]} onPress={() => setViewMode('email')}>
                  <Text style={[styles.tabText, viewMode === 'email' && styles.activeTabText]}>Email</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Text style={styles.inputLabel}>{viewMode === 'phone' ? 'Phone number' : 'Email address'}</Text>
                {viewMode === 'phone' ? (
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryPicker}><Text>VN +84 ⌄</Text></View>
                    <TextInput style={styles.phoneInput} placeholder="Phone number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
                  </View>
                ) : (
                  <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                )}

                {/* Password chỉ hiện ở tab Email khi Đăng nhập */}
                {viewMode === 'email' && !isSignUp && (
                  <>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
                  </>
                )}

                <TouchableOpacity
                  style={styles.mainBtn}
                  onPress={viewMode === 'phone' ? handlePhoneAuth : handleEmailNextStep}
                >
                  <Text style={styles.mainBtnText}>
                    {viewMode === 'phone' ? 'Send code' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* MÀN HÌNH OTP */}
          {viewMode === 'otp' && (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Enter 6-digit code</Text>
              <TextInput style={[styles.input, { textAlign: 'center', letterSpacing: 5 }]} placeholder="Code" keyboardType="number-pad" maxLength={6} value={otpCode} onChangeText={setOtpCode} />
              <TouchableOpacity style={styles.mainBtn} onPress={handleVerifyOtp}>
                <Text style={styles.mainBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* MÀN HÌNH HOÀN THIỆN THÔNG TIN (Chỉ dành cho Đăng ký) */}
          {viewMode === 'complete_info' && (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />

              <Text style={styles.inputLabel}>Birthday</Text>
              <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={birthday} onChangeText={setBirthday} />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={rePassword} onChangeText={setRePassword} />

              <TouchableOpacity style={styles.mainBtn} onPress={handleFinalRegistration}>
                <Text style={styles.mainBtnText}>Complete Sign up</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</Text>
          <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setViewMode('social'); }}>
            <Text style={styles.footerAction}> {isSignUp ? 'Log in' : 'Sign up'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 999, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 30, paddingTop: 50, paddingBottom: 120 },
  backBtn: { marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#86878B', textAlign: 'center', marginTop: 10 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E1E1E2', marginBottom: 30 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#000' },
  tabText: { fontSize: 16, color: '#86878B', fontWeight: '600' },
  activeTabText: { color: '#000' },
  form: { width: '100%' },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 15, marginTop: 20 },
  phoneInputRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E1E1E2', alignItems: 'center' },
  countryPicker: { paddingVertical: 15, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#E1E1E2' },
  phoneInput: { flex: 1, paddingHorizontal: 15, fontSize: 16 },
  input: { borderBottomWidth: 1, borderBottomColor: '#E1E1E2', paddingVertical: 12, fontSize: 16, color: '#000', marginBottom: 10 },
  mainBtn: { backgroundColor: '#FE2C55', padding: 15, borderRadius: 4, alignItems: 'center', marginTop: 30 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnList: { width: '100%', marginTop: 20 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E1E1E2', padding: 12, borderRadius: 4, marginBottom: 12 },
  iconBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', position: 'absolute', left: 12 },
  iconText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  socialText: { flex: 1, textAlign: 'center', fontWeight: '600', color: '#161823' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#F8F8F8', paddingVertical: 25, flexDirection: 'row', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F1F1F2' },
  footerText: { color: '#161823', fontSize: 15 },
  footerAction: { color: '#FE2C55', fontWeight: 'bold', fontSize: 15 }
});

export default AuthView;