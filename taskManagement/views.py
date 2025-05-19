import json

from rest_framework.decorators import api_view
from rest_framework import generics

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from userManagement.decorators import check_permission

from .models import Task
from .serializers import TaskSerializer
from userManagement.permissions import HasRolePermission

# Create your views here.

class TaskListCreateView(HasRolePermission, generics.ListCreateAPIView):
    """
    API view to list all tasks or create a new task.

    - Requires the user to have the 'create_task' permission to create new tasks.
    - Listing tasks is also subject to permission checks via HasRolePermission.
    - GET request returns a list of all tasks.
    - POST request creates a new task using the TaskSerializer.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_required = 'create_task'


@api_view(['PUT'])
@login_required
@check_permission('manage_task')
def mark_task_completed_view(request, task_id):
    """
    API endpoint to mark a specific task as completed.
    - Requires the user to be logged in.
    - Requires 'manage_task' permission.
    - Accepts a PUT request with a JSON body containing:
        - 'completion_report': A string report about task completion.
        - 'worked_hours': Number of hours worked on the task.
    - Retrieves the task by `task_id` or returns 404 if not found.
    - Updates the task's status to 'Completed'.
    - Updates the task's completion_report and worked_hours fields.
    """
    task = get_object_or_404(Task, id=task_id)

    try:
        data = json.loads(request.body)
        completion_report = data.get('completion_report')
        worked_hours = data.get('worked_hours')

        # Update task fields
        task.status = 'Completed'
        task.completion_report = completion_report
        task.worked_hours = worked_hours
        task.save()

        return JsonResponse({"msg": "Task marked as completed"}, status=200)

    except Exception as e:
        # Return error response if something goes wrong
        return JsonResponse({"error": str(e)}, status=500)
