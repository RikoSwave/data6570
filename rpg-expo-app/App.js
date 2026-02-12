
import React from 'react';
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

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <GameProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
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
    </GameProvider>
  );
};

export default App;
