from django.contrib import admin
from .models import Profile, RecruiterProfile, JobSeekerProfile

admin.site.register(Profile)
admin.site.register(RecruiterProfile)
admin.site.register(JobSeekerProfile)