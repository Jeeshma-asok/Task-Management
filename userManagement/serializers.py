from rest_framework import serializers
from userManagement.models import UserRole, CustomUser

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['label', 'description', 'role_permissions']


class CustomUserSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(
        queryset=UserRole.objects.all(),
        many=True
    )

    class Meta:
        model = CustomUser
        fields = ['uuid', 'username', 'name', 'email', 'password', 'role', 'reporting_head']

    def create(self, validated_data):
        roles = validated_data.pop('role', [])
        password = validated_data.pop('password')
        
        # Create user instance without saving yet
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        if roles:
            user.role.set(roles)

        return user

    def update(self, instance, validated_data):
        roles = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if roles is not None:
            instance.role.set(roles)

        return instance
