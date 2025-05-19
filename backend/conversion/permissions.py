from rest_framework.permissions import BasePermission
from authapp.models import Permission

class HasDeletePermission(BasePermission):
    def has_permission(self, request, view):
        """
        Check if the user has delete permission for the specified page.
        Allows all methods except DELETE unless can_delete is granted.
        """
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
        """
        Check if the user has edit permission for the specified page.
        Allows all methods except PATCH unless can_edit is granted.
        """
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