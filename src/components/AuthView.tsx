import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { firebase } from '@react-native-firebase/auth';
import { firebase as firestoreFirebase } from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const auth = firebase.auth;
const firestore = firestoreFirebase.firestore;

const AuthView = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        const { user } = await auth().createUserWithEmailAndPassword(email, password);
        await firestore().collection('users').doc(user.uid).set({
          uid: user.uid,
          username: username || email.split('@')[0],
          email: email,
          avatarUrl: 'https://picsum.photos/200/200',
          bio: 'Just joined Tictoc!',
          followersCount: 0,
          followingCount: 0
        });
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(data?.idToken!);
      await auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Google Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.title}>Tictoc</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Create an account to start sharing' : 'Log in to your account'}
          </Text>
        </View>

        <View style={styles.form}>
          {isRegistering && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={[styles.mainButton, loading && styles.buttonDisabled]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainButtonText}>
                {isRegistering ? 'Sign up' : 'Log in'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.googleIconContainer}>
               <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.footer} 
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={styles.footerText}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <Text style={styles.footerAction}> {isRegistering ? 'Log in' : 'Sign up'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { 
    width: 70, height: 70, backgroundColor: '#000', 
    borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 
  },
  logoText: { color: '#fff', fontSize: 36, fontWeight: '900' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
  form: { width: '100%' },
  input: { 
    backgroundColor: '#F1F1F2', padding: 16, borderRadius: 4, 
    marginBottom: 12, fontSize: 15, color: '#000' 
  },
  mainButton: { 
    backgroundColor: '#FE2C55', padding: 16, borderRadius: 4, 
    alignItems: 'center', marginTop: 12 
  },
  buttonDisabled: { opacity: 0.6 },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E1E1E2' },
  dividerText: { marginHorizontal: 16, color: '#8A8B91', fontSize: 12, fontWeight: '600' },
  googleButton: { 
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, 
    borderColor: '#E1E1E2', padding: 12, borderRadius: 4, justifyContent: 'center' 
  },
  googleIconContainer: { 
    width: 24, height: 24, backgroundColor: '#4285F4', 
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 
  },
  googleIconText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  googleButtonText: { color: '#161823', fontSize: 15, fontWeight: '600' },
  footer: { 
    position: 'absolute', bottom: 40, left: 0, right: 0, 
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F1F2', paddingTop: 20 
  },
  footerText: { color: '#161823', fontSize: 14 },
  footerAction: { color: '#FE2C55', fontWeight: 'bold' }
});

export default AuthView;
