# Generated by Django 5.1.6 on 2025-03-05 12:05

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0002_application_cover_letter_job_experience_level_and_more'),
        ('matching', '0001_initial'),
        ('users', '0002_jobseekerprofile_desired_position_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='swipeaction',
            name='entity_id',
        ),
        migrations.RemoveField(
            model_name='swipeaction',
            name='entity_type',
        ),
        migrations.RemoveField(
            model_name='swipeaction',
            name='user_id',
        ),
        migrations.AddField(
            model_name='match',
            name='job_seeker_viewed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='match',
            name='recruiter_viewed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='swipeaction',
            name='candidate',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='swipe_actions', to='users.jobseekerprofile'),
        ),
        migrations.AddField(
            model_name='swipeaction',
            name='job',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='swipe_actions', to='jobs.job'),
        ),
        migrations.AddField(
            model_name='swipeaction',
            name='profile',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='swipe_actions', to='users.profile'),
        ),
        migrations.AlterField(
            model_name='match',
            name='job',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='jobs.job'),
        ),
        migrations.AlterField(
            model_name='match',
            name='job_seeker',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='users.jobseekerprofile'),
        ),
        migrations.AlterUniqueTogether(
            name='match',
            unique_together={('job', 'job_seeker')},
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_read', models.BooleanField(default=False)),
                ('match', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='matching.match')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to='users.profile')),
            ],
        ),
    ]
