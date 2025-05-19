from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter

from .views import user_login, superadmin_dashboard, UserListCreateView, UserDetailView, user_tasks_api, user_logout

urlpatterns = [
    path('', user_login, name='login'),
    path('login/', user_login, name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/', superadmin_dashboard, name='superadmin_dashboard'),
    path('api/users/create/', UserListCreateView.as_view(), name='user-list-create'),
    path('api/users/manage/<int:pk>/', UserDetailView.as_view(), name="user_detail"),
    path("api/user-tasks/<int:user_id>/", user_tasks_api, name="user_tasks_api"),
    path('logout/', user_logout, name='logout'),
]
    