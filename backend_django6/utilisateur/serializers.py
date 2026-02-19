# utilisateur/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Utilisateur

User = Utilisateur

class UtilisateurSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
     
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'role',
            'role_display',
            'specialty',
            'phone',
            'date_of_birth',
            'is_active_account',
            'created_at',
            'updated_at'
        ]
        read_only_fields = fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'role',
            'phone',
            'date_of_birth'
        ]
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        
        # Seul admin peut créer un compte admin
        request = self.context.get('request')
        if data.get('role') == 'admin':
            if not request or not request.user.is_admin:
                raise serializers.ValidationError("Seul un administrateur peut créer un compte admin")
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.get('role', 'patient')
        
        # Définit les permissions selon le rôle
        user = User.objects.create_user(**validated_data)
        
        # Assigne au groupe correspondant
        self._assign_group(user, role)
        
        return user
    
    def _assign_group(self, user, role):
        group, _ = Group.objects.get_or_create(name=role)
        user.groups.add(group)
        
        # Permissions spécifiques
        if role == 'admin':
            user.is_staff = True
            user.save()
        elif role == 'doctor':
            user.is_staff = True
            user.save()


class DoctorRegistrationSerializer(serializers.ModelSerializer):
    """Sérialiseur spécifique pour l'enregistrement des médecins"""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'specialty',
            'phone'
        ]
    
    def create(self, validated_data):
        validated_data['role'] = 'doctor'
        user = User.objects.create_user(**validated_data)
        user.is_staff = True
        user.save()
        return user


class PatientRegistrationSerializer(serializers.ModelSerializer):
    """Sérialiseur spécifique pour l'enregistrement des patients"""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'date_of_birth'
        ]
    
    def create(self, validated_data):
        validated_data['role'] = 'patient'
        user = User.objects.create_user(**validated_data)
        return user

# # users/serializers.py
# from django.contrib.auth import get_user_model
# from rest_framework import serializers

# User = get_user_model()

# class UtilisateurSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
#         read_only_fields = fields