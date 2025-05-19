from django.contrib import admin
from .models import Valve

@admin.register(Valve)
class ValveAdmin(admin.ModelAdmin):
    list_display = ('name', 'size', 'full_open_condition', 'current_position', 'remarks', 'previous_position')
    search_fields = ('name', 'size', 'remarks') 
    list_filter = ('size', 'full_open_condition')

    def current_position(self, obj):
        return f""

    current_position.short_description = 'Current Position'
