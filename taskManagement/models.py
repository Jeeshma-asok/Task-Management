from django.core.exceptions import ValidationError
from django.db import models

from userManagement.models import CustomUser

# Create your models here.

class Task(models.Model):
    STATUS_CHOICES = (
        ('ToDo', 'ToDo'),
        ('Completed', 'Completed'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_to = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ToDo')
    completion_report = models.TextField(blank=True, null=True)
    worked_hours = models.PositiveIntegerField(blank=True, null=True)

    def clean(self):
        # Validate before saving
        if self.status == 'Completed':
            if not self.completion_report:
                raise ValidationError({'error': 'Completion report is required when task is completed.'})
            if self.worked_hours is None:
                raise ValidationError({'error': 'Worked hours is required when task is completed.'})
        else:
            if self.completion_report:
                raise ValidationError({'error': 'Completion report should be empty unless task is completed.'})
            if self.worked_hours is not None:
                raise ValidationError({'error': 'Worked hours should be empty unless task is completed.'})

    def save(self, *args, **kwargs):
        self.full_clean()  
        super().save(*args, **kwargs)