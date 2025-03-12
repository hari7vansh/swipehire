from rest_framework import serializers
from .models import Job, Application
from users.serializers import RecruiterProfileSerializer, JobSeekerProfileSerializer

class JobSerializer(serializers.ModelSerializer):
    recruiter = RecruiterProfileSerializer(read_only=True)
    
    class Meta:
        model = Job
        fields = '__all__'

class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_seeker = JobSeekerProfileSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = '__all__'