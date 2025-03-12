from django.db import models
from users.models import JobSeekerProfile, RecruiterProfile, Profile
from jobs.models import Job

# In matching/models.py
class SwipeAction(models.Model):
    DIRECTION_CHOICES = (
        ('left', 'Left'),
        ('right', 'Right'),
    )
    
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='swipe_actions', null=True, blank=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='swipe_actions', null=True, blank=True)
    candidate = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='swipe_actions', null=True, blank=True)
    direction = models.CharField(max_length=5, choices=DIRECTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.job:
            return f"{self.profile.user.username if self.profile else 'Unknown'} swiped {self.direction} on job {self.job.title}"
        else:
            return f"{self.profile.user.username if self.profile else 'Unknown'} swiped {self.direction} on candidate {self.candidate.profile.user.username if self.candidate else 'Unknown'}"
    
class Match(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='matches')
    job_seeker = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='matches')
    recruiter_viewed = models.BooleanField(default=False)
    job_seeker_viewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('job', 'job_seeker')
        
    def __str__(self):
        return f"Match: {self.job_seeker.profile.user.username} - {self.job.title}"

class Message(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Message from {self.sender.user.username} in {self.match}"