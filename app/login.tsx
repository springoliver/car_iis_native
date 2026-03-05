import { login } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      // Call IIS API for authentication
      // Endpoint: POST /business/login
      // Request: { username: string, password: string }
      // Response: { TennantId, UserId, RoleType, LoginStatus, UserName }
      
      const result = await login(username, password);
      
      if (result.success && result.LoginStatus === 'VALID') {
        // TODO: Store auth data in secure storage (expo-secure-store)
        // Store: TennantId, UserId, UserName, RoleType
        console.log('✅ Login successful!', {
          TennantId: result.TennantId,
          UserId: result.UserId,
          UserName: result.UserName,
          RoleType: result.RoleType,
        });
        
        // Navigate to welcome screen with user data
        router.replace({
          pathname: '/welcome',
          params: {
            userName: result.UserName || username,
            tennantId: result.TennantId?.toString() || '',
            userId: result.UserId || '',
            roleType: result.RoleType || '',
          },
        });
      } else {
        // Check if it's a CORS error
        const isCorsError = result.message?.includes('CORS') || result.message?.includes('Failed to fetch');
        Alert.alert(
          'Login Failed',
          isCorsError 
            ? 'CORS Error: Please test on mobile device/emulator (iOS/Android) instead of web browser. CORS only affects web browsers. Mobile apps don\'t have CORS restrictions.\n\nTo test on mobile:\n• iOS: Press "i" in terminal\n• Android: Press "a" in terminal\n• Physical device: Scan QR code with Expo Go app'
            : (result.message || 'Invalid username or password. Please check and try again.')
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
      const isCorsError = errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch');
      
      Alert.alert(
        'Connection Error',
        isCorsError
          ? 'CORS Error: Please test on mobile device/emulator (iOS/Android) instead of web browser. CORS only affects web browsers. Mobile apps don\'t have CORS restrictions.\n\nTo test on mobile:\n• iOS: Press "i" in terminal\n• Android: Press "a" in terminal\n• Physical device: Scan QR code with Expo Go app'
          : 'Failed to connect to server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      
      {/* Beautiful Gradient Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Login Card */}
        <View style={styles.loginCard}>
          {/* Login Header */}
          <View style={styles.loginHeader}>
            <Text style={styles.loginHeaderText}>Login</Text>
          </View>
          
          {/* Green Separator */}
          <View style={styles.separator} />
          
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <View style={styles.inputUnderline} />
          </View>
          
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <View style={styles.inputUnderline} />
          </View>
          
          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.signInButtonText}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    } : {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
  },
  loginHeader: {
    backgroundColor: '#4A4A4A',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  loginHeaderText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  separator: {
    height: 4,
    backgroundColor: '#4CAF50',
    width: '100%',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  input: {
    fontSize: 18,
    color: '#333',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineStyle: 'none',
  },
  inputUnderline: {
    height: 1.5,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  signInButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
    } : {
      elevation: 4,
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
