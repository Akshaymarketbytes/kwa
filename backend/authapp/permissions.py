from django.contrib.auth.models import User
from .models import Permission

def has_permission(user, page, action='can_view'):
    if user.is_superuser:
        return True
    if not user.role:
        print(f"No role assigned to user {user.email}")
        return False
    has_perm = Permission.objects.filter(
        role=user.role,
        page=page,
        **{action: True}
    ).exists()
    print(f"User {user.email} permission check for {page} {action}: {has_perm}")
    return has_perm

def get_role_login_page(role):
    """Retrieve the designated login page for a role."""
    if not role:
        return None
    permission = Permission.objects.filter(role=role, is_login_page=True).first()
    return permission.page if permission else None