import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, Image, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import MyAlarmsScreen from '../screens/MyAlarmsScreen';
import CreateAlarmScreen from '../screens/CreateAlarmScreen';
import FriendsScreen from '../screens/FriendsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const getIcon = () => {
    switch (name) {
      case 'MyAlarms':
        return '🕐';
      case 'CreateAlarm':
        return '🔔';
      case 'Friends':
        return '👥';
      default:
        return '❓';
    }
  };

  const getLabel = () => {
    switch (name) {
      case 'MyAlarms':
        return 'My Alarms';
      case 'CreateAlarm':
        return 'Create Alarm';
      case 'Friends':
        return 'Friends';
      default:
        return '';
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
      <Text style={{ 
        fontSize: 24, 
        color: focused ? '#ff6b9d' : '#9ca3af',
        marginBottom: 2,
      }}>
        {getIcon()}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: focused ? '#ff6b9d' : '#9ca3af',
          fontWeight: '500',
        }}
      >
        {getLabel()}
      </Text>
    </View>
  );
};

const CustomHeader = ({ title, user }: { title: string; user: any }) => {
  const { logout } = useAuth();

  return (
    <View style={{
      backgroundColor: '#1f2937',
      borderBottomColor: '#374151',
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{
          backgroundColor: '#ff6b9d',
          padding: 3,
          borderRadius: 20,
          marginRight: 12,
        }}>
          <View style={{
            width: 48,
            height: 48,
            backgroundColor: '#1f2937',
            borderRadius: 17,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 20, color: '#ff6b9d' }}>🔔</Text>
          </View>
        </View>
        <View>
          <Text style={{ 
            color: '#fff', 
            fontSize: 18,
            fontWeight: 'bold' 
          }}>
            WAKAPP
          </Text>
          <Text style={{ color: '#d1d5db', fontSize: 14 }}>
            Hey {user?.username}! 💖
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: '#374151',
          padding: 12,
          borderRadius: 25,
          borderColor: '#ff6b9d',
          borderWidth: 2,
        }}
      >
        <Text style={{ fontSize: 16 }}>👤</Text>
      </TouchableOpacity>
    </View>
  );
};

const MainTabs = () => {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f23' }}>
      <CustomHeader title="" user={user} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#1f2937',
            borderTopColor: '#374151',
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
          headerShown: false,
        })}
      >
        <Tab.Screen name="MyAlarms" component={MyAlarmsScreen} />
        <Tab.Screen name="CreateAlarm" component={CreateAlarmScreen} />
        <Tab.Screen name="Friends" component={FriendsScreen} />
      </Tab.Navigator>
    </View>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
          borderBottomColor: '#333',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
        },
        headerTintColor: '#7c3aed',
        cardStyle: {
          backgroundColor: '#0f0f23',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthScreen />}
    </NavigationContainer>
  );
};

export default AppNavigator;

