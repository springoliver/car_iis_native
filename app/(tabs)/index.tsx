import { Job, JobCard } from '@/components/job-card';
import { appointmentEventToJob, driverEventToJob, getApplicationEvents, getDriverEvents, updateAppointmentStatus, updateDriverEventStatus, type UpdateAppointmentStatusRequest, type UpdateDriverEventStatusRequest } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [statusMessage, setStatusMessage] = useState<{ name: string; status: string } | null>(null);
  const slideAnim = useRef(new Animated.Value(-200)).current; // Start above screen
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const openJobs = jobs.filter(job => job.status === 'open');
  const inProgressJobs = jobs.filter(job => job.status === 'in-progress');
  const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'no-show');

  // Animate status banner when statusMessage changes
  useEffect(() => {
    if (statusMessage) {
      // Reset to initial position first (above screen, invisible)
      slideAnim.setValue(-200);
      opacityAnim.setValue(0);
      
      // Use requestAnimationFrame to ensure the reset is applied before animation starts
      requestAnimationFrame(() => {
        // Slide down and fade in
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0, // Center position
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // After 3 seconds, slide up and fade out
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -200, // Slide up above screen
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Clear status message after animation completes
          setStatusMessage(null);
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset animation values when statusMessage is cleared
      slideAnim.setValue(-200);
      opacityAnim.setValue(0);
    }
  }, [statusMessage]);

  // Clear status banner when switching tabs (to prevent banner from persisting)
  useEffect(() => {
    if (statusMessage) {
      // Immediately hide the banner when tab changes
      slideAnim.stopAnimation();
      opacityAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStatusMessage(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
      
      // Try getApplicationEvents first (has StartTime, EndTime, Duration, Time fields)
      // If that fails or returns empty, fall back to getDriverEvents
      let jobsList: Job[] = [];
      
      try {
        const appointmentEvents = await getApplicationEvents(user.userName);
        if (appointmentEvents && appointmentEvents.length > 0) {
          // Convert AppointmentEvent to Job format
          jobsList = appointmentEvents.map(appointmentEventToJob);
          console.log('✅ Loaded', jobsList.length, 'appointment events');
        } else {
          // Fall back to driver events if appointment events are empty
          console.log('⚠️ No appointment events, trying driver events...');
          const driverEvents = await getDriverEvents(user.userName, user.userId, user.tennantId);
          jobsList = driverEvents.map(driverEventToJob);
          console.log('✅ Loaded', jobsList.length, 'driver events');
        }
      } catch (appointmentError) {
        // If getApplicationEvents fails, try getDriverEvents
        console.warn('⚠️ getApplicationEvents failed, trying getDriverEvents:', appointmentError);
        const driverEvents = await getDriverEvents(user.userName, user.userId, user.tennantId);
        jobsList = driverEvents.map(driverEventToJob);
        console.log('✅ Loaded', jobsList.length, 'driver events');
      }
      
      setJobs(jobsList);
    } catch (error) {
      console.error('❌ Fetch events error:', error);
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

    const displayName = job.FullName || job.name;
    setLoading(true);

    try {
      // Get GPS coordinates
      const latitude = location?.latitude?.toString() || '0';
      const longitude = location?.longitude?.toString() || '0';

      // Determine which API to use based on job type
      // Driver events have 'Event' field (pickup/drop off), appointment events don't
      // Appointment events come from getApplicationEvents, driver events from getDriverEvents
      // If job has 'Event' field, it's a driver event, otherwise check if it's an appointment event
      // Appointment events: no Event field, have webeventid from WebEventId
      // Driver events: have Event field (pickup/drop off), EventId from driver events
      const hasEventField = job.Event !== undefined && job.Event !== null;
      const isAppointmentEvent = !hasEventField && (job.webeventid !== undefined && job.webeventid !== null);
      
      console.log('🔵 Job update detection:', {
        jobId,
        hasEventField,
        Event: job.Event,
        webeventid: job.webeventid,
        EventId: job.EventId,
        isAppointmentEvent,
        action,
        EventStatus: job.EventStatus,
      });
      
      let result: { success: boolean; message?: string };
      
      if (isAppointmentEvent) {
        console.log('🔵 Using updateAppointmentStatus API');
        // Use appointment status update API (uses WebEventId)
        const updateRequest: UpdateAppointmentStatusRequest = {
          WebEventId: job.webeventid!,
          EventStatus: action,
          Latitude: latitude,
          Longitude: longitude,
          TenantId: userData.tennantId,
          UserName: userData.userName,
        };
        result = await updateAppointmentStatus(updateRequest);
      } else {
        console.log('🔵 Using updateDriverEventStatus API');
        // Use driver event status update API (uses EventId)
        const updateRequest: UpdateDriverEventStatusRequest = {
          EventId: job.EventId || parseInt(job.requestId || '0'),
          EventStatus: action,
          Latitude: latitude,
          Longitude: longitude,
          TenantId: userData.tennantId,
          UserName: userData.userName,
        };
        result = await updateDriverEventStatus(updateRequest);
      }

      if (result.success) {
        // Show status banner
        const statusText = action === 'CHECKEDIN' ? 'Service Started' : 
                          action === 'CHECKEDOUT' ? 'Service Stopped' :
                          action === 'NOSHOW' ? 'No Show' : 'Cancelled';
        setStatusMessage({ name: displayName, status: statusText });
        // Animation and auto-hide handled by useEffect
        
        // Switch to appropriate tab FIRST (before refresh)
        // This ensures the tab is ready when the updated jobs arrive
        if (newStatus === 'in-progress') {
          setActiveTab('in-progress');
        } else if (newStatus === 'completed' || newStatus === 'no-show') {
          setActiveTab('completed');
        }
        
        // Refresh events to get updated status
        // This will update the jobs list with the new status
        await fetchDriverEvents(userData);
      } else {
        console.error('❌ Update failed:', result.message);
        Alert.alert('Update Failed', result.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update job';
      Alert.alert('Error', errorMessage);
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
      <View style={styles.jobsContainer}>
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
        {statusMessage && (
          <View style={styles.statusBannerOverlay} pointerEvents="none">
            <Animated.View
              style={[
                styles.statusBanner,
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.statusBannerText}>
                {statusMessage.name} - {statusMessage.status}
              </Text>
            </Animated.View>
          </View>
        )}
      </View>
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
    backgroundColor: '#F5F5F5',
  },
  jobsContainer: {
    flex: 1,
    position: 'relative',
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
  statusBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through to content below
    zIndex: 1000,
  },
  statusBanner: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    } : {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  statusBannerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
