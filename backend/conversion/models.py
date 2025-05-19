from django.db import models
from connectiontype.models import ConnectionType

class Conversion(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    file_number = models.CharField(max_length=100, unique=True)
    area = models.CharField(max_length=255)
    from_connection_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, related_name='from_conversions')
    to_connection_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, related_name='to_conversions')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.file_number}"