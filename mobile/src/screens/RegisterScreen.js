import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator
} from 'react-native';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'job_seeker',
    company_name: '',
    position: '',
    skills: '',
    experience_years: '0',
  });
  
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const toggleUserType = () => {
    setIsRecruiter(!isRecruiter);
    handleChange('user_type', !isRecruiter ? 'recruiter' : 'job_seeker');
  };
  
  const validateForm = () => {
    setError('');
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (isRecruiter && (!formData.company_name || !formData.position)) {
      setError('Please fill in company name and position');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // In a real app, this would connect to your API
      // For now, we're using mock data since backend connection isn't available
      
      // Create mock response data
      const mockResponse = {
        data: {
          token: 'mock-token-' + Math.random().toString(36).substr(2, 10),
          user_id: Math.floor(Math.random() * 1000) + 10,
          user_type: formData.user_type,
          username: formData.username
        }
      };
      
      // Store authentication data
      await AsyncStorage.setItem('token', mockResponse.data.token);
      await AsyncStorage.setItem('userType', mockResponse.data.user_type);
      await AsyncStorage.setItem('userId', mockResponse.data.user_id.toString());
      
      // Show success message
      Alert.alert(
        "Account Created!",
        "Your account has been successfully created.",
        [
          { 
            text: "OK", 
            onPress: () => {
              // The app will detect the token and navigate to the main screen
              // We'll navigate back to Login which will trigger the App.js useEffect
              // to check for the token and redirect to Main
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join SwipeHire today</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.form}>
        <View style={styles.userTypeContainer}>
          <Text style={styles.userTypeLabel}>I am a:</Text>
          <View style={styles.switchContainer}>
            <Text style={isRecruiter ? styles.userTypeInactive : styles.userTypeActive}>
              Job Seeker
            </Text>
            <Switch
              value={isRecruiter}
              onValueChange={toggleUserType}
              trackColor={{ false: '#ff6b6b', true: '#4CAF50' }}
              thumbColor="#fff"
            />
            <Text style={isRecruiter ? styles.userTypeActive : styles.userTypeInactive}>
              Recruiter
            </Text>
          </View>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Username *"
          value={formData.username}
          onChangeText={value => handleChange('username', value)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={value => handleChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password *"
          value={formData.password}
          onChangeText={value => handleChange('password', value)}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={formData.first_name}
          onChangeText={value => handleChange('first_name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={formData.last_name}
          onChangeText={value => handleChange('last_name', value)}
        />
        
        {isRecruiter ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Company Name *"
              value={formData.company_name}
              onChangeText={value => handleChange('company_name', value)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Position at Company *"
              value={formData.position}
              onChangeText={value => handleChange('position', value)}
            />
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Skills (comma separated)"
              value={formData.skills}
              onChangeText={value => handleChange('skills', value)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Years of Experience"
              value={formData.experience_years}
              onChangeText={value => handleChange('experience_years', value)}
              keyboardType="numeric"
            />
          </>
        )}
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#ff6b6b',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#444',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTypeActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginHorizontal: 10,
  },
  userTypeInactive: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ff6b6b',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  link: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;