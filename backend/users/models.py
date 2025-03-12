from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    USER_TYPE_CHOICES = (
        ('recruiter', 'Recruiter'),
        ('job_seeker', 'Job Seeker'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.user_type}"
    
class RecruiterProfile(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    company_description = models.TextField(blank=True)
    company_website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.profile.user.username} - {self.company_name}"
    
class JobSeekerProfile(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    skills = models.TextField(blank=True)  # Comma-separated skills
    experience_years = models.IntegerField(default=0)
    education = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    desired_position = models.CharField(max_length=100, blank=True)
    desired_salary = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.profile.user.username} - Job Seeker"