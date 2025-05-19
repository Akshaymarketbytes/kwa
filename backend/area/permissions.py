# area/permissions.py
import logging
from rest_framework.permissions import BasePermission
from authapp.models import Permission

logger = logging.getLogger(__name__)

class HasAddPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        if request.user.is_superuser:
            logger.info(f"User {request.user.username} is superuser, granting add permission")
            return True
        if not request.user.role:
            logger.warning(f"User {request.user.username} has no role, denying add permission")
            return False
        page_name = getattr(view, 'page_name', '')
        has_permission = Permission.objects.filter(
            role=request.user.role,
            page=page_name,
            can_add=True
        ).exists()
        logger.info(f"User {request.user.username} add permission for {page_name}: {has_permission}")
        return has_permission

class HasDeletePermission(BasePermission):
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        if request.user.is_superuser:
            logger.info(f"User {request.user.username} is superuser, granting delete permission")
            return True
        if not request.user.role:
            logger.warning(f"User {request.user.username} has no role, denying delete permission")
            return False
        page_name = getattr(view, 'page_name', '')
        has_permission = Permission.objects.filter(
            role=request.user.role,
            page=page_name,
            can_delete=True
        ).exists()
        logger.info(f"User {request.user.username} delete permission for {page_name}: {has_permission}")
        return has_permission