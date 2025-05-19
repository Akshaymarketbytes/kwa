from django.contrib import admin
from .models import Complaint

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('serial_no', 'ticket_number', 'name', 'area', 'department', 'status', 'date')
    list_filter = ('status', 'area', 'department', 'date')
    search_fields = ('serial_no', 'ticket_number', 'name', 'phone_number', 'department')
    readonly_fields = ('serial_no', 'ticket_number')  # These fields are auto-generated and should not be edited manually
    ordering = ('-date',)

    fieldsets = (
        ('Complaint Details', {
            'fields': ('serial_no', 'ticket_number', 'status', 'date')
        }),
        ('User Information', {
            'fields': ('name', 'phone_number', 'address')
        }),
        ('Complaint Info', {
            'fields': ('area', 'complaint_type', 'department')
        }),
    )
