# core/user/management/commands/init_roles_and_superadmin.py

from django.core.management.base import BaseCommand
from userManagement.models import UserRole, CustomUser
from userManagement.serializers import UserRoleSerializer, CustomUserSerializer

class Command(BaseCommand):
    help = 'Populate the database with predefined roles and create super admin using serializers'

    def handle(self, *args, **kwargs):
        roles = [
            {
                "label": "Super Admin",
                "description": "This role is responsible for managing the entire application, including user management, and task management.",
                "role_permissions": ["add_user", "edit_user", "delete_user", "assign_role", "promote_or_demote_admin", "create_task", "assign_task", "view_task", "manage_task"]
            },
            {
                "label": "Admin",
                "description": "This role is responsible for managing users and tasks.",
                "role_permissions": ["create_task", "assign_task", "view_task", "manage_task"]
            },
            {
                "label": "User",
                "description": "This role is responsible for managing tasks assigned to them.",
                "role_permissions": ["view_task", "manage_task"]
            }
        ]

        for role_data in roles:
            obj = UserRole.objects.filter(label=role_data['label']).first()
            if obj:
                serializer = UserRoleSerializer(obj, data=role_data)
            else:
                serializer = UserRoleSerializer(data=role_data)

            if serializer.is_valid():
                serializer.save()
                action = "Updated" if obj else "Created"
                self.stdout.write(self.style.SUCCESS(f"{action} role: {role_data['label']}"))
            else:
                self.stdout.write(self.style.ERROR(f"Failed to save role {role_data['label']} - {serializer.errors}"))

        if not CustomUser.objects.filter(email="superadmin@gmail.com").exists():
            super_admin_role = UserRole.objects.filter(label="Super Admin")
            if not super_admin_role.exists():
                self.stdout.write(self.style.ERROR("Super Admin role not found. Aborting user creation."))
                return

            superadmin_data = {
                "username": "superadmin",
                "name": "Super Admin",
                "email": "superadmin@gmail.com",
                "password": "superadmin123",
                "role": ["1"]
            }

            user_serializer = CustomUserSerializer(data=superadmin_data)
            if user_serializer.is_valid():
                user = user_serializer.save()
                user.is_superuser = True
                user.save()
                self.stdout.write(self.style.SUCCESS("Super Admin user created successfully."))
            else:
                self.stdout.write(self.style.ERROR(f"Failed to create super admin - {user_serializer.errors}"))
        else:
            self.stdout.write(self.style.WARNING("Super Admin user already exists."))
