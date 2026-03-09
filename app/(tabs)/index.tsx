import { Job, JobCard } from '@/components/job-card';
import { driverEventToJob, getDriverEvents, updateDriverEventStatus, type UpdateDriverEventStatusRequest } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabType = 'open' | 'in-progress' | 'completed';

interface UserData {
  tennantId: number;
  userId: string;
  userName: string;
  roleType: string;
}

export default function JobsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const openJobs = jobs.filter(job => job.status === 'open');
  const inProgressJobs = jobs.filter(job => job.status === 'in-progress');
  const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'no-show');

  // Load user data and fetch driver events
  useEffect(() => {
    (async () => {
      try {
        // Load user data from storage
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const user: UserData = JSON.parse(storedData);
          setUserData(user);
          
          // Fetch driver events
          await fetchDriverEvents(user);
        } else {
          Alert.alert('Error', 'Please log in first');
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize. Please try again.');
      } finally {
        setLoading(false);
      }
      
      // Get GPS location (non-blocking - runs independently)
      // This won't block the app if location is unavailable
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            try {
              const locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setLocation({
                latitude: locationData.coords.latitude,
                longitude: locationData.coords.longitude,
              });
              console.log('✅ GPS location obtained:', locationData.coords.latitude, locationData.coords.longitude);
            } catch (locationError) {
              console.warn('⚠️ Could not get current location, using default:', locationError);
              // Use default location if location unavailable (e.g., emulator without location set)
              setLocation({ latitude: 40.7128, longitude: -74.0060 });
            }
          } else {
            console.warn('⚠️ Location permission denied, using default location');
            // Use default location if permission denied
            setLocation({ latitude: 40.7128, longitude: -74.0060 });
          }
        } catch (locationPermissionError) {
          console.warn('⚠️ Location permission error, using default location:', locationPermissionError);
          // Use default location if permission request fails
          setLocation({ latitude: 40.7128, longitude: -74.0060 });
        }
      })();
    })();
  }, []);

  const fetchDriverEvents = async (user: UserData) => {
    try {
      setLoading(true);
      const driverEvents = await getDriverEvents(user.userName, user.userId, user.tennantId);
      
      // Convert DriverEvent to Job format
      const jobsList = driverEvents.map(driverEventToJob);
      setJobs(jobsList);
      
      console.log('✅ Loaded', jobsList.length, 'driver events');
    } catch (error) {
      console.error('❌ Fetch driver events error:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobUpdate = async (
    jobId: string,
    action: 'CHECKEDIN' | 'CHECKEDOUT' | 'NOSHOW' | 'CANCELALL' | 'CANCELDROPOFF',
    newStatus: 'in-progress' | 'completed' | 'no-show'
  ) => {
    if (!userData) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    const job = jobs.find(j => (j.EventId?.toString() || j.requestId || j.webeventid?.toString()) === jobId);
    if (!job) {
      Alert.alert('Error', 'Job not found');
      return;
    }

    setLoading(true);

    try {
      // Get GPS coordinates
      const latitude = location?.latitude?.toString() || '0';
      const longitude = location?.longitude?.toString() || '0';

      // Build update request
      const updateRequest: UpdateDriverEventStatusRequest = {
        EventId: job.EventId || job.webeventid || parseInt(job.requestId || '0'),
        EventStatus: action,
        Latitude: latitude,
        Longitude: longitude,
        TenantId: userData.tennantId,
        UserName: userData.userName,
      };

      const result = await updateDriverEventStatus(updateRequest);

      if (result.success) {
        // Refresh driver events to get updated status
        await fetchDriverEvents(userData);
        
        // Switch to appropriate tab
        if (newStatus === 'in-progress') {
          setActiveTab('in-progress');
        } else if (newStatus === 'completed' || newStatus === 'no-show') {
          setActiveTab('completed');
        }
      } else {
        Alert.alert('Update Failed', result.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (jobId: string) => {
    handleJobUpdate(jobId, 'CHECKEDIN', 'in-progress');
  };

  const handleNoShow = (jobId: string) => {
    handleJobUpdate(jobId, 'NOSHOW', 'no-show');
  };

  const handleStop = (jobId: string) => {
    handleJobUpdate(jobId, 'CHECKEDOUT', 'completed');
  };

  const handleCancel = (jobId: string) => {
    handleJobUpdate(jobId, 'CANCELALL', 'no-show');
  };

  const handleBack = () => {
    router.back();
  };

  const renderJobs = () => {
    let jobsToShow: Job[] = [];
    let emptyMessage = '';

    switch (activeTab) {
      case 'open':
        jobsToShow = openJobs;
        emptyMessage = 'No Appointments at this moment';
        break;
      case 'in-progress':
        jobsToShow = inProgressJobs;
        emptyMessage = 'No Jobs In-Progress at this moment';
        break;
      case 'completed':
        jobsToShow = completedJobs;
        emptyMessage = 'No Appointments Completed at this moment';
        break;
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      );
    }

    if (jobsToShow.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.jobsList}>
        {jobsToShow.map((job) => {
          const jobId = job.EventId?.toString() || job.webeventid?.toString() || job.requestId || '';
          return (
            <JobCard
              key={jobId}
              job={job}
              onStart={() => handleStart(jobId)}
              onNoShow={() => handleNoShow(jobId)}
              onStop={() => handleStop(jobId)}
              onCancel={() => handleCancel(jobId)}
            />
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button - Top Left */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        
        {/* Logo Container - Centered */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CSM</Text>
          </View>
          <Text style={styles.appName}>Client Services Management Software</Text>
        </View>
        
        {/* Welcome Text - Top Right */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome, {userData?.userName || 'User'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, styles.tabWithBorder, activeTab === 'open' && styles.activeTab]}
          onPress={() => setActiveTab('open')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
            OPEN JOBS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabWithBorder, activeTab === 'in-progress' && styles.activeTab]}
          onPress={() => setActiveTab('in-progress')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'in-progress' && styles.activeTabText]}>
            JOBS IN-PROGRESS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            JOBS COMPLETED
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderJobs()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#20B2AA', // Teal-green color matching images
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    minHeight: 140,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    } : {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    }),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appName: {
    fontSize: 12,
    color: '#FFF',
    textAlign: 'center',
  },
  welcomeContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#20B2AA', // Teal-green background matching images
    borderTopWidth: 1,
    borderTopColor: '#1A9A92',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#20B2AA',
  },
  tabWithBorder: {
    borderRightWidth: 1,
    borderRightColor: '#FFF',
  },
  activeTab: {
    backgroundColor: '#20B2AA',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF', // White text on green background
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: '#FFF', // White text on green background
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  jobsList: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
