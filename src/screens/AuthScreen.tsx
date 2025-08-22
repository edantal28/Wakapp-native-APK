import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/api';

const { width } = Dimensions.get('window');

const AuthScreen = ({ navigation }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    loadRememberedEmail();
  }, []);

  const loadRememberedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('wakapp_remembered_email');
      if (savedEmail) {
        setRememberedEmail(savedEmail);
        setFormData(prev => ({
          ...prev,
          email: savedEmail
        }));
      }
    } catch (error) {
      console.error('Error loading remembered email:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isLogin) {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        const user = users.find((u: any) => u.email === formData.email);
        
        if (user) {
          try {
            await AsyncStorage.setItem('wakapp_remembered_email', formData.email);
          } catch (error) {
            console.error('Error saving email to AsyncStorage:', error);
          }
          
          await login({ username: user.username, password: 'dummy' });
        } else {
          Alert.alert('Error', 'User not found. Please register first.');
        }
      } else {
        const response = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            phone: formData.phone
          }),
        });
        
        const result = await response.json();
        
        if (result && result.id) {
          try {
            await AsyncStorage.setItem('wakapp_remembered_email', formData.email);
          } catch (error) {
            console.error('Error saving email to AsyncStorage:', error);
          }
          
          await login({ username: result.username, password: 'dummy' });
        } else {
          Alert.alert('Success', 'Registration successful! Please login with your email.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.storyBorder}>
              <View style={styles.storyBorderInner}>
                <Text style={styles.bellIcon}>🔔</Text>
              </View>
            </View>
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>WAKAPP</Text>
            <Text style={styles.tagline}>Wake up by your loved ones</Text>
          </View>
          <Text style={styles.welcomeText}>
            {isLogin ? 'Welcome back! 💖' : 'Join the squad! ✨'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({...formData, username: text})}
                  placeholder="Your cool username"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '...' : (isLogin ? 'Login' : 'Sign Up')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchContainer}>
          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? (
                <>
                  Need an account? <Text style={styles.switchTextUnderline}>Register</Text>
                </>
              ) : (
                'Already have an account? Login'
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  storyBorder: {
    backgroundColor: '#ff6b9d',
    padding: 3,
    borderRadius: 20,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyBorderInner: {
    backgroundColor: '#1f2937',
    borderRadius: 17,
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 32,
    color: '#ff6b9d',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tagline: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  welcomeText: {
    color: '#d1d5db',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#d1d5db',
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    width: '70%',
    alignSelf: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ff6b9d',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '70%',
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
  buttonDisabled: {
    backgroundColor: '#6b7280',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#ffffff',
    fontSize: 16,
  },
  switchTextUnderline: {
    textDecorationLine: 'underline',
    color: '#ff6b9d',
  },
});

export default AuthScreen;

