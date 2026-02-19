from rest_framework import serializers
from .models import Doctor, Patient, QueueHistory

class DoctorSerializer(serializers.ModelSerializer):
    current_patient_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'first_name', 'last_name', 'specialty', 
            'room_number', 'is_active', 'current_patient',
            'current_patient_details'
        ]
    
    def get_current_patient_details(self, obj):
        if obj.current_patient:
            return {
                'id': str(obj.current_patient.id),
                'ticket_number': obj.current_patient.ticket_number,
                'name': f"{obj.current_patient.first_name} {obj.current_patient.last_name}",
                'priority': obj.current_patient.priority
            }
        return None

class PatientSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    doctor_name = serializers.CharField(source='assigned_doctor.__str__', read_only=True)
    wait_time_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth',
            'phone', 'email', 'priority', 'priority_display',
            'status', 'status_display', 'ticket_number',
            'estimated_wait_time', 'created_at', 'called_at',
            'completed_at', 'assigned_doctor', 'doctor_name',
            'notes', 'wait_time_minutes'
        ]
    
    def get_wait_time_minutes(self, obj):
        if obj.status == 'waiting':
            from django.utils import timezone
            return int((timezone.now() - obj.created_at).total_seconds() / 60)
        return 0

class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'first_name', 'last_name', 'date_of_birth',
            'phone', 'email', 'priority', 'notes'
        ]

class QueueHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QueueHistory
        fields = '__all__'

class QueueStatsSerializer(serializers.Serializer):
    total_waiting = serializers.IntegerField()
    total_in_progress = serializers.IntegerField()
    total_completed_today = serializers.IntegerField()
    average_wait_time = serializers.FloatField()
    urgent_count = serializers.IntegerField()