from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from .models import User, Role, Permission
from .serializers import (
    LoginSerializer, UserSerializer, UserCreateSerializer, ForgotPasswordSerializer,
    OTPVerificationSerializer, ResetPasswordSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer, RoleSerializer, PermissionSerializer
)
from django.core.cache import cache
from django.utils.crypto import get_random_string
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets
from .models import Role
from .serializers import RoleCreateSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleCreateSerializer

class HasPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        page = view.__class__.__name__.lower().replace('view', '')
        return has_permission(request.user, page)

def has_permission(user, page, action='can_view'):
    if user.is_superuser:
        return True
    if not user.role:
        return False
    return Permission.objects.filter(
        role=user.role,
        page=page,
        **{action: True}
    ).exists()

def get_role_login_page(role):
    """Retrieve the designated login page for a role."""
    if not role:
        return None
    permission = Permission.objects.filter(role=role, is_login_page=True).first()
    return permission.page if permission else None

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            tokens = CustomTokenObtainPairSerializer.get_token(user)
            login_page = get_role_login_page(user.role)
            return Response({
                'access': str(tokens.access_token),
                'refresh': str(tokens),
                'role': user.role.name if user.role else None,
                'login_page': login_page, 
            }, status=status.HTTP_200_OK)
        error_message = "Invalid credentials"
        if isinstance(serializer.errors, dict):
            error_message = next(iter(serializer.errors.values()))[0] if serializer.errors else error_message
        return Response({'non_field_errors': [error_message]}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        if 'role_id' in request.data and not user.is_superuser:
            return Response({'error': 'Only superadmin can edit roles'}, status=status.HTTP_403_FORBIDDEN)

        # Debug the incoming data
        print("Received data:", request.data)

        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # Return updated data including avatar URL
            updated_serializer = UserSerializer(user)
            return Response({
                'message': 'Profile updated successfully',
                'data': updated_serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                otp = get_random_string(length=6, allowed_chars='0123456789')
                cache.set(f"otp_{email}", otp, timeout=300)

                subject = 'Your OTP for Password Reset'
                message = f'Your OTP to reset your password is: {otp}\nThis OTP is valid for 5 minutes.'
                from_email = settings.DEFAULT_FROM_EMAIL
                recipient_list = [email]

                try:
                    send_mail(
                        subject,
                        message,
                        from_email,
                        recipient_list,
                        fail_silently=False,
                    )
                    return Response({'message': 'OTP sent to your email'}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response(
                        {'error': f'Failed to send email: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OTPVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            cached_otp = cache.get(f"otp_{email}")
            if cached_otp and cached_otp == otp:
                cache.set(f"verified_{email}", True, timeout=600)
                return Response({'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            if not cache.get(f"verified_{email}"):
                return Response({'error': 'OTP not verified'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(email=email)
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                cache.delete(f"verified_{email}")
                cache.delete(f"otp_{email}")
                return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not has_permission(request.user, 'role', 'can_view'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not has_permission(request.user, 'role', 'can_add'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            role = Role.objects.get(pk=pk)
            serializer = RoleSerializer(role)
            return Response(serializer.data)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if not has_permission(request.user, 'role', 'can_edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role = Role.objects.get(pk=pk)
            serializer = RoleSerializer(role, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not has_permission(request.user, 'role', 'can_delete'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role = Role.objects.get(pk=pk)
            role.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

class PermissionView(APIView):
    permission_classes = [HasPermission]

    def post(self, request):
        if not has_permission(request.user, 'permission', 'can_add'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PermissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not has_permission(request.user, 'permission', 'can_view'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        permissions = Permission.objects.all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)

class PermissionDetailView(APIView):
    permission_classes = [HasPermission]

    def put(self, request, pk):
        if not has_permission(request.user, 'permission', 'can_edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            permission = Permission.objects.get(pk=pk)
            serializer = PermissionSerializer(permission, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Permission.DoesNotExist:
            return Response({'error': 'Permission not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not has_permission(request.user, 'permission', 'can_delete'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            permission = Permission.objects.get(pk=pk)
            permission.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Permission.DoesNotExist:
            return Response({'error': 'Permission not found'}, status=status.HTTP_404_NOT_FOUND)

class UserManagementView(APIView):
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        if not has_permission(request.user, 'usermanagement', 'can_view'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
 
    def post(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Only superadmin can create users'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [HasPermission]

    def get(self, request, pk):
        if not has_permission(request.user, 'userdetail', 'can_view'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if not has_permission(request.user, 'userdetail', 'can_edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not has_permission(request.user, 'userdetail', 'can_delete'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)