import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { JobCard, Job } from '@/components/job-card';
import { mockJobs } from '@/data/mock-jobs';
import { updateJobStatus, getTodayJobs, type JobUpdateRequest } from '@/services/api';
import { parseUserLogon } from '@/utils/auth';

type TabType = 'open' | 'in-progress' | 'completed';

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string>(''); // TODO: Get from secure storage
  const [userLogon, setUserLogon] = useState<string>(''); // TODO: Get from login
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const openJobs = jobs.filter(job => job.status === 'open');
  const inProgressJobs = jobs.filter(job => job.status === 'in-progress');
  const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'no-show');

  // Get current GPS location
  useEffect(() => {
    (async () => {
      try {
        // TODO: Install expo-location: npx expo install expo-location
        // For now, using mock location
        // const { status } = await Location.requestForegroundPermissionsAsync();
        // if (status === 'granted') {
        //   const locationData = await Location.getCurrentPositionAsync({});
        //   setLocation({
        //     latitude: locationData.coords.latitude,
        //     longitude: locationData.coords.longitude,
        //   });
        // }
        // Mock location for testing
        setLocation({ latitude: 40.7128, longitude: -74.0060 }); // NYC coordinates
      } catch (error) {
        console.error('Location error:', error);
      }
    })();
  }, []);

  const handleJobUpdate = async (
    jobId: string,
    action: 'Checkedin' | 'Checkedout' | 'NoShow' | 'CancelALL',
    newStatus: 'in-progress' | 'completed' | 'no-show'
  ) => {
    if (!authToken || !userLogon) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    const job = jobs.find(j => (j.requestId || j.webeventid?.toString()) === jobId);
    if (!job) {
      Alert.alert('Error', 'Job not found');
      return;
    }

    setLoading(true);

    try {
      // Parse user logon to get tenant ID
      const userInfo = parseUserLogon(userLogon);
      if (!userInfo) {
        throw new Error('Invalid user logon format');
      }

      // Get GPS coordinates
      const latitude = location?.latitude?.toString() || '0';
      const longitude = location?.longitude?.toString() || '0';

      // Build update request matching stored procedure parameters
      const updateRequest: JobUpdateRequest = {
        eventid: job.webeventid || parseInt(job.requestId || '0'),
        action: action,
        latitude: latitude,
        longitude: longitude,
        userLogon: userLogon,
        tennantid: userInfo.tennantid,
        role: 'Driver', // App is for drivers
        authToken: authToken,
      };

      const result = await updateJobStatus(updateRequest);

      if (result.success) {
        // Update local state
        setJobs(jobs.map(j => 
          (j.requestId || j.webeventid?.toString()) === jobId 
            ? { ...j, status: newStatus as any } 
            : j
        ));
        
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (jobId: string) => {
    handleJobUpdate(jobId, 'Checkedin', 'in-progress');
  };

  const handleNoShow = (jobId: string) => {
    handleJobUpdate(jobId, 'NoShow', 'no-show');
  };

  const handleStop = (jobId: string) => {
    handleJobUpdate(jobId, 'Checkedout', 'completed');
  };

  const handleCancel = (jobId: string) => {
    handleJobUpdate(jobId, 'CancelALL', 'no-show');
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
          const jobId = job.webeventid?.toString() || job.requestId || '';
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
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CSM</Text>
          </View>
          <Text style={styles.appName}>Client Services Management Software</Text>
        </View>
        <View style={styles.headerBottom}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Welcome, jfishxxx</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && styles.activeTab]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
            OPEN JOBS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'in-progress' && styles.activeTab]}
          onPress={() => setActiveTab('in-progress')}
        >
          <Text style={[styles.tabText, activeTab === 'in-progress' && styles.activeTabText]}>
            JOBS IN-PROGRESS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
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
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#20B2AA', // Teal-green background matching images
    marginHorizontal: 2,
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: '#20B2AA', // Teal-green color matching images
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF', // White text on green background
  },
  activeTabText: {
    color: '#FFF', // White text on green background
  },
  content: {
    flex: 1,
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
    color: '#666',
    textAlign: 'center',
  },
});
