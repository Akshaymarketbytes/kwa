from django.db import models

class Area(models.Model):
    area_name = models.CharField(max_length=255)

    def __str__(self):
        return self.area_name