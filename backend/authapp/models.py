from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Permission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    page = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_add = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    is_login_page = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'page')

    def save(self, *args, **kwargs):
        if self.is_login_page:
            Permission.objects.filter(
                role=self.role,
                is_login_page=True
            ).exclude(id=self.id).update(is_login_page=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.role.name} - {self.page}"

class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

# Signal to set default permissions for new roles
@receiver(post_save, sender=Role)
def set_default_permissions(sender, instance, created, **kwargs):
    if created:
        default_permissions = [
            {'page': 'dashboard', 'can_view': True},
            {'page': 'profile', 'can_view': True},
        ]
        for perm in default_permissions:
            try:
                Permission.objects.create(
                    role=instance,
                    page=perm['page'],
                    can_view=perm['can_view'],
                    can_add=False,
                    can_edit=False,
                    can_delete=False,
                    is_login_page=False
                )
            except Exception as e:
                print(f"Error creating permission for {perm['page']}: {str(e)}")