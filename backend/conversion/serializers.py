from rest_framework import serializers
from .models import Conversion
from connectiontype.models import ConnectionType
from connectiontype.serializer import ConnectionTypeSerializer

class ConversionSerializer(serializers.ModelSerializer):
    from_connection_type_detail = ConnectionTypeSerializer(source='from_connection_type', read_only=True)
    to_connection_type_detail = ConnectionTypeSerializer(source='to_connection_type', read_only=True)

    class Meta:
        model = Conversion
        fields = [
            'id',
            'name',
            'address',
            'file_number',
            'area',
            'from_connection_type',
            'to_connection_type',
            'from_connection_type_detail',
            'to_connection_type_detail',
            'created_at',
        ]

    def validate_from_connection_type(self, value):
        if not ConnectionType.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid from_connection_type.")
        return value

    def validate_to_connection_type(self, value):
        if not ConnectionType.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid to_connection_type.")
        return value