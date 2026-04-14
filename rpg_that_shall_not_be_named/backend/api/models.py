from django.db import models
from django.contrib.auth.models import User

class Character(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="character")
    name = models.CharField(max_length=50, unique=True)
    
    # Numeric stats
    xp = models.IntegerField(default=0)
    bossesDefeated = models.IntegerField(default=0)
    coins = models.IntegerField(default=0)
    currentStamina = models.IntegerField(default=15)
    townLevel = models.IntegerField(default=1)
    townXP = models.IntegerField(default=0)
    
    # Complex stats stored as JSON
    inventory = models.JSONField(default=list)
    equipped = models.JSONField(default=dict)
    activePotions = models.JSONField(default=list)
    unlockedCreatures = models.JSONField(default=list)
    activeQuest = models.JSONField(null=True, blank=True)
    shopStock = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.name} (User: {self.user.username})"


class MonsterDropTable(models.Model):
    monster_name = models.CharField(max_length=50)
    item_name = models.CharField(max_length=50)
    quantity = models.IntegerField(default=1)
    weight = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.monster_name} drops {self.quantity}x {self.item_name} (Weight: {self.weight})"
