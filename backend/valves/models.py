from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from area.models import Area

class Valve(models.Model):
    name = models.CharField(max_length=100)
    size = models.CharField(max_length=50)
    full_open_condition = models.FloatField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(1000),
        ],
        help_text="Enter a number for full open condition (e.g., 100.0)."
    )
    current_condition = models.FloatField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(1000),
        ],
        help_text="Enter a number for current condition (e.g., 50.5)."
    )
    mid_point = models.FloatField(
        default=0.5,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(1),
        ],
        help_text="Mid-point of the curve (default 0.5).", null=True, blank=True,
    )
    steepness = models.FloatField(
        default=12.5,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
        help_text="Steepness factor (default 12.5).", null=True, blank=True,
    )
    remarks = models.TextField()
    previous_position = models.CharField(max_length=100, null=True, blank=True, default=None)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    area_image = models.ImageField(null=True, blank=True)
    area = models.ForeignKey(Area, on_delete=models.SET_NULL, null=True, blank=True, related_name='valves')
    
    def __str__(self):
        return self.name

class ValveLog(models.Model):
    valve = models.ForeignKey(Valve, related_name='logs', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_field = models.CharField(max_length=100)
    old_value = models.TextField()
    new_value = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.valve.name} - {self.changed_field} changed on {self.timestamp}"