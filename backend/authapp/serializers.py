from rest_framework import serializers
from .models import User, Role, Permission
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import string
import random
from django.core.mail import send_mail
from django.conf import settings

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete', 'is_login_page', 'role')

    def validate(self, data):
        if data.get('is_login_page') and not data.get('can_view'):
            raise serializers.ValidationError("Login page must have view permission enabled.")
        return data

class RoleCreateSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, required=False)

    class Meta:
        model = Role
        fields = ('id', 'name', 'description', 'permissions')
        read_only_fields = ('id',)

    def create(self, validated_data):
        # Extract permissions if provided, otherwise let the signal handle defaults
        permissions_data = validated_data.pop('permissions', [])
        role = Role.objects.create(**validated_data)
        
        # If permissions are provided, create them; otherwise, the signal will set defaults
        if permissions_data:
            for perm_data in permissions_data:
                Permission.objects.create(role=role, **perm_data)
        
        return role

    def to_representation(self, instance):
        # Ensure the response includes the permissions (handled by the signal or manual input)
        serializer = RoleSerializer(instance)
        return serializer.data

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ('id', 'name', 'description', 'permissions')

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', write_only=True, required=False
    )
    avatar = serializers.ImageField(required=False, allow_empty_file=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'avatar', 'role', 'role_id')
        read_only_fields = ('id',)

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.username = validated_data.get('username', instance.username)
        instance.avatar = validated_data.get('avatar', instance.avatar)
        instance.save()
        return instance

class UserCreateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', required=True
    )
 
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'avatar', 'role_id')
 
    def create(self, validated_data):
        # Generate a random password
        password_length = 12
        characters = string.ascii_letters + string.digits + string.punctuation
        random_password = ''.join(random.choice(characters) for _ in range(password_length))
 
        # Create user
        user = User(**validated_data)
        user.set_password(random_password)
        user.save()
 
        # Send email with credentials
        subject = 'Your Account Credentials'
        message = (
            f'Hello {user.first_name},\n\n'
            f'Your account has been created successfully. Here are your login credentials:\n'
            f'Email: {user.email}\n'
            f'Password: {random_password}\n\n'
            f'Please log in at {settings.FRONTEND_URL}/login and change your password after your first login.\n\n'
            f'Regards,\nYour Team'
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]
 
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't fail user creation
            print(f"Failed to send email: {str(e)}")
 
        return user
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else None
        return token

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid credentials")

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError("Passwords do not match")
        user = self.context['request'].user
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError("Current password is incorrect")
        return data