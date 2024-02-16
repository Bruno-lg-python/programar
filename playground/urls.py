from django.urls import path, include
from . import views
urlpatterns = [
    path('login/', views.login, name='login'),
    path('contato/', views.contato, name='contato'),
    #path('', include('allauth.urls')),
]
