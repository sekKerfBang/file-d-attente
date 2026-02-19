from django.contrib import admin
from .models import Doctor, Patient, QueueHistory

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'specialty', 'room_number', 'is_active', 'current_patient']
    list_filter = ['specialty', 'is_active']
    search_fields = ['first_name', 'last_name']

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'first_name', 'last_name', 'priority', 'status', 'created_at']
    list_filter = ['priority', 'status', 'created_at']
    search_fields = ['first_name', 'last_name', 'ticket_number']
    date_hierarchy = 'created_at'

@admin.register(QueueHistory)
class QueueHistoryAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'action', 'timestamp']
    list_filter = ['action', 'timestamp']
    date_hierarchy = 'timestamp'