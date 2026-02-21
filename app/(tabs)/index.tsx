import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { JobCard, Job } from '@/components/job-card';
import { mockJobs } from '@/data/mock-jobs';

type TabType = 'open' | 'in-progress' | 'completed';

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [loading, setLoading] = useState(false);

  const openJobs = jobs.filter(job => job.status === 'open');
  const inProgressJobs = jobs.filter(job => job.status === 'in-progress');
  const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'no-show');

  const handleStart = (jobId: string) => {
    setLoading(true);
    setTimeout(() => {
      setJobs(jobs.map(job => 
        job.requestId === jobId ? { ...job, status: 'in-progress' as const } : job
      ));
      setLoading(false);
      setActiveTab('in-progress');
    }, 500);
  };

  const handleNoShow = (jobId: string) => {
    setLoading(true);
    setTimeout(() => {
      setJobs(jobs.map(job => 
        job.requestId === jobId ? { ...job, status: 'no-show' as const } : job
      ));
      setLoading(false);
      setActiveTab('completed');
    }, 500);
  };

  const handleStop = (jobId: string) => {
    setLoading(true);
    setTimeout(() => {
      setJobs(jobs.map(job => 
        job.requestId === jobId ? { ...job, status: 'completed' as const } : job
      ));
      setLoading(false);
      setActiveTab('completed');
    }, 500);
  };

  const handleCancel = (jobId: string) => {
    // Cancel action - could remove from list or mark as cancelled
    console.log('Cancel job:', jobId);
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
        {jobsToShow.map((job) => (
          <JobCard
            key={job.requestId}
            job={job}
            onStart={() => handleStart(job.requestId)}
            onNoShow={() => handleNoShow(job.requestId)}
            onStop={() => handleStop(job.requestId)}
            onCancel={() => handleCancel(job.requestId)}
          />
        ))}
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
