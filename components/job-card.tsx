import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface Job {
  webeventid?: number; // Primary ID from database (used in stored procedure)
  requestId?: string; // Legacy/compatibility field
  name: string;
  location: string;
  date: string;
  appointmentTime: string;
  duration: string;
  status?: 'open' | 'in-progress' | 'completed' | 'no-show';
  phone?: string;
  eventstatus?: number; // From database: 1, 14, 16, 19, 21, 30
  action?: string; // Current action from database
}

interface JobCardProps {
  job: Job;
  onStart?: () => void;
  onNoShow?: () => void;
  onStop?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function JobCard({ job, onStart, onNoShow, onStop, onCancel, showActions = true }: JobCardProps) {
  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return '#4CAF50';
      case 'no-show':
        return '#F44336';
      case 'in-progress':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'completed':
        return 'Service Completed';
      case 'no-show':
        return 'No show';
      case 'in-progress':
        return 'Service Started';
      default:
        return '';
    }
  };

  const displayId = job.webeventid || job.requestId || 'N/A';

  return (
    <View style={styles.card}>
      <Text style={styles.requestId}>#Request ID : {displayId}</Text>
      
      <View style={styles.details}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{job.name}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{job.location} {job.phone && job.phone}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{job.date}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.label}>Appointment Time:</Text>
        <Text style={styles.value}>{job.appointmentTime}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.label}>Duration:</Text>
        <Text style={styles.value}>{job.duration}</Text>
      </View>

      {job.status && (
        <View style={styles.details}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          {job.status === 'open' && (
            <>
              <TouchableOpacity style={[styles.button, styles.startButton]} onPress={onStart}>
                <Text style={styles.buttonText}>START</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.noShowButton]} onPress={onNoShow}>
                <Text style={styles.buttonText}>NO SHOW</Text>
              </TouchableOpacity>
            </>
          )}
          {job.status === 'in-progress' && (
            <>
              <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={onStop}>
                <Text style={styles.buttonText}>STOP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                <Text style={styles.buttonText}>CANCEL</Text>
              </TouchableOpacity>
            </>
          )}
          {job.status === 'completed' && (
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>CANCEL</Text>
            </TouchableOpacity>
          )}
          {job.status === 'no-show' && (
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  requestId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 140,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#20B2AA', // Teal-green color matching images
  },
  noShowButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#20B2AA', // Teal-green color matching images
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
