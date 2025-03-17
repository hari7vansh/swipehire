import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { jobsAPI } from '../services/api';

const CreateJobScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full_time',
    experience_level: 'entry',
    salary_min: '',
    salary_max: '',
    is_remote: false,
    skills_required: '',
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.requirements || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await jobsAPI.createJob(formData);
      Alert.alert(
        'Success',
        'Job posted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to post job');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post a New Job</Text>
      </View>
      
      <View style={styles.form}>
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(value) => handleChange('title', value)}
          placeholder="e.g. Senior Software Engineer"
        />
        
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(value) => handleChange('location', value)}
          placeholder="e.g. San Francisco, CA"
        />
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Remote Position</Text>
          <Switch
            value={formData.is_remote}
            onValueChange={(value) => handleChange('is_remote', value)}
            trackColor={{ false: '#ddd', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>
        
        <Text style={styles.label}>Job Type</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'full_time' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'full_time')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'full_time' && styles.selectedPillText
            ]}>Full Time</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'part_time' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'part_time')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'part_time' && styles.selectedPillText
            ]}>Part Time</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'contract' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'contract')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'contract' && styles.selectedPillText
            ]}>Contract</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.job_type === 'internship' && styles.selectedPill
            ]}
            onPress={() => handleChange('job_type', 'internship')}
          >
            <Text style={[
              styles.pillText,
              formData.job_type === 'internship' && styles.selectedPillText
            ]}>Internship</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'entry' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'entry')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'entry' && styles.selectedPillText
            ]}>Entry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'mid' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'mid')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'mid' && styles.selectedPillText
            ]}>Mid</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'senior' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'senior')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'senior' && styles.selectedPillText
            ]}>Senior</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typePill,
              formData.experience_level === 'executive' && styles.selectedPill
            ]}
            onPress={() => handleChange('experience_level', 'executive')}
          >
            <Text style={[
              styles.pillText,
              formData.experience_level === 'executive' && styles.selectedPillText
            ]}>Executive</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Min. Salary</Text>
            <TextInput
              style={styles.input}
              value={formData.salary_min}
              onChangeText={(value) => handleChange('salary_min', value)}
              keyboardType="numeric"
              placeholder="e.g. 50000"
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Max. Salary</Text>
            <TextInput
              style={styles.input}
              value={formData.salary_max}
              onChangeText={(value) => handleChange('salary_max', value)}
              keyboardType="numeric"
              placeholder="e.g. 80000"
            />
          </View>
        </View>
        
        <Text style={styles.label}>Required Skills (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={formData.skills_required}
          onChangeText={(value) => handleChange('skills_required', value)}
          placeholder="e.g. React, Python, SQL"
        />
        
        <Text style={styles.label}>Job Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => handleChange('description', value)}
          placeholder="Provide a detailed description of the role..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        <Text style={styles.label}>Requirements *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.requirements}
          onChangeText={(value) => handleChange('requirements', value)}
          placeholder="List the requirements for this position..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Posting...' : 'Post Job'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#ff6b6b',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#444',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchLabel: {
    fontSize: 16,
    color: '#444',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  typePill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedPill: {
    backgroundColor: '#ff6b6b',
  },
  pillText: {
    color: '#555',
  },
  selectedPillText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateJobScreen;