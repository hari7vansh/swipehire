from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Job, Application
from users.models import Profile, RecruiterProfile, JobSeekerProfile
from .serializers import JobSerializer, ApplicationSerializer

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only recruiters can create jobs
        try:
            profile = Profile.objects.get(user=self.request.user)
            if profile.user_type == 'recruiter':
                recruiter = RecruiterProfile.objects.get(profile=profile)
                serializer.save(recruiter=recruiter)
            else:
                raise PermissionError("Only recruiters can create jobs")
        except (Profile.DoesNotExist, RecruiterProfile.DoesNotExist):
            raise PermissionError("Recruiter profile not found")
            
    def get_queryset(self):
        # Filter jobs based on user type
        try:
            profile = Profile.objects.get(user=self.request.user)
            if profile.user_type == 'recruiter':
                # Recruiters see their own jobs
                recruiter = RecruiterProfile.objects.get(profile=profile)
                return Job.objects.filter(recruiter=recruiter)
            else:
                # Job seekers see all active jobs
                return Job.objects.filter(is_active=True)
        except (Profile.DoesNotExist, RecruiterProfile.DoesNotExist):
            return Job.objects.none()

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]