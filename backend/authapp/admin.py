from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission

class PermissionInline(admin.TabularInline):
    model = Permission
    extra = 1 
    fields = ('page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    min_num = 0 

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')
    inlines = [PermissionInline]

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    list_filter = ('role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    search_fields = ('role__name', 'page')

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'role__name')
    list_filter = ('is_staff', 'is_superuser', 'role')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name', 'avatar', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role', 'first_name', 'last_name', 'avatar'),
        }),
    )
    ordering = ('email',)