from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import HasAddPermission, HasDeletePermission 
from .models import Area
from .serializers import AreaSerializer

class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated, HasAddPermission, HasDeletePermission]
    page_name = 'area'