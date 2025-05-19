from django.db import models

class ConnectionType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Connection(models.Model):
    STATUS_CHOICES = [
        ('assistant_engineer', 'Assistant Engineer'),
        ('fo', 'FO'),
        ('site_inspector', 'Site Inspector'),
        ('completed', 'Completed'),
    ]

    name = models.CharField(max_length=200)
    address = models.TextField()
    file_number = models.CharField(max_length=50, unique=True)
    area = models.CharField(max_length=100)
    connection_type = models.ForeignKey(ConnectionType, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assistant_engineer')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_number} - {self.name}"

    class Meta:
        ordering = ['-created_at']
