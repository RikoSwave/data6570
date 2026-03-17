from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Character

class AuthTests(APITestCase):
    
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        
        self.user_data1 = {
            'username': 'player1',
            'password': 'testpassword123'
        }
        
        self.user_data2 = {
            'username': 'player2',
            'password': 'testpassword456'
        }

    def test_registration(self):
        """Test user can register a new account."""
        response = self.client.post(self.register_url, self.user_data1, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='player1').exists())

    def test_login(self):
        """Test user can log in and receive a token."""
        # Setup: Create user first
        User.objects.create_user(**self.user_data1)
        
        response = self.client.post(self.login_url, self.user_data1, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        
    def test_logout_invalidates_token(self):
        """Test that logout deletes the auth token."""
        # Setup
        user = User.objects.create_user(**self.user_data1)
        response = self.client.post(self.login_url, self.user_data1, format='json')
        token = response.data['token']
        
        # Authenticate
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        
        # Hit logout endpoint
        logout_response = self.client.post(self.logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        
        # Token should be deleted from DB
        self.assertFalse(Token.objects.filter(user=user).exists())
        
        # Hitting a protected endpoint should now fail
        character_response = self.client.get(reverse('character_state'))
        self.assertEqual(character_response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_multiple_concurrent_logins(self):
        """Test that multiple accounts can be created and hold tokens simultaneously."""
        # Create user 1 and get token
        User.objects.create_user(**self.user_data1)
        r1 = self.client.post(self.login_url, self.user_data1, format='json')
        token1 = r1.data['token']
        
        # Create user 2 and get token
        User.objects.create_user(**self.user_data2)
        r2 = self.client.post(self.login_url, self.user_data2, format='json')
        token2 = r2.data['token']
        
        self.assertNotEqual(token1, token2)
        self.assertEqual(Token.objects.count(), 2)
