from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Character, MonsterDropTable
from .serializers import UserSerializer, CharacterSerializer
import random

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def character_state(request):
    character = getattr(request.user, 'character', None)
    
    if request.method == 'GET':
        if not character:
            return Response({"error": "Character not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CharacterSerializer(character)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        if not character:
            if Character.objects.filter(name=request.data.get('name')).exists():
                return Response({"error": "Character name already taken."}, status=status.HTTP_400_BAD_REQUEST)
            serializer = CharacterSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Update existing character
            serializer = CharacterSerializer(character, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monster_drop(request):
    monster_name = request.query_params.get('monster')
    if not monster_name:
        return Response({"error": "Monster name required."}, status=status.HTTP_400_BAD_REQUEST)
    
    drops = MonsterDropTable.objects.filter(monster_name=monster_name)
    if not drops.exists():
        return Response({"drop": None})
    
    population = []
    weights = []
    for d in drops:
        population.append(d)
        weights.append(d.weight)
        
    choice = random.choices(population, weights=weights, k=1)[0]
    
    if choice.item_name.lower() == "nothing":
        return Response({"drop": None})
    
    return Response({
        "drop": {
            "name": choice.item_name,
            "quantity": choice.quantity,
            "type": "Resource"
        }
    })
