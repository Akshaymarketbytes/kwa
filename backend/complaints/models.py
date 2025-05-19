from django.db import models
import re
from datetime import date

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('accepted', 'Accepted'),
        ('processing', 'Processing'),
        ('return_for_review', 'Return for Review'),
    ]
    area = models.ForeignKey('area.Area', on_delete=models.CASCADE, null=True)
    serial_no = models.CharField(max_length=255, unique=True, editable=False)
    complaint_type = models.CharField(max_length=255)
    ticket_number = models.CharField(max_length=255, unique=True, editable=False)
    name = models.CharField(max_length=255)
    date = models.DateField(default=date.today)
    address = models.TextField()
    phone_number = models.CharField(max_length=15)
    department = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    created_by = models.ForeignKey('authapp.User', on_delete=models.SET_NULL, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.serial_no:
            last_complaint = Complaint.objects.order_by('-serial_no').first()
            if last_complaint:
                self.serial_no = f"{int(last_complaint.serial_no) + 1:03d}"
            else:
                self.serial_no = "001"

        if not self.ticket_number:
            area_code = self.area.area_name[:3].upper()
            last_ticket = Complaint.objects.filter(area=self.area).order_by('-ticket_number').first()
            if last_ticket and re.match(r'^[A-Z]{3}\d{3}$', last_ticket.ticket_number):
                ticket_number = int(last_ticket.ticket_number[3:]) + 1
            else:
                ticket_number = 1
            self.ticket_number = f"{area_code}{ticket_number:03d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Complaint by {self.name} in {self.area.area_name}"