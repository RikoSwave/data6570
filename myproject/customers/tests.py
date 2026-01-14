from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Customer

class CustomerAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@example.com',
            'phone_number': '1234567890'
        }
        self.customer = Customer.objects.create(**self.customer_data)

    def test_get_customers(self):
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_customer(self):
        new_customer_data = {
            'first_name': 'Jane',
            'last_name': 'Doe',
            'email': 'jane.doe@example.com',
            'phone_number': '0987654321'
        }
        response = self.client.post('/api/customers/', new_customer_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 2)

    def test_update_customer(self):
        updated_data = {
            'first_name': 'Johnny',
            'last_name': 'Doe',
            'email': 'john.doe@example.com',
            'phone_number': '1234567890'
        }
        response = self.client.put(f'/api/customers/{self.customer.id}/', updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.first_name, 'Johnny')

    def test_delete_customer(self):
        response = self.client.delete(f'/api/customers/{self.customer.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Customer.objects.count(), 0)
