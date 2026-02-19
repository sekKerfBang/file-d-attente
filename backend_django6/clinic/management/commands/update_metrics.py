from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from clinic.models import Patient
from clinic.metrics import (
    patients_waiting, 
    patients_in_progress, 
    wait_time_average
)

class Command(BaseCommand):
    help = 'Met à jour les métriques Prometheus'

    def handle(self, *args, **options):
        # Patients par priorité
        for priority in [1, 2, 3, 4]:
            count = Patient.objects.filter(
                status='waiting',
                priority=priority
            ).count()
            patients_waiting.labels(priority=str(priority)).set(count)
        
        # Patients en consultation
        in_progress = Patient.objects.filter(status='in_progress').count()
        patients_in_progress.set(in_progress)
        
        # Temps d'attente moyen (dernière heure)
        recent = Patient.objects.filter(
            status='completed',
            completed_at__gte=timezone.now() - timedelta(hours=1)
        )
        
        avg_wait = 0
        if recent.exists():
            total_wait = sum(
                (p.called_at - p.created_at).total_seconds() / 60 
                for p in recent if p.called_at
            )
            avg_wait = total_wait / recent.count()
        
        wait_time_average.set(avg_wait)
        
        self.stdout.write(
            self.style.SUCCESS(f'Métriques mises à jour: {in_progress} en consultation')
        )