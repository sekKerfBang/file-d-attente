from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, F, ExpressionWrapper, fields
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.http import JsonResponse
from django.db import connection

from .models import Doctor, Patient, QueueHistory
from .serializers import (
    DoctorSerializer, PatientSerializer, PatientCreateSerializer,
    QueueHistorySerializer, QueueStatsSerializer
)

def health_check(request):
    """Endpoint simple pour vérifier que tout fonctionne"""
    try:
        # Test DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            "status": "ok",
            "database": "connected",
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e)
        }, status=500)

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    
    @action(detail=True, methods=['post'])
    def call_next(self, request, pk=None):
        doctor = self.get_object()
        
        # Trouver le prochain patient
        next_patient = Patient.objects.filter(
            status='waiting',
            priority__lte=3  # Urgence, Prioritaire, Normal
        ).exclude(
            assigned_doctor__isnull=False
        ).first()
        
        if not next_patient:
            return Response(
                {'error': 'Aucun patient en attente'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mettre à jour le patient précédent si existe
        if doctor.current_patient:
            prev_patient = doctor.current_patient
            prev_patient.status = 'completed'
            prev_patient.completed_at = timezone.now()
            prev_patient.save()
            
            QueueHistory.objects.create(
                patient=prev_patient,
                doctor=doctor,
                action='completed',
                details={'duration_minutes': 30}
            )
        
        # Assigner nouveau patient
        next_patient.status = 'in_progress'
        next_patient.assigned_doctor = doctor
        next_patient.called_at = timezone.now()
        next_patient.save()
        
        doctor.current_patient = next_patient
        doctor.save()
        
        QueueHistory.objects.create(
            patient=next_patient,
            doctor=doctor,
            action='called',
            details={'room': doctor.room_number}
        )
        
        # Notifier via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'queue_updates',
            {
                'type': 'queue_update',
                'message': {
                    'type': 'patient_called',
                    'doctor_id': str(doctor.id),
                    'patient': PatientSerializer(next_patient).data
                }
            }
        )
        
        return Response(PatientSerializer(next_patient).data)
    
    @action(detail=True, methods=['post'])
    def finish_current(self, request, pk=None):
        doctor = self.get_object()
        
        if not doctor.current_patient:
            return Response(
                {'error': 'Aucun patient en cours'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        patient = doctor.current_patient
        patient.status = 'completed'
        patient.completed_at = timezone.now()
        patient.save()
        
        QueueHistory.objects.create(
            patient=patient,
            doctor=doctor,
            action='completed'
        )
        
        doctor.current_patient = None
        doctor.save()
        
        # Notifier
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'queue_updates',
            {
                'type': 'queue_update',
                'message': {
                    'type': 'patient_finished',
                    'doctor_id': str(doctor.id),
                    'patient_id': str(patient.id)
                }
            }
        )
        
        return Response({'status': 'Patient terminé'})

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer
    
    def get_queryset(self):
        queryset = Patient.objects.all()
        status_param = self.request.query_params.get('status', None)
        priority = self.request.query_params.get('priority', None)
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.select_related('assigned_doctor')
    
    def perform_create(self, serializer):
        patient = serializer.save()
        
        # Calculer temps d'attente estimé
        waiting_count = Patient.objects.filter(
            status='waiting',
            priority__lte=patient.priority,
            created_at__lt=patient.created_at
        ).count()
        patient.estimated_wait_time = waiting_count * 15  # 15 min par patient
        patient.save()
        
        QueueHistory.objects.create(
            patient=patient,
            action='created',
            details={'priority': patient.priority}
        )
        
        # Notifier nouvelle arrivée
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'queue_updates',
            {
                'type': 'queue_update',
                'message': {
                    'type': 'new_patient',
                    'patient': PatientSerializer(patient).data
                }
            }
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        patient = self.get_object()
        patient.status = 'cancelled'
        patient.save()
        
        QueueHistory.objects.create(
            patient=patient,
            action='cancelled'
        )
        
        # Notifier
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'queue_updates',
            {
                'type': 'queue_update',
                'message': {
                    'type': 'patient_cancelled',
                    'patient_id': str(patient.id)
                }
            }
        )
        
        return Response({'status': 'Patient annulé'})

class QueueStatsViewSet(viewsets.ViewSet):
    def list(self, request):
        today = timezone.now().date()
        
        total_waiting = Patient.objects.filter(status='waiting').count()
        total_in_progress = Patient.objects.filter(status='in_progress').count()
        total_completed = Patient.objects.filter(
            status='completed',
            completed_at__date=today
        ).count()
        
        # Temps d'attente moyen
        completed_today = Patient.objects.filter(
            status='completed',
            completed_at__date=today,
            called_at__isnull=False
        )
        
        avg_wait = 0
        if completed_today.exists():
            avg_wait = completed_today.annotate(
                wait_time=ExpressionWrapper(
                    F('called_at') - F('created_at'),
                    output_field=fields.DurationField()
                )
            ).aggregate(avg=Avg('wait_time'))['avg']
            if avg_wait:
                avg_wait = avg_wait.total_seconds() / 60
        
        urgent_count = Patient.objects.filter(
            status='waiting',
            priority=1
        ).count()
        
        data = {
            'total_waiting': total_waiting,
            'total_in_progress': total_in_progress,
            'total_completed_today': total_completed,
            'average_wait_time': round(avg_wait, 2),
            'urgent_count': urgent_count
        }
        
        serializer = QueueStatsSerializer(data)
        return Response(serializer.data)