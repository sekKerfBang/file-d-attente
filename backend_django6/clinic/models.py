from django.db import models
from django.utils import timezone
import uuid

class Doctor(models.Model):
    SPECIALTIES = [
        ('general', 'Médecine Générale'),
        ('cardio', 'Cardiologie'),
        ('derma', 'Dermatologie'),
        ('pedia', 'Pédiatrie'),
        ('ortho', 'Orthopédie'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=20, choices=SPECIALTIES)
    room_number = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    current_patient = models.ForeignKey(
        'Patient', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='being_seen_by'
    )
    
    class Meta:
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name} ({self.get_specialty_display()})"

class Patient(models.Model):
    PRIORITY_CHOICES = [
        (1, 'Urgence'),
        (2, 'Prioritaire'),
        (3, 'Normal'),
        (4, 'Non urgent'),
    ]
    
    STATUS_CHOICES = [
        ('waiting', 'En attente'),
        ('in_progress', 'En consultation'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    ticket_number = models.CharField(max_length=20, unique=True)
    estimated_wait_time = models.IntegerField(default=0)  # en minutes
    created_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_doctor = models.ForeignKey(
        Doctor, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='patients'
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['priority', 'created_at']
    
    def __str__(self):
        return f"{self.ticket_number} - {self.first_name} {self.last_name}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            today = timezone.now().strftime('%Y%m%d')
            count = Patient.objects.filter(
                created_at__date=timezone.now().date()
            ).count() + 1
            self.ticket_number = f"{today}-{count:03d}"
        super().save(*args, **kwargs)

class QueueHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='history')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)  # 'created', 'called', 'completed', etc.
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Queue histories' 