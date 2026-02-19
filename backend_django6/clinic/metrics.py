from prometheus_client import Counter, Histogram, Gauge, Info
from django_prometheus.exports import ExportToDjangoView

# Métriques métier
patients_waiting = Gauge(
    'clinic_patients_waiting_total',
    'Nombre de patients en attente',
    ['priority']
)

patients_in_progress = Gauge(
    'clinic_patients_in_progress_total',
    'Nombre de patients en consultation'
)

wait_time_average = Gauge(
    'clinic_wait_time_average_minutes',
    'Temps d\'attente moyen en minutes'
)

websocket_connections = Gauge(
    'clinic_websocket_connections_active',
    'Nombre de connexions WebSocket actives'
)

patients_processed_total = Counter(
    'clinic_patients_processed_total',
    'Total de patients traités',
    ['doctor_id', 'specialty']
)

consultation_duration = Histogram(
    'clinic_consultation_duration_minutes',
    'Durée des consultations en minutes',
    buckets=[5, 10, 15, 20, 30, 45, 60, 90, 120]
)

system_info = Info(
    'clinic_system',
    'Informations système ClinicQueue'
)

# Initialisation
system_info.info({'version': '1.0.0', 'environment': 'production'})