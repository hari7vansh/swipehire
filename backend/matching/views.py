from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SwipeAction, Match, Message
from users.models import Profile, JobSeekerProfile
from jobs.models import Job
from .serializers import SwipeActionSerializer, MatchSerializer, MessageSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def swipe_action(request):
    # Get user profile
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    direction = request.data.get('direction')
    if direction not in ['left', 'right']:
        return Response({'error': 'Invalid direction'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle job seeker swiping on a job
    if profile.user_type == 'job_seeker':
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'Job ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            job = Job.objects.get(id=job_id)
            job_seeker = JobSeekerProfile.objects.get(profile=profile)
            
            # Create swipe action
            SwipeAction.objects.create(
                profile=profile,
                job=job,
                direction=direction
            )
            
            # Check for a match if swiped right
            if direction == 'right':
                # Check if the recruiter has already swiped right on this job seeker
                recruiter_profile = job.recruiter.profile
                recruiter_right_swipe = SwipeAction.objects.filter(
                    profile=recruiter_profile,
                    candidate=job_seeker,
                    direction='right'
                ).exists()
                
                if recruiter_right_swipe:
                    # Create a match
                    Match.objects.create(job=job, job_seeker=job_seeker)
                    return Response({'message': 'Match created!', 'matched': True})
            
            return Response({'message': 'Swipe recorded', 'matched': False})
            
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        except JobSeekerProfile.DoesNotExist:
            return Response({'error': 'Job seeker profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Handle recruiter swiping on a job seeker
    elif profile.user_type == 'recruiter':
        job_seeker_id = request.data.get('job_seeker_id')
        job_id = request.data.get('job_id')
        
        if not job_seeker_id or not job_id:
            return Response({'error': 'Job seeker ID and Job ID required'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        try:
            job_seeker = JobSeekerProfile.objects.get(id=job_seeker_id)
            job = Job.objects.get(id=job_id)
            
            # Create swipe action
            SwipeAction.objects.create(
                profile=profile,
                candidate=job_seeker,
                direction=direction
            )
            
            # Check for a match if swiped right
            if direction == 'right':
                # Check if the job seeker has already swiped right on this job
                job_seeker_right_swipe = SwipeAction.objects.filter(
                    profile=job_seeker.profile,
                    job=job,
                    direction='right'
                ).exists()
                
                if job_seeker_right_swipe:
                    # Create a match
                    Match.objects.create(job=job, job_seeker=job_seeker)
                    return Response({'message': 'Match created!', 'matched': True})
            
            return Response({'message': 'Swipe recorded', 'matched': False})
            
        except JobSeekerProfile.DoesNotExist:
            return Response({'error': 'Job seeker not found'}, status=status.HTTP_404_NOT_FOUND)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)

class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            profile = Profile.objects.get(user=self.request.user)
            
            if profile.user_type == 'job_seeker':
                job_seeker = JobSeekerProfile.objects.get(profile=profile)
                return Match.objects.filter(job_seeker=job_seeker, is_active=True)
            else:
                # For recruiters, show matches for all their jobs
                recruiter = profile.recruiterprofile
                return Match.objects.filter(job__recruiter=recruiter, is_active=True)
                
        except (Profile.DoesNotExist, JobSeekerProfile.DoesNotExist):
            return Match.objects.none()

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(sender=Profile.objects.get(user=self.request.user))
    
    def get_queryset(self):
        match_id = self.request.query_params.get('match_id', None)
        if match_id:
            return Message.objects.filter(match_id=match_id).order_by('created_at')
        return Message.objects.none()