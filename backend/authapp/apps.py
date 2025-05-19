from django.apps import AppConfig

class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authapp'

    def ready(self):
        from .models import set_default_permissions