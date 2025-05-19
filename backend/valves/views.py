from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, NumberFilter
from rest_framework.filters import OrderingFilter
from .models import Valve, ValveLog, Area
from .serializers import ValveSerializer, ValveLogSerializer, AreaSerializer
from .permissions import HasDeletePermission, HasEditPermission  # UPDATED: Import HasEditPermission

class AreaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]

class ValveFilter(FilterSet):
    name = CharFilter(field_name='name', lookup_expr='icontains')
    area = CharFilter(field_name='area__area_name', lookup_expr='icontains')

    class Meta:
        model = Valve
        fields = ['name', 'area']

class ValveViewSet(viewsets.ModelViewSet):
    queryset = Valve.objects.all()
    serializer_class = ValveSerializer
    permission_classes = [IsAuthenticated, HasDeletePermission, HasEditPermission]  # UPDATED: Add HasEditPermission
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ValveFilter
    ordering_fields = ['area__area_name']
    page_name = 'valves'

class ValveLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ValveLog.objects.all().order_by('timestamp')
    serializer_class = ValveLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        valve_id = self.request.query_params.get('valve_id')
        return ValveLog.objects.filter(valve_id=valve_id).order_by('timestamp')