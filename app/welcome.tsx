import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userName = params.userName as string || 'User';
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const handleAppointmentPress = async () => {
    // Store user data for jobs screen
    if (params.tennantId && params.userId && params.userName) {
      await AsyncStorage.setItem('userData', JSON.stringify({
        tennantId: params.tennantId,
        userId: params.userId,
        userName: params.userName,
        roleType: params.roleType,
      }));
    }
    router.push('/(tabs)/' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CSM</Text>
          </View>
          <Text style={styles.appName}>Client Services Management Software</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} style={styles.scrollView}>
        <Text style={styles.welcomeText}>Welcome, {userName}</Text>
        
        <View style={styles.dateCard}>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.appointmentButton}
          onPress={handleAppointmentPress}
        >
          <Text style={styles.appointmentButtonText}>TODAY'S APPOINTMENT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#20B2AA', // Teal-green color matching images
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appName: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  dateCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  appointmentButton: {
    backgroundColor: '#20B2AA', // Teal-green color matching images
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
