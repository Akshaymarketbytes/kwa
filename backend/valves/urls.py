from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ValveViewSet, ValveLogViewSet

router = DefaultRouter()
router.register(r'valves', ValveViewSet)
router.register(r'logs', ValveLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
