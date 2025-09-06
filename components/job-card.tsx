import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface Job {
  webeventid?: number; // Primary ID from database (used in stored procedure)
  EventId?: number; // Driver event ID
  requestId?: string; // Legacy/compatibility field
  name: string;
  FullName?: string; // Full name from driver event
  location: string;
  CustomerAddress?: string; // Address from driver event
  City?: string; // City from driver event
  date: string;
  appointmentTime: string;
  duration: string;
  status?: 'open' | 'in-progress' | 'completed' | 'no-show';
  phone?: string;
  HomePhone?: string; // Phone from driver event
  EventStatus?: string; // Status string: "CHECKEDIN", "CHECKEDOUT", etc.
  Event?: string; // Event type: "pickup", "drop off"
  Route?: number; // Route number
  eventstatus?: number; // From database: 1, 14, 16, 19, 21, 30
  action?: string; // Current action from database
  note?: string; // Optional note field (40 characters max)
}

interface JobCardProps {
  job: Job;
  onStart?: () => void;
  onNoShow?: () => void;
  onStop?: () => void;
  onCancel?: () => void;
  onReopen?: () => void;
  onNoteChange?: (note: string) => void;
  showActions?: boolean;
}

export function JobCard({ job, onStart, onNoShow, onStop, onCancel, onReopen, onNoteChange, showActions = true }: JobCardProps) {
  const displayId = job.EventId || job.webeventid || job.requestId || 'N/A';
  const displayName = job.FullName || job.name;
  const displayLocation = job.CustomerAddress || job.location;
  const displayPhone = job.HomePhone || job.phone;
  const displayCity = job.City ? `, ${job.City}` : '';
  const [note, setNote] = useState(job.note || '');

  // Sync note state when job prop changes
  useEffect(() => {
    setNote(job.note || '');
  }, [job.note]);

  // Get status display text for status row
  const getStatusText = (): string => {
    if (job.status === 'in-progress') {
      // In-progress: service started
      return 'Service Started';
    }

    if (job.status === 'completed') {
      // Completed: service completed
      return 'Service Completed';
    }

    if (job.status === 'no-show') {
      // No-show: text exactly as in reference
      return 'No show';
    }
    return '';
  };

  return (
    <View style={styles.card}>
      {/* Request ID - Top Right */}
      <View style={styles.requestIdContainer}>
        <Text style={styles.requestId}>#Request ID : {displayId}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Name</Text>
          <Text style={styles.colon}> :</Text>
        </View>
        <Text style={styles.value}>{displayName}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Location</Text>
          <Text style={styles.colon}> :</Text>
        </View>
        <Text style={styles.value}>{displayLocation}{displayCity}</Text>
      </View>

      {displayPhone && (
        <View style={styles.details}>
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>Phone</Text>
            <Text style={styles.colon}> :</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (displayPhone) {
                Linking.openURL(`tel:${displayPhone}`).catch(() => {});
              }
            }}
          >
            <Text style={[styles.value, styles.phoneLink]}>{displayPhone}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.details}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Date</Text>
          <Text style={styles.colon}> :</Text>
        </View>
        <Text style={styles.value}>{job.date}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Appointment Time</Text>
          <Text style={styles.colon}> :</Text>
        </View>
        <Text style={styles.value}>{job.appointmentTime || ''}</Text>
      </View>

      {/* Client feedback: visible duration field is not required */}

      {(job.status === 'in-progress' || job.status === 'completed' || job.status === 'no-show') && (
        <View style={styles.details}>
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>Status</Text>
            <Text style={styles.colon}> :</Text>
          </View>
          <Text style={styles.value}>{getStatusText()}</Text>
        </View>
      )}

      {/* Note field - 40 characters max */}
      <View style={styles.details}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Note</Text>
          <Text style={styles.colon}> :</Text>
        </View>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={(text) => {
            const trimmedText = text.substring(0, 40); // Max 40 characters
            setNote(trimmedText);
            if (onNoteChange) {
              onNoteChange(trimmedText);
            }
          }}
          placeholder="Add note (40 chars max)"
          placeholderTextColor="#999"
          maxLength={40}
          multiline={false}
        />
      </View>

      {showActions && (
        <View style={styles.actions}>
          {/* TO DO list: main actions are Pick Up and No Show (Cancel) */}
          {job.status === 'open' && (
            <>
              <TouchableOpacity style={[styles.button, styles.startButton]} onPress={onStart}>
                <Text style={styles.buttonText}>PICK UP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.noShowButton]} onPress={onNoShow}>
                <Text style={styles.buttonText}>NO SHOW</Text>
              </TouchableOpacity>
            </>
          )}

          {/* DONE list: REOPEN button to move back to TO DO */}
          {job.status !== 'open' && (
            <>
              {onReopen && (
                <TouchableOpacity style={[styles.button, styles.reopenButton]} onPress={onReopen}>
                  <Text style={styles.buttonText}>REOPEN</Text>
                </TouchableOpacity>
              )}
            </>
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
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  requestIdContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  requestId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    width: 160,
    position: 'relative',
    alignItems: 'center',
    paddingRight: 8, // Space for colon
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
    flex: 1,
  },
  colon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    position: 'absolute',
    right: 0,
    paddingRight: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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
    backgroundColor: '#20B2AA', // Teal-green color matching screenshots
  },
  stopButton: {
    backgroundColor: '#20B2AA', // Green color matching screenshots
  },
  callButton: {
    backgroundColor: '#20B2AA',
  },
  reopenButton: {
    backgroundColor: '#FF9800', // Orange color for reopen action
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  phoneLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF',
  },
});
