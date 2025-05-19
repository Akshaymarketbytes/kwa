from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from complaints.models import Complaint
from complaints.serializers import ComplaintSerializer
from complaints.permissions import HasDeletePermission
from authapp.models import Permission
from rest_framework.response import Response
from rest_framework import status

class ComplaintFilter(FilterSet):
    name = CharFilter(field_name='name', lookup_expr='icontains')
    department = CharFilter(field_name='department', lookup_expr='exact')
    status = CharFilter(field_name='status', lookup_expr='exact')
    date__gte = CharFilter(field_name='date', lookup_expr='gte')
    date__lte = CharFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = Complaint
        fields = ['name', 'department', 'status', 'date__gte', 'date__lte']

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, HasDeletePermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ComplaintFilter
    ordering_fields = ['date', 'serial_no', 'ticket_number']
    ordering = ['-date']
    page_name = 'complaints'

    def partial_update(self, request, *args, **kwargs):
        # Check edit permission for PATCH requests
        if not request.user.is_superuser and request.user.role:
            permission = Permission.objects.filter(
                role=request.user.role,
                page=self.page_name,
                can_edit=True
            ).exists()
            if not permission:
                return Response(
                    {'detail': 'You do not have permission to edit complaints.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)