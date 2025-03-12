from rest_framework import serializers
from .models import SwipeAction, Match, Message
from jobs.serializers import JobSerializer
from users.serializers import JobSeekerProfileSerializer, ProfileSerializer

class SwipeActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SwipeAction
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_seeker = JobSeekerProfileSerializer(read_only=True)
    
    class Meta:
        model = Match
        fields = '__all__'
        
class MessageSerializer(serializers.ModelSerializer):
    sender = ProfileSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'