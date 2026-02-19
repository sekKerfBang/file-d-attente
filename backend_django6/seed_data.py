#!/usr/bin/env python3
"""
Script d'insertion de données de test pour le système de file d'attente
Run: python seed_data.py
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from faker import Faker

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from clinic.models import Doctor, Patient, QueueHistory
from django.utils import timezone

fake = Faker('fr_FR')

# Configuration
NUM_DOCTORS = 6
NUM_PATIENTS_WAITING = 8
NUM_PATIENTS_IN_PROGRESS = 3
NUM_PATIENTS_COMPLETED_TODAY = 15

SPECIALTIES = [
    'Médecine générale',
    'Cardiologie',
    'Pédiatrie',
    'Dermatologie',
    'Orthopédie',
    'Neurologie'
]

URGENCY_LEVELS = ['low', 'normal', 'high', 'critical']
STATUSES = ['waiting', 'in_progress', 'completed', 'cancelled']


#... dans les fonctions, remplace QueueStats par QueueHistory ...
def create_history(patient, doctor, action, details=None):
    """Helper pour créer l'historique"""
    QueueHistory.objects.create(
        patient=patient,
        doctor=doctor,
        action=action,
        details=details or {}
    )


def create_doctors():
    """Crée les médecins"""
    print("\n👨‍⚕️ Création des médecins...")
    
    # Supprime d'abord pour éviter les doublons
    Doctor.objects.all().delete()
    
    doctors = Doctor.objects.bulk_create([
        Doctor(
            first_name="Jean",
            last_name="Martin",
            specialty="general",
            room_number="A101",
            is_active=True
        ),
        Doctor(
            first_name="Marie",
            last_name="Bernard",
            specialty="cardio",
            room_number="B202",
            is_active=True
        ),
        Doctor(
            first_name="Pierre",
            last_name="Dubois",
            specialty="pedia",
            room_number="C303",
            is_active=True
        ),
        Doctor(
            first_name="Sophie",
            last_name="Lefebvre",
            specialty="derma",
            room_number="D404",
            is_active=True
        ),
        Doctor(
            first_name="Lucas",
            last_name="Moreau",
            specialty="ortho",
            room_number="E505",
            is_active=False
        ),
    ])
    
    for doctor in doctors:
        status = "✅ Actif" if doctor.is_active else "⏸️ Inactif"
        print(f"  Créé: {doctor} - {status}")
    
    return doctors
# def create_doctors():
#     """Crée les médecins"""
#     print("👨‍⚕️ Création des médecins...")
    
#     doctors_data = [
#         {"first_name": "Jean", "last_name": "Martin", "specialty": "Médecine générale", "room": "A101"},
#         {"first_name": "Marie", "last_name": "Bernard", "specialty": "Cardiologie", "room": "B202"},
#         {"first_name": "Pierre", "last_name": "Dubois", "specialty": "Pédiatrie", "room": "C303"},
#         {"first_name": "Sophie", "last_name": "Lefebvre", "specialty": "Dermatologie", "room": "D404"},
#         {"first_name": "Lucas", "last_name": "Moreau", "specialty": "Orthopédie", "room": "E505"},
#         {"first_name": "Emma", "last_name": "Roux", "specialty": "Neurologie", "room": "F606"},
#     ]
    
#     doctors = []
#     for i, data in enumerate(doctors_data):
#         doctor, created = Doctor.objects.get_or_create(
#             email=f"dr.{data['last_name'].lower()}@clinique.fr",
#             defaults={
#                 "first_name": data["first_name"],
#                 "last_name": data["last_name"],
#                 "specialty": data["specialty"],
#                 "room_number": data["room"],
#                 "is_active": i < 4,  # 4 médecins actifs sur 6
#                 "current_patient_id": None
#             }
#         )
#         doctors.append(doctor)
#         status = "✅ Actif" if doctor.is_active else "⏸️ Inactif"
#         print(f"  {'Créé' if created else 'Existant'}: Dr. {doctor} - {status}")
    
#     return doctors


def create_patients_waiting(doctors):
    """Crée les patients en attente"""
    print(f"\n⏳ Création de {NUM_PATIENTS_WAITING} patients en attente...")
    
    patients = []
    reasons = [
        "Douleurs thoraciques",
        "Fièvre élevée",
        "Entorse cheville",
        "Mal de tête persistant",
        "Éruption cutanée",
        "Toux chronique",
        "Douleurs abdominales",
        "Renouvellement ordonnance"
    ]
    
    for i in range(NUM_PATIENTS_WAITING):
        # Distribution des priorités : 10% urgence, 20% prioritaire, 60% normal, 10% non urgent
        priority = random.choices([1, 2, 3, 4], weights=[10, 20, 60, 10])[0]
        
        # ✅ CORRIGÉ : utilise created_at au lieu de arrival_time
        # On simule une arrivée entre 10 et 180 minutes dans le passé
        created_at = timezone.now() - timedelta(minutes=random.randint(10, 180))
        
        patient = Patient.objects.create(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            date_of_birth=fake.date_of_birth(minimum_age=5, maximum_age=85),
            phone=fake.phone_number(),
            email=fake.email(),
            priority=priority,  # ✅ CORRIGÉ : priority au lieu de urgency_level
            status='waiting',
            estimated_wait_time=random.randint(10, 60),
            notes=random.choice(reasons),  # ✅ CORRIGÉ : notes au lieu de reason
            assigned_doctor=None
            # ❌ PAS DE arrival_time - created_at est auto_now_add
        )
        
        # Force la date de création (pour simuler des arrivées passées)
        Patient.objects.filter(id=patient.id).update(created_at=created_at)
        patient.refresh_from_db()
        
        # Crée l'historique
        QueueHistory.objects.create(
            patient=patient,
            doctor=None,
            action='created',
            details={'source': 'seed_data', 'initial_priority': priority}
        )
        
        patients.append(patient)
        
        icon = "🔴" if priority == 1 else "🟠" if priority == 2 else "🟡" if priority == 3 else "🟢"
        priority_label = patient.get_priority_display()
        print(f"  {icon} {patient.ticket_number} {patient.last_name} - {priority_label} - {patient.estimated_wait_time}min")
    
    return patients

# def create_patients_waiting(doctors):
#     """Crée les patients en attente"""
#     print(f"\n⏳ Création de {NUM_PATIENTS_WAITING} patients en attente...")
    
#     patients = []
#     for i in range(NUM_PATIENTS_WAITING):
#         # Certains patients ont une urgence élevée
#         urgency = random.choices(
#             URGENCY_LEVELS, 
#             weights=[40, 35, 20, 5]  # 40% low, 35% normal, 20% high, 5% critical
#         )[0]
        
#         arrival_time = datetime.now() - timedelta(minutes=random.randint(5, 120))
        
#         patient = Patient.objects.create(
#             first_name=fake.first_name(),
#             last_name=fake.last_name(),
#             date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=85),
#             phone=fake.phone_number(),
#             email=fake.email(),
#             reason=fake.sentence(nb_words=6),
#             urgency_level=urgency,
#             status='waiting',
#             arrival_time=arrival_time,
#             estimated_wait_time=random.randint(10, 60),
#             assigned_doctor=None
#         )
#         patients.append(patient)
        
#         icon = "🔴" if urgency in ['high', 'critical'] else "🟡" if urgency == 'normal' else "🟢"
#         print(f"  {icon} {patient} - {urgency} - Arrivé à {arrival_time.strftime('%H:%M')}")
    
#     return patients

def create_patients_in_progress(doctors):
    """Crée les patients en consultation"""
    print(f"\n🏥 Création de {NUM_PATIENTS_IN_PROGRESS} patients en consultation...")
    
    active_doctors = [d for d in doctors if d.is_active]
    patients = []
    
    for i in range(min(NUM_PATIENTS_IN_PROGRESS, len(active_doctors))):
        doctor = active_doctors[i]
        
        # ✅ CORRIGÉ : dates simulées
        created_at = timezone.now() - timedelta(minutes=random.randint(45, 120))
        called_at = timezone.now() - timedelta(minutes=random.randint(10, 40))
        
        patient = Patient.objects.create(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            date_of_birth=fake.date_of_birth(minimum_age=5, maximum_age=85),
            phone=fake.phone_number(),
            email=fake.email(),
            priority=random.choice([2, 3]),  # Prioritaire ou Normal
            status='in_progress',
            estimated_wait_time=0,
            notes=f"Consultation en cours avec Dr. {doctor.last_name}",
            assigned_doctor=doctor
        )
        
        # Force les dates
        Patient.objects.filter(id=patient.id).update(
            created_at=created_at,
            called_at=called_at
        )
        patient.refresh_from_db()
        
        # Met à jour le médecin
        doctor.current_patient = patient
        doctor.save()
        
        # Historique
        QueueHistory.objects.create(
            patient=patient,
            doctor=None,
            action='created',
            details={'source': 'seed_data'}
        )
        QueueHistory.objects.create(
            patient=patient,
            doctor=doctor,
            action='called',
            details={'wait_time_before_call': (called_at - created_at).total_seconds() // 60}
        )
        
        patients.append(patient)
        wait_duration = int((called_at - created_at).total_seconds() / 60)
        print(f"  🔵 {patient.ticket_number} {patient.last_name} → Dr. {doctor.last_name} (attente: {wait_duration}min)")
    
    return patients
# def create_patients_in_progress(doctors):
#     """Crée les patients en consultation"""
#     print(f"\n🏥 Création de {NUM_PATIENTS_IN_PROGRESS} patients en consultation...")
    
#     active_doctors = [d for d in doctors if d.is_active]
#     patients = []
    
#     for i in range(min(NUM_PATIENTS_IN_PROGRESS, len(active_doctors))):
#         doctor = active_doctors[i]
        
#         patient = Patient.objects.create(
#             first_name=fake.first_name(),
#             last_name=fake.last_name(),
#             date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=85),
#             phone=fake.phone_number(),
#             email=fake.email(),
#             reason=fake.sentence(nb_words=6),
#             urgency_level=random.choice(['normal', 'high']),
#             status='in_progress',
#             arrival_time=datetime.now() - timedelta(minutes=random.randint(30, 90)),
#             consultation_start_time=datetime.now() - timedelta(minutes=random.randint(5, 45)),
#             assigned_doctor=doctor
#         )
        
#         # Met à jour le médecin
#         doctor.current_patient_id = patient.id
#         doctor.save()
        
#         patients.append(patient)
#         print(f"  🔵 {patient} → Dr. {doctor.last_name} (Salle {doctor.room_number})")
    
#     return patients


def create_patients_completed(doctors):
    """Crée les patients terminés aujourd'hui"""
    print(f"\n✅ Création de {NUM_PATIENTS_COMPLETED_TODAY} patients terminés aujourd'hui...")
    
    for i in range(NUM_PATIENTS_COMPLETED_TODAY):
        created_at = timezone.now() - timedelta(hours=random.randint(2, 10))
        called_at = created_at + timedelta(minutes=random.randint(10, 45))
        completed_at = called_at + timedelta(minutes=random.randint(15, 60))
        
        doctor = random.choice(doctors)
        
        patient = Patient.objects.create(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            date_of_birth=fake.date_of_birth(minimum_age=5, maximum_age=85),
            phone=fake.phone_number(),
            email=fake.email(),
            priority=random.choice([1, 2, 3, 4]),
            status='completed',
            estimated_wait_time=0,
            notes=fake.sentence(nb_words=6),
            assigned_doctor=doctor
        )
        
        # Force les dates
        Patient.objects.filter(id=patient.id).update(
            created_at=created_at,
            called_at=called_at,
            completed_at=completed_at
        )
        patient.refresh_from_db()
        
        # Historique complet
        QueueHistory.objects.create(
            patient=patient,
            doctor=None,
            action='created',
            timestamp=created_at,
            details={'source': 'seed_data'}
        )
        QueueHistory.objects.create(
            patient=patient,
            doctor=doctor,
            action='called',
            timestamp=called_at,
            details={'wait_time': (called_at - created_at).total_seconds() // 60}
        )
        QueueHistory.objects.create(
            patient=patient,
            doctor=doctor,
            action='completed',
            timestamp=completed_at,
            details={
                'consultation_duration': (completed_at - called_at).total_seconds() // 60,
                'total_time': (completed_at - created_at).total_seconds() // 60
            }
        )
        
        if i < 3:
            total_time = int((completed_at - created_at).total_seconds() / 60)
            print(f"  ✓ {patient.ticket_number} {patient.last_name} - Total: {total_time}min")
    
    if NUM_PATIENTS_COMPLETED_TODAY > 3:
        print(f"  ... et {NUM_PATIENTS_COMPLETED_TODAY - 3} autres")
# def create_patients_completed():
#     """Crée les patients terminés aujourd'hui"""
#     print(f"\n✅ Création de {NUM_PATIENTS_COMPLETED_TODAY} patients terminés aujourd'hui...")
    
#     for i in range(NUM_PATIENTS_COMPLETED_TODAY):
#         arrival = datetime.now() - timedelta(hours=random.randint(2, 10))
#         consultation_start = arrival + timedelta(minutes=random.randint(10, 30))
#         consultation_end = consultation_start + timedelta(minutes=random.randint(15, 45))
        
#         patient = Patient.objects.create(
#             first_name=fake.first_name(),
#             last_name=fake.last_name(),
#             date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=85),
#             phone=fake.phone_number(),
#             email=fake.email(),
#             reason=fake.sentence(nb_words=6),
#             urgency_level=random.choice(URGENCY_LEVELS),
#             status='completed',
#             arrival_time=arrival,
#             consultation_start_time=consultation_start,
#             consultation_end_time=consultation_end,
#             assigned_doctor=random.choice(Doctor.objects.all())
#         )
        
#         wait_time = (consultation_start - arrival).total_seconds() / 60
#         print(f"  ✓ {patient} - Attente: {int(wait_time)}min")


def create_stats():
    """Affiche les statistiques"""
    print(f"\n📊 Statistiques:")
    
    today = timezone.now().date()
    
    stats = {
        'total_doctors': Doctor.objects.count(),
        'active_doctors': Doctor.objects.filter(is_active=True).count(),
        'waiting': Patient.objects.filter(status='waiting').count(),
        'in_progress': Patient.objects.filter(status='in_progress').count(),
        'completed_today': Patient.objects.filter(
            status='completed',
            completed_at__date=today
        ).count(),
        'urgent_waiting': Patient.objects.filter(
            status='waiting',
            priority=1  # Urgence = priorité 1
        ).count(),
    }
    
    print(f"  👨‍⚕️ Médecins: {stats['active_doctors']}/{stats['total_doctors']} actifs")
    print(f"  ⏳ En attente: {stats['waiting']} (dont {stats['urgent_waiting']} urgences)")
    print(f"  🏥 En consultation: {stats['in_progress']}")
    print(f"  ✅ Terminés aujourd'hui: {stats['completed_today']}")
    
    return stats

# def create_stats():
#     """Crée les statistiques du jour"""
#     print(f"\n📊 Création des statistiques...")
    
#     stats, created = QueueHistory.objects.get_or_create(
#         date=datetime.now().date(),
#         defaults={
#             "total_waiting": NUM_PATIENTS_WAITING,
#             "total_in_progress": NUM_PATIENTS_IN_PROGRESS,
#             "total_completed_today": NUM_PATIENTS_COMPLETED_TODAY,
#             "urgent_count": Patient.objects.filter(
#                 status='waiting', 
#                 urgency_level__in=['high', 'critical']
#             ).count(),
#             "average_wait_time": random.randint(25, 45)
#         }
#     )
    
#     print(f"  {'Créées' if created else 'Mises à jour'}: {stats}")


def clear_existing_data():
    """Nettoie les données existantes"""
    print("🧹 Nettoyage des données existantes...")
    Patient.objects.all().delete()
    Doctor.objects.all().delete()
    QueueHistory.objects.all().delete()
    print("  ✓ Données supprimées")


def main():
    """Fonction principale"""
    print("=" * 60)
    print("🚀 GÉNÉRATION DE DONNÉES DE TEST")
    print("=" * 60)
    
    # Décommente pour nettoyer avant
    # clear_existing_data()
    
    # Création des données
    doctors = create_doctors()
    waiting = create_patients_waiting(doctors)
    in_progress = create_patients_in_progress(doctors)
    create_patients_completed(doctors)
    # create_patients_completed(doctors)
    create_stats()
    
    # Résumé
    print("\n" + "=" * 60)
    print("📋 RÉSUMÉ")
    print("=" * 60)
    print(f"  👨‍⚕️ Médecins: {Doctor.objects.count()} (dont {Doctor.objects.filter(is_active=True).count()} actifs)")
    print(f"  ⏳ En attente: {Patient.objects.filter(status='waiting').count()}")
    print(f"  🏥 En consultation: {Patient.objects.filter(status='in_progress').count()}")
    print(f"  ✅ Terminés aujourd'hui: {Patient.objects.filter(status='completed').count()}")
    # print(f"  🔴 Urgences: {Patient.objects.filter(urgency_level__in=['high', 'critical'], status='waiting').count()}")
    print(f"  🔴 Urgences: {Patient.objects.filter(priority=1, status='waiting').count()}")
    print("=" * 60)
    print("✨ Données générées avec succès!")
    
    # Export pour le frontend si besoin
    export_json()


def export_json():
    """Exporte les données au format JSON pour référence"""
    import json
    
    data = {
        "doctors": list(Doctor.objects.values()),
        "waiting_patients": list(Patient.objects.filter(status='waiting').values()),
        "stats": list(QueueHistory.objects.values())
    }
    
    with open('seed_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str)
    
    print("\n💾 Export JSON: seed_data.json créé")


if __name__ == '__main__':
    main()