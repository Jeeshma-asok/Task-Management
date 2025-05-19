from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    due_date = serializers.DateField(input_formats=['%Y-%m-%d', '%Y-%m-%dT%H:%M'])

    class Meta:
        model = Task
        fields = '__all__'
