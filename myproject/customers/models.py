from django.db import models

# Create your models here.

class Customer(models.Model): 
    first_name = models.CharField(max_length=50) 
    last_name = models.CharField(max_length=50) 
    email = models.EmailField(unique=True) 
    phone_number = models.CharField(max_length=15, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True) 
    def __str__(self): 
        return f"{self.first_name} {self.last_name}"