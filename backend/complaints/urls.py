from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet)  # Correct registration

urlpatterns = [
    path('', include(router.urls)),
]
