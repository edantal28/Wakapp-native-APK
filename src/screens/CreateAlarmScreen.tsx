import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/api';

const { width } = Dimensions.get('window');

const CreateAlarmScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const { preSelectedType, preSelectedFriend, clonedAlarm } = route.params || {};
  
  const [alarmType, setAlarmType] = useState(preSelectedType || 'myself');
  const [selectedFriend, setSelectedFriend] = useState(preSelectedFriend || null);
  const [friends, setFriends] = useState([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [wakeMethods, setWakeMethods] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: any}>({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const wakeMethodOptions = [
    { id: 'voice', label: 'Voice', icon: '🎤' },
    { id: 'video', label: 'Video', icon: '📹' },
    { id: 'song', label: 'Song', icon: '🎵' },
    { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
  ];

  useEffect(() => {
    const now = new Date();
    setDate(now);
    setTime(now);
  }, []);

  useEffect(() => {
    if (clonedAlarm) {
      setWakeMethods(clonedAlarm.wake_methods || []);
      setAlarmType(clonedAlarm.alarm_type || 'myself');
    }
  }, [clonedAlarm]);

  useEffect(() => {
    if (alarmType === 'friend') {
      fetchFriends();
    }
  }, [alarmType]);

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/friends`);
      const data = await response.json();
      const acceptedFriends = data.filter((f: any) => f.status === 'accepted');
      setFriends(acceptedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const formatDateTime = (dateObj: Date, timeObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(timeObj.getHours()).padStart(2, '0');
    const minutes = String(timeObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toggleWakeMethod = (methodId: string) => {
    setWakeMethods(prev => {
      if (prev.includes(methodId)) {
        return prev.filter(id => id !== methodId);
      } else {
        return [...prev, methodId];
      }
    });
  };

  const handleFileUpload = async (methodType: string) => {
    try {
	let documentTypes = '*/*';
      
      switch (methodType) {
        case 'voice':
        case 'song':
          documentTypes = 'audio/*';
          break;
        case 'video':
          documentTypes = 'video/*';
          break;
        case 'puzzle':
          documentTypes = 'image/*';
          break;
        default:
          documentTypes = '*/*';
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: documentTypes,
        multiple: false,
      });

              const file = result[0]; if (result.type === 'success') {
        const file = result;
        setUploadedFiles(prev => ({
          ...prev,
          [methodType]: {
            name: file.name,
            uri: file.uri,
            type: file.type,
            size: file.size,
          }
        }));

        Alert.alert(
          'File Uploaded',
          `${file.name} has been selected for ${methodType} wake method.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled file picker');
      } else {
        console.error('Error picking file:', error);
        Alert.alert('Error', 'Failed to select file. Please try again.');
      }
    }
  };

  const validateForm = () => {
    if (wakeMethods.length === 0) {
      setValidationMessage('❌ Please select at least one wake-up method (Voice, Video, Song, or Puzzle)');
      setShowValidationModal(true);
      return false;
    }

    const methodsWithoutMedia = wakeMethods.filter(method => !uploadedFiles[method]);
    if (methodsWithoutMedia.length > 0) {
      setValidationMessage('Hey, you forgot to upload a media. Please upload or create media.');
      setShowValidationModal(true);
      return false;
    }

    return true;
  };

  const createAlarm = async () => {
    if (!user) return;

    if (!validateForm()) {
      return;
    }

    if (alarmType === 'friend' && !selectedFriend) {
      Alert.alert('Error', 'Please select a friend');
      return;
    }

    const alarmDateTime = formatDateTime(date, time);
    
    try {
      const alarmData = {
        user_id: user.id,
        target_user: alarmType === 'friend' ? selectedFriend?.friend_id : user.id,
        alarm_date: alarmDateTime,
        wake_methods: wakeMethods,
        uploaded_files: uploadedFiles,
      };

      const response = await fetch(`${API_URL}/alarms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alarmData),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Alarm Set Successfully! 🎉',
          `Your ${alarmType} alarm has been created for ${formatDateTime(date, time)}`,
          [
            {
              text: 'View My Alarms',
              onPress: () => navigation.navigate('MyAlarms'),
            },
            {
              text: 'Create Another',
              onPress: () => {
                setWakeMethods([]);
                setUploadedFiles({});
                setSelectedFriend(null);
                const now = new Date();
                setDate(now);
                setTime(now);
              },
            },
          ]
        );
      } else {
        throw new Error(result.detail || 'Server request failed');
      }
    } catch (error) {
      console.error('Error creating alarm:', error);
      Alert.alert('Error', 'Failed to create alarm. Please try again.');
    }
  };

  const navigateToFriends = () => {
    navigation.navigate('Friends');
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDisplayTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {(preSelectedType || clonedAlarm) && (
          <View style={styles.preSelectionNotice}>
            <Text style={styles.preSelectionText}>
              Creating alarm for: {alarmType === 'friend' ? 'A Friend' : 'Yourself'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setAlarmType('myself');
                setSelectedFriend(null);
              }}
            >
              <Text style={styles.changeTypeButton}>Change Type</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Alarm For</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                alarmType === 'friend' && styles.typeButtonActive,
              ]}
              onPress={() => setAlarmType('friend')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  alarmType === 'friend' && styles.typeButtonTextActive,
                ]}
              >
                A Friend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                alarmType === 'myself' && styles.typeButtonActive,
              ]}
              onPress={() => setAlarmType('myself')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  alarmType === 'myself' && styles.typeButtonTextActive,
                ]}
              >
                Myself
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {alarmType === 'friend' && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.friendSelector}
              onPress={() => {
                if (friends.length === 0) {
                  Alert.alert(
                    'No Friends Available',
                    'You haven\'t added any friends yet. Would you like to add some?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Add Friends', onPress: navigateToFriends }
                    ]
                  );
                  return;
                }
              }}
            >
              <Text style={styles.friendSelectorText}>
                {selectedFriend ? selectedFriend.friend_name || selectedFriend.username || 'Selected Friend' : 'Choose a friend'}
              </Text>
            </TouchableOpacity>
            
            {friends.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsList}>
                {friends.map((friend: any) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendOption,
                      selectedFriend?.id === friend.id && styles.friendOptionActive,
                    ]}
                    onPress={() => setSelectedFriend(friend)}
                  >
                    <Text
                      style={[
                        styles.friendOptionText,
                        selectedFriend?.id === friend.id && styles.friendOptionTextActive,
                      ]}
                    >
                      {friend.friend_name || friend.username || 'Unknown'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={() => Alert.alert('Date Picker', 'Date picker would open here (requires react-native-date-picker setup)')}
          >
            <Text style={styles.dateTimeLabel}>
              {formatDisplayDate(date)}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={() => Alert.alert('Time Picker', 'Time picker would open here (requires react-native-date-picker setup)')}
          >
            <Text style={styles.dateTimeLabel}>
              {formatDisplayTime(time)}
            </Text>
            <Text style={styles.clockIcon}>🕐</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wake up with:</Text>
          <View style={styles.methodGrid}>
            {wakeMethodOptions.map((method) => (
              <View key={method.id} style={styles.methodContainer}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    wakeMethods.includes(method.id) && styles.methodButtonActive,
                  ]}
                  onPress={() => toggleWakeMethod(method.id)}
                >
                  <Text style={styles.methodIcon}>{method.icon}</Text>
                  <Text
                    style={[
                      styles.methodText,
                      wakeMethods.includes(method.id) && styles.methodTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    wakeMethods.includes(method.id) ? styles.uploadButtonActive : styles.uploadButtonInactive
                  ]}
                  onPress={() => handleFileUpload(method.id)}
                  disabled={!wakeMethods.includes(method.id)}
                >
                  <Text style={[
                    styles.uploadButtonText,
                    wakeMethods.includes(method.id) ? styles.uploadButtonTextActive : styles.uploadButtonTextInactive
                  ]}>
                    Upload File
                  </Text>
                </TouchableOpacity>
                
                {uploadedFiles[method.id] && (
                  <View style={styles.uploadedFileContainer}>
                    <Text style={styles.uploadedFileText}>
                      ✅ {uploadedFiles[method.id].name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={createAlarm}>
          <Text style={styles.createButtonText}>Set Alarm</Text>
        </TouchableOpacity>
      </ScrollView>

      {showValidationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.validationModal}>
            <Text style={styles.validationMessage}>{validationMessage}</Text>
            <TouchableOpacity
              style={styles.validationCloseButton}
              onPress={() => setShowValidationModal(false)}
            >
              <Text style={styles.validationCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  preSelectionNotice: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preSelectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  changeTypeButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#ff6b9d',
  },
  typeButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  friendSelector: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendSelectorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  friendsList: {
    marginTop: 8,
  },
  friendOption: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderColor: '#374151',
    borderWidth: 1,
  },
  friendOptionActive: {
    backgroundColor: '#ff6b9d',
    borderColor: '#ff6b9d',
  },
  friendOptionText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  friendOptionTextActive: {
    color: '#fff',
  },
  dateTimeInput: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  dateIcon: {
    fontSize: 18,
  },
  clockIcon: {
    fontSize: 18,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodContainer: {
    width: (width - 64) / 2,
  },
  methodButton: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#ff6b9d',
    borderColor: '#ff6b9d',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  methodText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#fff',
  },
  uploadButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonActive: {
    backgroundColor: '#16a34a',
  },
  uploadButtonInactive: {
    backgroundColor: '#374151',
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  uploadButtonTextActive: {
    color: '#fff',
  },
  uploadButtonTextInactive: {
    color: '#9ca3af',
  },
  uploadedFileContainer: {
    backgroundColor: '#0f0f23',
    borderRadius: 6,
    padding: 8,
    borderColor: '#16a34a',
    borderWidth: 1,
  },
  uploadedFileText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#ff6b9d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 300,
    alignItems: 'center',
  },
  validationMessage: {
    color: '#374151',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  validationCloseButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  validationCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAlarmScreen;

