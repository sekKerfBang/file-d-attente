from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet, PatientViewSet, QueueStatsViewSet, health_check

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'stats', QueueStatsViewSet, basename='stats')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health'),
]