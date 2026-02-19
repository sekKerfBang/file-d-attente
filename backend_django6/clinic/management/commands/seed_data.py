from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random
from clinic.models import Doctor, Patient

class Command(BaseCommand):
    help = 'Génère des données de test pour la clinique'

    def handle(self, *args, **kwargs):
        self.stdout.write('Création des données de test...')
        
        # Créer les médecins
        doctors_data = [
            {
                'first_name': 'Marie',
                'last_name': 'Martin',
                'specialty': 'general',
                'room_number': '101'
            },
            {
                'first_name': 'Pierre',
                'last_name': 'Dubois',
                'specialty': 'cardio',
                'room_number': '102'
            },
            {
                'first_name': 'Sophie',
                'last_name': 'Bernard',
                'specialty': 'derma',
                'room_number': '103'
            },
            {
                'first_name': 'Yamoussa',
                'last_name': 'Petit',
                'specialty': 'pedia',
                'room_number': '104'
            },
            {
                'first_name': 'Bangoura',
                'last_name': 'Robert',
                'specialty': 'ortho',
                'room_number': '105'
            }
        ]
        
        doctors = []
        for doc_data in doctors_data:
            doctor, created = Doctor.objects.get_or_create(
                room_number=doc_data['room_number'],
                defaults=doc_data
            )
            doctors.append(doctor)
            if created:
                self.stdout.write(f'  ✓ Dr. {doc_data["first_name"]} {doc_data["last_name"]} créé')
        
        # Créer 20 patients
        first_names = [
            'Lucas', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia',
            'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte', 'Jackson',
            'Amelia', 'Aiden', 'Harper', 'Oliver', 'Evelyn', 'Elijah', 'Abigail',
            'James', 'Emily', 'Benjamin', 'Elizabeth', 'Lucas', 'Sofia', 'Henry', 'Avery'
        ]
        last_names = [
            'Dubois', 'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard',
            'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
            'Garcia', 'Roux', 'Bonnet', 'André', 'François', 'Mercier'
        ]
        
        priorities = [1, 2, 3, 4]
        weights = [0.1, 0.2, 0.6, 0.1]  # 10% urgence, 20% prioritaire, 60% normal, 10% non urgent
        
        for i in range(20):
            patient_data = {
                'first_name': random.choice(first_names),
                'last_name': random.choice(last_names),
                'date_of_birth': date(
                    random.randint(1950, 2010),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),
                'phone': f'06{random.randint(10000000, 99999999)}',
                'email': f'patient{i}@email.com',
                'priority': random.choices(priorities, weights=weights)[0],
                'status': 'waiting',
                'notes': random.choice([
                    '', '', '', '',  # Plus souvent vide
                    'Douleurs thoraciques',
                    'Contrôle annuel',
                    'Renouvellement ordonnance',
                    'Fièvre depuis 3 jours'
                ])
            }
            
            # Quelques patients en consultation
            if i < 3:
                patient_data['status'] = 'in_progress'
                patient_data['assigned_doctor'] = doctors[i]
                patient_data['called_at'] = timezone.now() - timedelta(minutes=random.randint(5, 30))
            
            # Quelques patients terminés
            elif i < 6:
                patient_data['status'] = 'completed'
                patient_data['assigned_doctor'] = doctors[i-3]
                patient_data['called_at'] = timezone.now() - timedelta(hours=2)
                patient_data['completed_at'] = timezone.now() - timedelta(hours=1, minutes=30)
            
            patient = Patient.objects.create(**patient_data)
            self.stdout.write(f'  ✓ Patient {patient.ticket_number} créé ({patient.get_priority_display()})')
        
        # Mettre à jour current_patient des médecins
        for i, doctor in enumerate(doctors[:3]):
            in_progress = Patient.objects.filter(
                assigned_doctor=doctor,
                status='in_progress'
            ).first()
            if in_progress:
                doctor.current_patient = in_progress
                doctor.save()
        
        self.stdout.write(self.style.SUCCESS('Données de test créées avec succès !'))
        self.stdout.write(f'  - {Doctor.objects.count()} médecins')
        self.stdout.write(f'  - {Patient.objects.filter(status="waiting").count()} patients en attente')
        self.stdout.write(f'  - {Patient.objects.filter(status="in_progress").count()} en consultation')