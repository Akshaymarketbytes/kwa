from django.urls import path
from authapp.views import (
    LoginView, LogoutView, ProfileView, ForgotPasswordView, OTPVerificationView,
    ResetPasswordView, ChangePasswordView, RoleView, RoleDetailView,
    PermissionView, PermissionDetailView, UserManagementView, UserDetailView,
    CustomTokenObtainPairView, PermissionListView
)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('otp-verification/', OTPVerificationView.as_view(), name='otp_verification'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('roles/', RoleView.as_view(), name='role_list'),
    path('roles/<int:pk>/', RoleDetailView.as_view(), name='role_detail'),
    path('permissions/', PermissionView.as_view(), name='permission_create'),
    path('permissions/list/', PermissionListView.as_view(), name='permission_list'),
    path('permissions/<int:pk>/', PermissionDetailView.as_view(), name='permission_detail'),
    path('users/', UserManagementView.as_view(), name='user_management'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)