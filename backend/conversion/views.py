from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter, CharFilter
from rest_framework.filters import OrderingFilter
from .models import Conversion
from .serializers import ConversionSerializer
from .permissions import HasDeletePermission, HasEditPermission
from rest_framework.response import Response
from rest_framework import status
from authapp.models import Permission

class ConversionFilter(FilterSet):
    date_gte = DateFilter(field_name='created_at', lookup_expr='gte')
    date_lte = DateFilter(field_name='created_at', lookup_expr='lte')
    name = CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Conversion
        fields = ['from_connection_type', 'to_connection_type', 'area', 'date_gte', 'date_lte', 'name']

class ConversionViewSet(viewsets.ModelViewSet):
    queryset = Conversion.objects.all()
    serializer_class = ConversionSerializer
    permission_classes = [IsAuthenticated, HasDeletePermission, HasEditPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ConversionFilter
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
                    {'detail': 'You do not have permission to edit conversions.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().partial_update(request, *args, **kwargs)