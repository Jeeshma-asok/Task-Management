from django.urls import path
from .views import TaskListCreateView, mark_task_completed_view


urlpatterns = [
    path('api/task/create/', TaskListCreateView.as_view(), name='task-list-create'),
    path('api/task/manage/<int:task_id>/', mark_task_completed_view, name='manage-task'),
]
