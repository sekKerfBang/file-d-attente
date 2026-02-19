from django.urls import path
from .views import UserMeView, RegisterView, UserListView, UserDetailView

urlpatterns = [
    path('me/', UserMeView.as_view(), name='user_me'),
    path('register/', RegisterView.as_view(), name='user_register'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]


# from django.urls import path
# from .views import UserMeView

# urlpatterns = [
#     path('', UserMeView.as_view(), name='user_me'),
# ]