# utilisateur/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UtilisateurSerializer, 
    UserRegistrationSerializer,
    DoctorRegistrationSerializer,
    PatientRegistrationSerializer
)
from .models import Utilisateur


User = Utilisateur


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        role = request.data.get('role', 'patient')
        
        # Choisit le bon sérialiseur selon le rôle
        if role == 'doctor':
            serializer = DoctorRegistrationSerializer(data=request.data)
        elif role == 'patient':
            serializer = PatientRegistrationSerializer(data=request.data)
        else:
            # Admin ou autre - nécessite authentification
            if not request.user.is_authenticated or not request.user.is_admin:
                return Response(
                    {"detail": "Non autorisé"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = UserRegistrationSerializer(
                data=request.data, 
                context={'request': request}
            )
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "detail": "Utilisateur créé avec succès",
                "user": UtilisateurSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Filtre selon les permissions
        if request.user.is_admin:
            users = User.objects.all()
        elif request.user.is_doctor:
            users = User.objects.filter(role__in=['patient', 'doctor'])
        else:
            users = User.objects.filter(id=request.user.id)
        
        serializer = UtilisateurSerializer(users, many=True)
        return Response(serializer.data)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "Utilisateur non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifie les permissions
        if not request.user.is_admin and request.user.id != user.id:
            if not (request.user.is_doctor and user.role == 'patient'):
                return Response(
                    {"detail": "Non autorisé"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = UtilisateurSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request, pk):
        if not request.user.is_admin and request.user.id != int(pk):
            return Response(
                {"detail": "Non autorisé"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "Utilisateur non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Empêche de changer son propre rôle si ce n'est pas un admin
        if 'role' in request.data and not request.user.is_admin:
            return Response(
                {"detail": "Seul un admin peut changer le rôle"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UtilisateurSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token requis"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {"detail": "Déconnecté avec succès"}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            # Token déjà blacklisté ou invalide
            return Response(
                {"detail": "Token invalide ou déjà révoqué"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
