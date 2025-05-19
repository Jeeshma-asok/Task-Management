# decorators.py
from django.http import JsonResponse
from functools import wraps

def check_permission(permission):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user = request.user

            if not user.is_authenticated:
                return JsonResponse({"error": "Authentication required"}, status=401)

            if user.is_superuser:
                return view_func(request, *args, **kwargs)

            # Collect all permissions from user's roles
            user_roles = user.role.all()
            all_permissions = set()
            for role in user_roles:
                all_permissions.update(role.role_permissions)

            if permission not in all_permissions:
                return JsonResponse({"error": "Permission denied"}, status=403)

            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
