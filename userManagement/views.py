from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError

from django.urls import reverse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from taskManagement.models import Task

from .models import CustomUser, UserRole
from .serializers import CustomUserSerializer
from .permissions import HasRolePermission
from .decorators import check_permission



def get_tokens_for_user(user):
    """
    Helper function to generate JWT tokens for a user.
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def user_login(request):
    """
    View for user login. Handles both GET and POST requests.
    Uses Django's built-in AuthenticationForm.
    """
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                tokens = get_tokens_for_user(user)
                messages.success(request, f'Welcome, {username}!')

                # Create response object to set cookie
                response = redirect(reverse('superadmin_dashboard'))
                response.set_cookie(
                    key='access',
                    value=tokens['access'],
                    httponly=True,
                    samesite='Lax',  # or 'Strict'/'None' depending on your frontend setup
                    secure=False     # True if you're using HTTPS
                )

                return response
            else:
                messages.error(request, 'Invalid username or password.')
        else:
            pass
    else:
        form = AuthenticationForm()

    return render(request, 'login.html', {'form': form})

def superadmin_dashboard(request):
    """
    View for rendering the superadmin dashboard page.
    
    It performs the following:
    - Retrieves the JWT access token from cookies.
    - Validates the token; if invalid or expired, redirects to login with a message.
    - Gets the logged-in user and their roles.
    - Based on the user role (Super Admin, Admin, User), it collects and prepares
      data like user lists, tasks, and statistics to be rendered on the dashboard.
    - Passes the collected context data to the dashboard template.
    """
    access_token = request.COOKIES.get('access')
    if not access_token:
        messages.error(request, "No token found. Please log in.")
        return redirect('login')

    try:
        # Validate the JWT token; this raises an error if token is invalid/expired
        token = AccessToken(access_token)
    
        logged_user = request.user
        user_roles = [r.label for r in logged_user.role.all()]
        context = {}

        if 'Super Admin' in user_roles:
            # Super Admin can see all non-superuser users, all roles, and admin users
            users = CustomUser.objects.filter(is_superuser=False)
            roles = UserRole.objects.all()
            admin_users = CustomUser.objects.filter(role__label='Admin')

            # Calculate task statistics and reporting head for each user
            for user in users:
                tasks = Task.objects.filter(assigned_to=user)
                reporting_head_name = user.reporting_head.name if user.reporting_head else ""

                user.total_tasks = tasks.count()
                user.completed_tasks = tasks.filter(status='Completed').count()
                user.ToDo_tasks = tasks.filter(status='ToDo').count()
                user.role_labels = [r.label for r in user.role.all()]
                user.reporting_head_name = reporting_head_name

            context.update({
                'users': users,
                'total_users': users.count(),
                'total_tasks': Task.objects.count(),
                'ToDo_tasks': Task.objects.filter(status='ToDo').count(),
                "roles": roles,
                'admin_users': admin_users,
                'user_roles': user_roles,
                "logged_user": logged_user.name
            })

        if 'Admin' in user_roles:
            # Admin users see only users reporting to them and their own tasks
            users = CustomUser.objects.filter(reporting_head=logged_user)
            logged_user_tasks = Task.objects.filter(assigned_to=logged_user)

            # Calculate tasks statistics for each user reporting to this Admin
            for user in users:
                tasks = Task.objects.filter(assigned_to=user)
                user.total_tasks = tasks.count()
                user.completed_tasks = tasks.filter(status='Completed').count()
                user.ToDo_tasks = tasks.filter(status='ToDo').count()
                user.role_labels = [r.label for r in user.role.all()]
                user.reporting_head_name = logged_user.name

            context.update({
                'users': users,
                'total_users': users.count(),
                'total_tasks': Task.objects.filter(assigned_to__reporting_head=logged_user).count(),
                'ToDo_tasks': Task.objects.filter(assigned_to__reporting_head=logged_user, status='ToDo').count(),
                'admin_view': True,
                'user_roles': user_roles,
                "logged_user": logged_user.name
            })

        if 'User' in user_roles:
            # Basic user sees only their own tasks with statistics
            tasks = Task.objects.filter(assigned_to=logged_user)
            context.update({
                'user_view': True,
                'tasks': tasks,
                'user_total_tasks': tasks.count(),
                'user_completed_tasks': tasks.filter(status='Completed').count(),
                'user_ToDo_tasks': tasks.filter(status='ToDo').count(),
                'user_roles': user_roles,
                "logged_user": logged_user.name
            })

        return render(request, 'dashboard/super_admin_dashboard.html', context)

    except TokenError:
        # Token is invalid or expired, redirect user to login with message
        messages.error(request, "Session expired. Please log in again.")
        return redirect('login')



class UserListCreateView(HasRolePermission, generics.ListCreateAPIView):
    """
    API view to list all users or create a new user.
    Requires the user to have 'add_user' permission.
    """
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_required = 'add_user'



class UserDetailView(HasRolePermission, generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update or delete a user by ID.
    Requires the user to have 'edit_user' permission.
    """
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_required = 'edit_user'



@api_view(['GET'])
@login_required
@check_permission('view_task')
def user_tasks_api(request, user_id):
    """
    API endpoint to get all tasks assigned to a specific user.
    
    - Requires the requester to be logged in.
    - Requires the requester to have 'view_task' permission.
    - Returns a JSON response with a list of tasks or a 404 if the user does not exist.
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        tasks = Task.objects.filter(assigned_to=user)

        data = {
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "status": t.status
                }
                for t in tasks
            ]
        }
        return JsonResponse(data)

    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    
def user_logout(request):
    """
    Logs the user out by clearing the session and deleting the access token cookie.
    """
    logout(request)  # Clears the session

    response = redirect(reverse('login'))  # Redirect to login page

    # Delete the JWT access token cookie
    response.delete_cookie('access')

    return response