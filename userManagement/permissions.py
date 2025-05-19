from rest_framework.permissions import BasePermission

class HasRolePermission(BasePermission):
    permission_required = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_permission = getattr(view, 'permission_required', None)
        return required_permission in getattr(request.user, 'role_permissions', [])
