from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConnectionTypeViewSet, ConnectionViewSet

router = DefaultRouter()
router.register(r'connection-types', ConnectionTypeViewSet)
router.register(r'connections', ConnectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
