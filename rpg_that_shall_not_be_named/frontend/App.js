
import React from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GameProvider } from './src/context/GameContext';
import { Ionicons } from '@expo/vector-icons';

// Screens
import TrainCombatScreen from './src/screens/TrainCombatScreen';
import ChallengeBossScreen from './src/screens/ChallengeBossScreen';
import ExploreDungeonScreen from './src/screens/ExploreDungeonScreen';
import GearScreen from './src/screens/GearScreen';
import TownScreen from './src/screens/TownScreen';
import LoginScreen from './src/screens/LoginScreen';
import CharacterCreationScreen from './src/screens/CharacterCreationScreen';
import { useGame } from './src/context/GameContext';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const { authToken, characterName, logout } = useGame();

  const handleProfileClick = () => {
    const msg = `Logged in as: ${characterName}`;
    if (Platform.OS === 'web') {
      if (window.confirm(`${msg}\n\nDo you want to log out?`)) {
        logout();
      }
    } else {
      Alert.alert(
        "Character Profile",
        msg,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Out", onPress: () => logout(), style: 'destructive' }
        ]
      );
    }
  };

  if (!authToken) {
    return <LoginScreen />;
  }

  if (!characterName) {
    return <CharacterCreationScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1a1a1a',
              borderBottomColor: '#333',
              borderBottomWidth: 1,
            },
            headerTintColor: '#FFD700',
            headerRight: () => (
              <TouchableOpacity onPress={handleProfileClick} style={{ marginRight: 15 }}>
                <Ionicons name="person-circle-outline" size={30} color="#FFD700" />
              </TouchableOpacity>
            ),
            tabBarStyle: {
              backgroundColor: '#000',
              borderTopColor: '#333',
            },
            tabBarActiveTintColor: '#FFD700',
            tabBarInactiveTintColor: '#666',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Combat') {
                iconName = focused ? 'fitness' : 'fitness-outline';
              } else if (route.name === 'Boss') {
                iconName = focused ? 'skull' : 'skull-outline';
              } else if (route.name === 'Dungeon') {
                iconName = focused ? 'compass' : 'compass-outline';
              } else if (route.name === 'Gear') {
                iconName = focused ? 'shirt' : 'shirt-outline';
              } else if (route.name === 'Town') {
                iconName = focused ? 'business' : 'business-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Town" component={TownScreen} />
          <Tab.Screen name="Combat" component={TrainCombatScreen} />
          <Tab.Screen name="Boss" component={ChallengeBossScreen} />
          <Tab.Screen name="Dungeon" component={ExploreDungeonScreen} />
          <Tab.Screen name="Gear" component={GearScreen} />
        </Tab.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GameProvider>
      <MainNavigator />
    </GameProvider>
  );
};

export default App;
