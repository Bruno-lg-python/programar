from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def login(request):
   return render(request, 'html/login.html')


def contato(request):
   return render(request, 'html/contato.html')