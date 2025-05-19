from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter, CharFilter
from rest_framework.filters import OrderingFilter
from .models import ConnectionType, Connection
from .serializer import ConnectionTypeSerializer, ConnectionSerializer
from .permissions import HasDeletePermission, HasAddPermission, HasEditPermission
from rest_framework.response import Response
from rest_framework import status
from authapp.models import Permission

class ConnectionTypeViewSet(viewsets.ModelViewSet):
    queryset = ConnectionType.objects.all()
    serializer_class = ConnectionTypeSerializer
    permission_classes = [IsAuthenticated, HasAddPermission, HasDeletePermission]
    page_name = 'e-tapp'

class ConnectionFilter(FilterSet):
    date_gte = DateFilter(field_name='created_at', lookup_expr='gte')
    date_lte = DateFilter(field_name='created_at', lookup_expr='lte')
    name = CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Connection
        fields = ['connection_type', 'area', 'status', 'date_gte', 'date_lte', 'name']

class ConnectionViewSet(viewsets.ModelViewSet):
    queryset = Connection.objects.all()
    serializer_class = ConnectionSerializer
    permission_classes = [IsAuthenticated, HasDeletePermission, HasEditPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ConnectionFilter
    ordering_fields = ['created_at']
    ordering = ['created_at']
    page_name = 'e-tapp'

    def partial_update(self, request, *args, **kwargs):
        # Check edit permission for PATCH requests (status updates)
        if not request.user.is_superuser and request.user.role:
            permission = Permission.objects.filter(
                role=request.user.role,
                page=self.page_name,
                can_edit=True
            ).exists()
            if not permission:
                return Response(
                    {'detail': 'You do not have permission to edit connections.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().partial_update(request, *args, **kwargs)