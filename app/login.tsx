import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { login } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    setLoading(true);
    
    try {
      // Call IIS API for authentication
      // Format: DRITLC where TLC is tenant identifier (e.g., DR1TLC)
      // API endpoint: https://advantecis-csmwebservicebus.com/api/login
      // Old app only uses username - password is handled server-side or remembered
      
      const result = await login(username, ''); // Password not required in old app
      
      if (result.success && result.authToken) {
        // TODO: Store auth token in secure storage (expo-secure-store)
        // For now, we'll pass it via navigation params or context
        router.replace('/welcome');
      } else {
        Alert.alert(
          'Login Failed',
          result.message || 'Invalid username. Please check and try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Failed to connect to server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Gradient Background */}
      <View style={styles.gradient}>
        {/* Diagonal White Section */}
        <View style={styles.whiteSection} />
        
        {/* Login Card */}
        <View style={styles.loginCard}>
          {/* Login Header */}
          <View style={styles.loginHeader}>
            <Text style={styles.loginHeaderText}>Login</Text>
          </View>
          
          {/* Green Separator */}
          <View style={styles.separator} />
          
          {/* Username/Email Input - Only field needed */}
          <TextInput
            style={styles.input}
            placeholder="james@gmail.com"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.inputUnderline} />
          
          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C5CE7', // Purple-blue gradient base color
  },
  whiteSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '120%',
    height: '65%',
    backgroundColor: '#FFF',
    transform: [{ rotate: '-15deg' }],
    transformOrigin: 'top left',
  },
  loginCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginHeader: {
    backgroundColor: '#4A4A4A',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  loginHeaderText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  separator: {
    height: 3,
    backgroundColor: '#4CAF50',
    width: '100%',
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
    minHeight: 48,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 4,
  },
  signInButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
