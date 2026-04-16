import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rpg_backend.settings')
django.setup()

from api.models import MonsterDropTable

MonsterDropTable.objects.all().delete()

drops = [
    # Combat dummy as used in Train Combat
    {"monster_name": "Combat Dummy", "item_name": "Wood Splinter", "quantity": 1, "weight": 10},
    {"monster_name": "Combat Dummy", "item_name": "nothing", "quantity": 0, "weight": 90},
    
    # Boss as used in Boss Fight
    {"monster_name": "Boss", "item_name": "Boss Soul", "quantity": 1, "weight": 20},
    {"monster_name": "Boss", "item_name": "Large Coin Pouch", "quantity": 1, "weight": 40},
    {"monster_name": "Boss", "item_name": "Small Coin Pouch", "quantity": 2, "weight": 20},
    {"monster_name": "Boss", "item_name": "nothing", "quantity": 0, "weight": 10},
    {"monster_name": "Boss", "item_name": "boss_unique", "quantity": 1, "weight": 10},

    # Dungeon boss uniques
    {"monster_name": "Dragon Boss", "item_name": "Dragon Heart", "quantity": 1, "weight": 100},
    {"monster_name": "Queen of Thieves", "item_name": "Ancient Relic", "quantity": 1, "weight": 100},
    {"monster_name": "King's lockbox", "item_name": "King's Seal", "quantity": 1, "weight": 100},
    {"monster_name": "Goblin King", "item_name": "Goblin Crown", "quantity": 1, "weight": 100},
    
    # Creatures
    {"monster_name": "Chicken", "item_name": "Feather", "quantity": 5, "weight": 50},
    {"monster_name": "Chicken", "item_name": "Raw Chicken", "quantity": 1, "weight": 50},
    
    {"monster_name": "Cow", "item_name": "Cowhide", "quantity": 1, "weight": 50},
    {"monster_name": "Cow", "item_name": "Raw Beef", "quantity": 1, "weight": 50},
    
    {"monster_name": "Small Goblin", "item_name": "Goblin Mail", "quantity": 1, "weight": 10},
    {"monster_name": "Small Goblin", "item_name": "Small Coin Pouch", "quantity": 1, "weight": 45},
    {"monster_name": "Small Goblin", "item_name": "Bones", "quantity": 1, "weight": 45},

]

for d in drops:
    MonsterDropTable.objects.create(**d)

print("Drop tables populated successfully.")
