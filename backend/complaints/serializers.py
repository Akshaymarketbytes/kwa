from rest_framework import serializers
from .models import Complaint
from area.models import Area

class AreaSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='area_name')

    class Meta:
        model = Area
        fields = ['id', 'name']

class ComplaintSerializer(serializers.ModelSerializer):
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(),
        source='area',
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Complaint
        fields = ['id', 'serial_no', 'complaint_type', 'ticket_number', 'name', 'date', 'address', 'phone_number', 'department', 'status', 'area', 'area_id',]