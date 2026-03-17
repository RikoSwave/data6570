import os
import django

# Set up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rpg_backend.settings')
django.setup()

from api.models import MonsterDropTable

MonsterDropTable.objects.all().delete()

drops = [
    # Combat dummy as used in Train Combat
    {"monster_name": "Combat Dummy", "item_name": "Wood Splinter", "quantity": 1, "weight": 50},
    {"monster_name": "Combat Dummy", "item_name": "nothing", "quantity": 0, "weight": 50},
    
    # Boss as used in Boss Fight
    {"monster_name": "Boss", "item_name": "Boss Soul", "quantity": 1, "weight": 10},
    {"monster_name": "Boss", "item_name": "Large Coin Pouch", "quantity": 1, "weight": 50},
    {"monster_name": "Boss", "item_name": "nothing", "quantity": 0, "weight": 40},
    
    # Requested specific examples
    {"monster_name": "Goblin", "item_name": "Small Coins", "quantity": 15, "weight": 40},
    {"monster_name": "Goblin", "item_name": "nothing", "quantity": 0, "weight": 60},
    {"monster_name": "Chicken", "item_name": "Raw Chicken", "quantity": 1, "weight": 30},
    {"monster_name": "Chicken", "item_name": "Feather", "quantity": 5, "weight": 40},
    {"monster_name": "Chicken", "item_name": "nothing", "quantity": 0, "weight": 30},
]

for d in drops:
    MonsterDropTable.objects.create(**d)

print("Drop tables populated successfully.")
