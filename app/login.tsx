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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      
      {/* Background Container */}
      <View style={styles.backgroundContainer}>
        {/* Top dark gray section with small purple triangle */}
        <View style={styles.topSection}>
          <View style={styles.topPurpleTriangle} />
        </View>
        
        {/* Main white area */}
        <View style={styles.whiteMainArea}>
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
        
        {/* Bottom purple section with angular white shapes */}
        <View style={styles.bottomPurpleSection}>
          <View style={styles.whiteTriangle1} />
          <View style={styles.whiteTriangle2} />
          <View style={styles.whiteTrapezoid} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
  },
  topSection: {
    height: '15%',
    backgroundColor: '#4A4A4A',
    position: 'relative',
  },
  topPurpleTriangle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 40,
    borderRightWidth: 40,
    borderTopColor: '#6C5CE7',
    borderRightColor: 'transparent',
  },
  whiteMainArea: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: '85%',
    maxWidth: 400,
    padding: 0,
    elevation: 5,
  },
  bottomPurpleSection: {
    height: '25%',
    backgroundColor: '#6C5CE7',
    position: 'relative',
    overflow: 'hidden',
  },
  whiteTriangle1: {
    position: 'absolute',
    top: -30,
    left: '10%',
    width: 0,
    height: 0,
    borderBottomWidth: 60,
    borderRightWidth: 40,
    borderBottomColor: '#FFF',
    borderRightColor: 'transparent',
    transform: [{ rotate: '15deg' }],
  },
  whiteTriangle2: {
    position: 'absolute',
    top: -40,
    left: '40%',
    width: 0,
    height: 0,
    borderBottomWidth: 70,
    borderLeftWidth: 50,
    borderBottomColor: '#FFF',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-10deg' }],
  },
  whiteTrapezoid: {
    position: 'absolute',
    top: -35,
    right: '15%',
    width: 80,
    height: 50,
    backgroundColor: '#FFF',
    transform: [{ rotate: '5deg' }, { skewX: '10deg' }],
  },
  loginHeader: {
    backgroundColor: '#4A4A4A',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 14,
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
    paddingVertical: 14,
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  inputUnderline: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 4,
  },
  signInButton: {
    backgroundColor: '#6C5CE7', // Keep button purple-blue as shown in screenshot
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Use elevation instead of shadow props
    elevation: 3,
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
