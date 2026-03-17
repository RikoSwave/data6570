from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from . import views

urlpatterns = [
    path('auth/register/', views.register, name='register'),
    path('auth/login/', obtain_auth_token, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('character/state/', views.character_state, name='character_state'),
    path('combat/drop/', views.monster_drop, name='monster_drop'),
]
