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

class CharacterTests(APITestCase):

    def setUp(self):
        self.character_url = reverse('character_state')
        self.user_data = {'username': 'testuser', 'password': 'testpassword'}
        self.user = User.objects.create_user(**self.user_data)
        self.client.force_authenticate(user=self.user)

    def test_create_character(self):
        """Test REQ-1.4: user can create a named character linked to account."""
        response = self.client.post(self.character_url, {'name': 'Hero'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Character.objects.filter(name='Hero').exists())
        self.assertEqual(Character.objects.get(name='Hero').user, self.user)

    def test_create_character_unique_name(self):
        """Test character names must be unique."""
        User.objects.create_user(username='other', password='pw')
        Character.objects.create(user=User.objects.get(username='other'), name='Hero')
        
        response = self.client.post(self.character_url, {'name': 'Hero'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_character_state(self):
        """Test REQ-1.5, 7.2: save character full state."""
        char = Character.objects.create(user=self.user, name='Hero', xp=10, coins=5)
        
        updated_data = {
            'xp': 100,
            'coins': 50,
            'inventory': [{'id': '1', 'name': 'Sword', 'type': 'Weapon'}]
        }
        response = self.client.post(self.character_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        char.refresh_from_db()
        self.assertEqual(char.xp, 100)
        self.assertEqual(char.coins, 50)
        self.assertEqual(char.inventory[0]['name'], 'Sword')

    def test_restore_character_state(self):
        """Test REQ-1.6: restore character state on demand."""
        Character.objects.create(user=self.user, name='Hero', xp=250, currentStamina=5)
        
        response = self.client.get(self.character_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Hero')
        self.assertEqual(response.data['xp'], 250)
        self.assertEqual(response.data['currentStamina'], 5)


class MonsterDropTests(APITestCase):

    def setUp(self):
        from .models import MonsterDropTable
        self.monster_url = reverse('monster_drop')
        self.user = User.objects.create_user(username='test', password='pw')
        self.client.force_authenticate(user=self.user)
        
        # Setup drops for a monster
        MonsterDropTable.objects.create(monster_name='Goblin', item_name='Bones', quantity=1, weight=50)
        MonsterDropTable.objects.create(monster_name='Goblin', item_name='Gold Coin', quantity=10, weight=50)
        MonsterDropTable.objects.create(monster_name='Slime', item_name='Nothing', quantity=1, weight=100)

    def test_monster_drop_not_found(self):
        response = self.client.get(self.monster_url + '?monster=Dragon')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data.get('drop'))

    def test_monster_drop_nothing(self):
        response = self.client.get(self.monster_url + '?monster=Slime')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data.get('drop'))

    def test_monster_drop_success(self):
        """Test REQ-7.3, REQ-7.4: backend calculation of drops."""
        # Due to randomness, we test that it returns one of the valid drops
        response = self.client.get(self.monster_url + '?monster=Goblin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        drop = response.data.get('drop')
        self.assertIsNotNone(drop)
        self.assertIn(drop['name'], ['Bones', 'Gold Coin'])
        self.assertEqual(drop['type'], 'Resource')
