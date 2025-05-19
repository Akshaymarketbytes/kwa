from rest_framework import serializers
from .models import ConnectionType, Connection

class ConnectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionType
        fields = ['id', 'name']

class ConnectionSerializer(serializers.ModelSerializer):
    connection_type_detail = ConnectionTypeSerializer(source='connection_type', read_only=True)
    status = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Connection
        fields = ['id', 'name', 'address', 'file_number', 'area', 'connection_type', 'connection_type_detail', 'status', 'created_at']