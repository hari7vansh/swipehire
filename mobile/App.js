import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SwipeScreen from './src/screens/SwipeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreateJobScreen from './src/screens/CreateJobScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

// Auth stack component
const AuthStackScreen = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Main app tabs
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Swipe') {
          iconName = focused ? 'albums' : 'albums-outline';
        } else if (route.name === 'Matches') {
          iconName = focused ? 'heart' : 'heart-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#ff6b6b',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Swipe" component={SwipeScreen} />
    <Tab.Screen name="Matches" component={MatchesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [userToken, setUserToken] = useState(null);

  // Function to complete onboarding
  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  useEffect(() => {
    // Check async storage for auth state and onboarding status
    const bootstrapAsync = async () => {
      try {
        const [onboardingStatus, token] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          AsyncStorage.getItem('token')
        ]);

        setHasSeenOnboarding(onboardingStatus === 'true');
        setUserToken(token);
      } catch (e) {
        console.error('Error loading app state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
    
    // Set up a token check interval to detect changes in AsyncStorage
    const tokenCheckInterval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token !== userToken) {
          setUserToken(token);
        }
      } catch (e) {
        console.error('Error checking token:', e);
      }
    }, 1000);
    
    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, [userToken]);

  // Shows a loading screen while checking storage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          // First-time users see onboarding
          <Stack.Screen name="Onboarding">
            {props => <OnboardingScreen {...props} completeOnboarding={completeOnboarding} />}
          </Stack.Screen>
        ) : !userToken ? (
          // Auth flow (not logged in)
          <Stack.Screen name="Auth" component={AuthStackScreen} />
        ) : (
          // Main app flow (logged in)
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{ headerShown: true }}
            />
            <Stack.Screen 
              name="CreateJob" 
              component={CreateJobScreen} 
              options={{ 
                headerShown: true,
                title: "Post New Job"
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}