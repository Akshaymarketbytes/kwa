from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversionViewSet

router = DefaultRouter()
router.register(r'conversions', ConversionViewSet, basename='conversion')

app_name = 'conversion'

urlpatterns = [
    path('', include(router.urls)),
]