import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/api';

interface Friend {
  id: string;
  requester_id: string;
  friend_id: string;
  status: string;
  friend_name: string;
  friend_phone: string;
  username?: string;
}

const FriendsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendPhone, setFriendPhone] = useState('');
  const [friendName, setFriendName] = useState('');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mockContacts = [
    { id: '1', name: 'John Smith', phone: '+1234567890' },
    { id: '2', name: 'Sarah Johnson', phone: '+1987654321' },
    { id: '3', name: 'Mike Davis', phone: '+1555123456' },
    { id: '4', name: 'Emily Wilson', phone: '+1444789012' },
  ];

  const fetchFriends = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/friends`);
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      Alert.alert('Error', 'Failed to fetch friends');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const addFriend = async () => {
    if (!friendName.trim() || !friendPhone.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          phone: friendPhone.trim(),
          nickname: friendName.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Friend request sent successfully!');
        setFriendName('');
        setFriendPhone('');
        fetchFriends();
      } else {
        Alert.alert('Error', result.detail || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    }
  };

  const resendRequest = async (friendId: string) => {
    try {
      const response = await fetch(`${API_URL}/friends/${friendId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        Alert.alert('Success', 'Friend request resent successfully!');
      } else {
        Alert.alert('Error', 'Failed to resend request');
      }
    } catch (error) {
      console.error('Error resending request:', error);
      Alert.alert('Error', 'Failed to resend request');
    }
  };

  const deleteFriend = async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/friends/${friendId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                Alert.alert('Success', 'Friend removed successfully');
                fetchFriends();
              } else {
                Alert.alert('Error', 'Failed to remove friend');
              }
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#16a34a';
      case 'pending':
        return '#f59e0b';
      case 'sms_invited':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'sms_invited':
        return 'Invited';
      default:
        return 'Unknown';
    }
  };

  const wakeUpFriend = (friend: Friend) => {
    navigation.navigate('CreateAlarm', {
      preSelectedType: 'friend',
      preSelectedFriend: friend,
    });
  };

  const selectFromContacts = () => {
    setShowContactsModal(true);
  };

  const selectContact = (contact: any) => {
    setFriendName(contact.name);
    setFriendPhone(contact.phone);
    setShowContactsModal(false);
  };

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const showFriendMenu = (friend: Friend) => {
    const menuOptions = [];
    
    if (friend.status === 'pending' || friend.status === 'sms_invited') {
      menuOptions.push({
        text: 'Resend Request',
        onPress: () => resendRequest(friend.id),
      });
    }
    
    menuOptions.push({
      text: 'Remove Friend',
      style: 'destructive',
      onPress: () => deleteFriend(friend.id),
    });

    menuOptions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Friend Options', '', menuOptions);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchFriends} />
        }
      >
        <View style={styles.addFriendCard}>
          <Text style={styles.cardTitle}>Add Friend</Text>
          
          <View style={styles.addMethodsContainer}>
            <View style={styles.methodButtonContainer}>
              <TouchableOpacity style={[styles.methodButton, styles.methodButtonActive]}>
                <Text style={styles.methodButtonText}>Manual Entry</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.methodButtonContainer}>
              <TouchableOpacity style={styles.methodButton} onPress={selectFromContacts}>
                <Text style={styles.methodButtonText}>From Contacts</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={friendName}
              onChangeText={setFriendName}
              placeholder="Type friend's name"
              placeholderTextColor="#9ca3af"
            />
            
            <TextInput
              style={styles.input}
              value={friendPhone}
              onChangeText={setFriendPhone}
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.addButton} onPress={addFriend}>
              <Text style={styles.addButtonText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.friendsSection}>
          <Text style={styles.sectionTitle}>
            My Friends ({friends.length})
          </Text>

          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No friends added yet</Text>
              <Text style={styles.emptySubtext}>
                Add friends to start sending wake-up requests
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>
                    {friend.friend_name || friend.username || 'Unknown'}
                  </Text>
                  <Text style={styles.friendPhone}>{friend.friend_phone}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(friend.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(friend.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.friendActions}>
                  {friend.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.wakeUpButton}
                      onPress={() => wakeUpFriend(friend)}
                    >
                      <Text style={styles.wakeUpButtonText}>Wake'm Up</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => showFriendMenu(friend)}
                  >
                    <Text style={styles.menuButtonText}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.contactsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => setShowContactsModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts..."
              placeholderTextColor="#9ca3af"
            />
            
            <ScrollView style={styles.contactsList}>
              {filteredContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactItem}
                  onPress={() => selectContact(contact)}
                >
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
  },
  addFriendCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderColor: '#374151',
    borderWidth: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  addMethodsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  methodButtonContainer: {
    flex: 1,
  },
  methodButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderColor: '#4b5563',
    borderWidth: 1,
  },
  methodButtonActive: {
    backgroundColor: '#ff6b9d',
    borderColor: '#ff6b9d',
  },
  methodButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: '#0f0f23',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  friendCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderColor: '#374151',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendPhone: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wakeUpButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  wakeUpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuButton: {
    backgroundColor: '#374151',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsModal: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    minHeight: '50%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#0f0f23',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    margin: 20,
    color: '#fff',
    fontSize: 16,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactItem: {
    paddingVertical: 15,
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default FriendsScreen;

