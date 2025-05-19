from rest_framework import serializers
from .models import Complaint

class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['id', 'serial_no', 'complaint_type', 'ticket_number', 'name', 'date', 'address', 'phone_number', 'department', 'status', 'area']

    def validate_area(self, value):
        if value is None:
            raise serializers.ValidationError("Area field is required.")
        return value
