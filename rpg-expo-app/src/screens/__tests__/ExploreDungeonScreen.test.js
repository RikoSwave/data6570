import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ExploreDungeonScreen from '../ExploreDungeonScreen';
import { GameProvider } from '../../context/GameContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));



const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;

describe('ExploreDungeonScreen', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('renders initial state correctly and shows idle status', () => {
        const { getByText, queryByText } = render(<ExploreDungeonScreen />, { wrapper });

        expect(getByText('DUNGEON')).toBeTruthy();
        expect(getByText('SELECT DUNGEON:')).toBeTruthy();
        expect(getByText('Find equipment and weapons to boost your stats.')).toBeTruthy();
        expect(queryByText(/Ready to explore/i)).toBeTruthy();
        expect(getByText('EXPLORE (15s)')).toBeTruthy();
    });

    it('can select a different dungeon type', () => {
        const { getByText, queryByText } = render(<ExploreDungeonScreen />, { wrapper });

        fireEvent.press(getByText('Basic (10g)'));
        expect(getByText('Cost: 10 Coins')).toBeTruthy();
    });

    it('prevents exploration if not enough coins', () => {
        // Mock the console or alert to catch it (Optional)
        const { getByText } = render(<ExploreDungeonScreen />, { wrapper });

        fireEvent.press(getByText('Basic (10g)'));
        fireEvent.press(getByText('EXPLORE (30s)')); // 30s default for basic

        // Assert we are STILL idle since context doesn't have 10 coins by default
        expect(getByText(/Ready to explore/i)).toBeTruthy();
    });

    it('explores gear dungeon for free successfully', () => {
        const { getByText, queryByText } = render(<ExploreDungeonScreen />, { wrapper });

        fireEvent.press(getByText('Gear (Free)'));
        fireEvent.press(getByText('EXPLORE (15s)'));

        // Timer should show
        expect(getByText('EXPLORING Gear Dungeon...')).toBeTruthy();
        expect(queryByText('EXPLORE (15s)')).toBeNull();

        // Let timer run
        act(() => {
            jest.advanceTimersByTime(15000); // 15s
        });

        // After completion, we should see Found message in log
        expect(getByText(/Found:/i)).toBeTruthy();
    });
});
