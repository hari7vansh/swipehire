from django.contrib import admin
from .models import SwipeAction, Match, Message

admin.site.register(SwipeAction)
admin.site.register(Match)
admin.site.register(Message)