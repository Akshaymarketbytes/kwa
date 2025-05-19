# connectiontype/permissions.py
from rest_framework.permissions import BasePermission
from authapp.models import Permission

class HasAddPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        if request.user.is_superuser:
            return True
        if not request.user.role:
            return False
        return Permission.objects.filter(
            role=request.user.role,
            page=getattr(view, 'page_name', ''),
            can_add=True
        ).exists()

class HasDeletePermission(BasePermission):
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        if request.user.is_superuser:
            return True
        if not request.user.role:
            return False
        return Permission.objects.filter(
            role=request.user.role,
            page=getattr(view, 'page_name', ''),
            can_delete=True
        ).exists()

class HasEditPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method != 'PATCH':
            return True
        if request.user.is_superuser:
            return True
        if not request.user.role:
            return False
        return Permission.objects.filter(
            role=request.user.role,
            page=getattr(view, 'page_name', ''),
            can_edit=True
        ).exists()