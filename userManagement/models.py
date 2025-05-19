import uuid

from django.db import models
from django.contrib.auth.models import AbstractUser,Group
from  django.forms import ValidationError


# Create your models here.

class UserRole(Group):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=30)
    description = models.TextField(default = '', blank = True)
    role_permissions = models.JSONField(default=list, null=True, blank=True)

    def save(self, *args, **kwargs):
        self.name = self.uuid
        super().save(*args, **kwargs)

class CustomUser(AbstractUser):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=False)
    role = models.ManyToManyField(
        'UserRole',
        verbose_name='roles',
        blank=True,
        related_name='customuser_set',
        related_query_name='customuser'
    )

    reporting_head = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='subordinates'
    )
    

    def save(self, *args, **kwargs):
        import re
        if self.name and not re.match(r"^[a-zA-Z](?:[a-zA-Z ]*[a-zA-Z])?$",self.name):
            raise ValidationError(
                {'name': 'Invalid name format'}
            )
        data = {}
        if self.pk:
            old_instance = CustomUser.objects.get(pk=self.pk)
            
            data = self.edit_user_data(old_instance,data)

        super(CustomUser, self).save(*args, **kwargs)

        return data
    
    def edit_user_data(self,old_instance,data):

        if old_instance.name != self.name:
            data.update({'name':self.name})

        return data
