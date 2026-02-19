# utilisateur/models.py
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('doctor', 'Médecin'),
        ('patient', 'Patient'),
        ('secretary', 'Secrétaire'),
    ]
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='patient'
    )
    
    # Champs supplémentaires pour les médecins
    specialty = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Spécialité"
    )
    
    # Champs pour les patients
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Téléphone"
    )
    date_of_birth = models.DateField(
        blank=True, 
        null=True,
        verbose_name="Date de naissance"
    )
    
    # Statut du compte
    is_active_account = models.BooleanField(
        default=True,
        verbose_name="Compte actif"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser

    @property
    def is_doctor(self):
        return self.role == 'doctor'

    @property
    def is_patient_user(self):
        return self.role == 'patient'

    def save(self, *args, **kwargs):
        # Si superuser, force le rôle admin
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)