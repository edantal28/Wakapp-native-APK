import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/api';

interface Alarm {
  id: string;
  alarm_date: string;
  alarm_time: string;
  target_user: string;
  created_by: string;
  wake_methods: string[];
  is_active: boolean;
  is_approved: boolean;
  media_files?: string[];
  triggered_at?: string;
}

const MyAlarmsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlarms = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/alarms`);
      const data = await response.json();
      
      const sortedAlarms = data.sort((a: Alarm, b: Alarm) => {
        const dateTimeA = new Date(`${a.alarm_date}T${a.alarm_time || '00:00'}`);
        const dateTimeB = new Date(`${b.alarm_date}T${b.alarm_time || '00:00'}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Error fetching alarms:', error);
      setAlarms([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlarms();
  }, [user]);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const deleteAlarm = async (alarmId: string) => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/alarms/${alarmId}?user_id=${user?.id}`,
                { method: 'DELETE' }
              );
              
              if (response.ok) {
                fetchAlarms();
                Alert.alert('Success', 'Alarm deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete alarm');
              }
            } catch (error) {
              console.error('Error deleting alarm:', error);
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  const cloneAlarm = (alarm: Alarm) => {
    navigation.navigate('CreateAlarm', {
      clonedAlarm: {
        alarm_type: alarm.created_by === user?.id ? 'myself' : 'friend',
        target_user_phone: '',
        wake_methods: alarm.wake_methods || [],
        puzzle_pieces: 9,
        original_alarm: alarm
      }
    });
  };

  const handlePlayAlarm = (alarm: Alarm) => {
    if (alarm.created_by === user?.id) {
      Alert.alert(
        'Alarm Content',
        `Date: ${formatDate(alarm.alarm_date)}\nTime: ${formatTime(alarm.alarm_time)}\nWake Methods: ${alarm.wake_methods?.join(', ') || 'None'}\n\nThis alarm contains your uploaded content.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert("Surprise!", "Shh..it's a surprise. You will be able to preview after the Alarm goes off.");
    }
  };

  const navigateToCreateAlarm = (type: 'friend' | 'self') => {
    navigation.navigate('CreateAlarm', { preSelectedType: type });
  };

  const now = new Date();
  const currentAlarms = alarms.filter(alarm => {
    if (!alarm.alarm_date) return true;
    const alarmDateTime = new Date(`${alarm.alarm_date}T${alarm.alarm_time || '00:00'}`);
    return alarmDateTime >= now;
  });

  const pastAlarms = alarms.filter(alarm => {
    if (!alarm.alarm_date) return false;
    const alarmDateTime = new Date(`${alarm.alarm_date}T${alarm.alarm_time || '00:00'}`);
    return alarmDateTime < now;
  });

  const activeAlarms = currentAlarms.filter(alarm => alarm.is_active);
  const pendingAlarms = currentAlarms.filter(alarm => !alarm.is_active);

  const getWakeMethodIcon = (method: string) => {
    switch (method) {
      case 'voice': return '🎤';
      case 'video': return '📹';
      case 'song': return '🎵';
      case 'puzzle': return '🧩';
      default: return '🔔';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchAlarms} />
      }
    >
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToCreateAlarm('friend')}
        >
          <Text style={styles.buttonText}>Ask a Friend to Wake Me Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToCreateAlarm('self')}
        >
          <Text style={styles.buttonText}>Set an Alarm for Yourself</Text>
        </TouchableOpacity>
      </View>

      {activeAlarms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alarms ({activeAlarms.length})</Text>
          {activeAlarms.map((alarm) => (
            <View key={alarm.id} style={styles.alarmCard}>
              <View style={styles.alarmHeader}>
                <View style={styles.alarmTimeContainer}>
                  <Text style={styles.alarmTime}>{formatTime(alarm.alarm_time)}</Text>
                  <Text style={styles.alarmDate}>{formatDate(alarm.alarm_date)}</Text>
                </View>
                
                <View style={styles.alarmActions}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => handlePlayAlarm(alarm)}
                  >
                    <Text style={styles.playButtonText}>▶️ Play</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {alarm.wake_methods && alarm.wake_methods.length > 0 && (
                <View style={styles.wakeMethodsContainer}>
                  {alarm.wake_methods.map((method) => (
                    <View key={method} style={styles.wakeMethodBadge}>
                      <Text style={styles.wakeMethodIcon}>{getWakeMethodIcon(method)}</Text>
                      <Text style={styles.wakeMethodText}>{method}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.alarmFooter}>
                <Text style={styles.alarmCreator}>
                  {alarm.created_by === user?.id ? 'Created by you' : 'Created for you'}
                </Text>
                
                <View style={styles.alarmButtonsRow}>
                  <TouchableOpacity
                    style={styles.cloneButton}
                    onPress={() => cloneAlarm(alarm)}
                  >
                    <Text style={styles.cloneButtonText}>📄 Clone</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteAlarm(alarm.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {pendingAlarms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Approval ({pendingAlarms.length})</Text>
          {pendingAlarms.map((alarm) => (
            <View key={alarm.id} style={[styles.alarmCard, styles.pendingAlarm]}>
              <View style={styles.alarmHeader}>
                <View style={styles.alarmTimeContainer}>
                  <Text style={styles.alarmTime}>{formatTime(alarm.alarm_time)}</Text>
                  <Text style={styles.alarmDate}>{formatDate(alarm.alarm_date)}</Text>
                </View>
                
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>

              <Text style={styles.alarmCreator}>
                Waiting for friend approval
              </Text>
            </View>
          ))}
        </View>
      )}

      {pastAlarms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Alarms ({pastAlarms.length})</Text>
          {pastAlarms.map((alarm) => (
            <View key={alarm.id} style={[styles.alarmCard, styles.pastAlarm]}>
              <View style={styles.alarmHeader}>
                <View style={styles.alarmTimeContainer}>
                  <Text style={styles.alarmTime}>{formatTime(alarm.alarm_time)}</Text>
                  <Text style={styles.alarmDate}>{formatDate(alarm.alarm_date)}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.pastPlayButton}
                  onPress={() => handlePlayAlarm(alarm)}
                >
                  <Text style={styles.pastPlayButtonText}>▶️ Play</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.alarmFooter}>
                <Text style={styles.alarmCreator}>
                  {alarm.created_by === user?.id ? 'Created by you' : 'Created for you'}
                </Text>
                
                <TouchableOpacity
                  style={styles.cloneButton}
                  onPress={() => cloneAlarm(alarm)}
                >
                  <Text style={styles.cloneButtonText}>📄 Clone</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {alarms.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No alarms set</Text>
          <Text style={styles.emptySubtext}>
            Create your first alarm using the buttons above
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  buttonContainer: {
    padding: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#ff6b9d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  alarmCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderColor: '#374151',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  pendingAlarm: {
    borderColor: '#f59e0b',
    backgroundColor: '#1f1a0f',
  },
  pastAlarm: {
    opacity: 0.7,
    backgroundColor: '#171717',
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alarmTimeContainer: {
    flex: 1,
  },
  alarmTime: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  alarmDate: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pastPlayButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pastPlayButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  wakeMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  wakeMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderColor: '#ff6b9d',
    borderWidth: 1,
  },
  wakeMethodIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  wakeMethodText: {
    color: '#ff6b9d',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  alarmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmCreator: {
    color: '#9ca3af',
    fontSize: 14,
    flex: 1,
  },
  alarmButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cloneButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cloneButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MyAlarmsScreen;

