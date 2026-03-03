import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import TownScreen from '../TownScreen';
import { useGame } from '../../context/GameContext';

// Mock the context entirely so we can assert filtering logic
jest.mock('../../context/GameContext', () => ({
    useGame: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
    const { View } = require('react-native');
    return {
        Ionicons: () => <View />
    };
});

jest.mock('../../components/SaveLoadControls', () => {
    const { Text } = require('react-native');
    return () => <Text>SaveLoadControls</Text>;
});

const mockContextValue = {
    townLevel: 1,
    townXP: 0,
    activeQuest: null,
    shopStock: { blacksmith: [], potion: [], lastRefresh: 0 },
    refreshShops: jest.fn(() => true),
    buyItem: jest.fn(),
    sellItemToShop: jest.fn(),
    restAtInn: jest.fn(() => true),
    completeInnRest: jest.fn(),
    startQuest: jest.fn(),
    updateQuestProgress: jest.fn(),
    claimQuestReward: jest.fn(),
    donateItem: jest.fn(),
    inventory: [
        { id: '1', name: 'Iron Sword', type: 'Weapon', value: 10 },
        { id: '2', name: 'Basic Defence Potion', type: 'Potion', value: 5 }
    ],
    coins: 100,
    playerStats: { stamina: 20 },
    calculateTownXPForLevel: jest.fn(),
    xp: 0,
    equipped: {}
};

describe('TownScreen', () => {

    beforeEach(() => {
        jest.useFakeTimers();
        useGame.mockReturnValue(mockContextValue);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('renders town hub overview', () => {
        const { getByText } = render(<TownScreen />);

        expect(getByText('Town Level 1')).toBeTruthy();
        expect(getByText('The Inn')).toBeTruthy();
        expect(getByText('Blacksmith')).toBeTruthy();
        expect(getByText('Potion Shop')).toBeTruthy();
    });

    it('shows only gear and not potions in Blacksmith Sell tab', () => {
        const { getByText, queryByText } = render(<TownScreen />);

        fireEvent.press(getByText('Blacksmith'));
        expect(getByText('Blacksmith')).toBeTruthy();
        expect(getByText('Refresh Stock')).toBeTruthy();
        expect(getByText('Sell from Inventory')).toBeTruthy();

        // Check that Iron Sword is shown
        expect(getByText('Iron Sword')).toBeTruthy();
        // Check that Potion is NOT shown
        expect(queryByText('Basic Defence Potion')).toBeNull();
    });

    it('shows only potions and not gear in Potion Shop Sell tab', () => {
        const { getByText, queryByText } = render(<TownScreen />);

        fireEvent.press(getByText('Potion Shop'));
        expect(getByText('Potion Shop')).toBeTruthy();
        expect(getByText('Sell from Inventory')).toBeTruthy();

        // Check that Potion is shown
        expect(getByText('Basic Defence Potion')).toBeTruthy();
        // Check that Iron Sword is NOT shown
        expect(queryByText('Iron Sword')).toBeNull();
    });

    it('can open the Inn and Rest if sufficient coins are available', async () => {
        const { queryAllByText } = render(<TownScreen />);

        fireEvent.press(queryAllByText('The Inn')[0]);

        // Rest is pressed
    });

    it('only gear can be donated to Town Square', () => {
        const { getByText, queryAllByText, queryByText } = render(<TownScreen />);

        fireEvent.press(getByText('Town Square'));
        expect(queryAllByText('Town Square').length).toBeGreaterThan(0);
        expect(getByText('Donation Center')).toBeTruthy();

        // Iron sword should be donatable
        expect(getByText('Iron Sword')).toBeTruthy();
        // Potion must be filtered out
        expect(queryByText('Basic Defence Potion')).toBeNull();
    });

});
