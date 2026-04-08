import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ChallengeBossScreen from '../ChallengeBossScreen';
import { GameProvider } from '../../context/GameContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));



const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;

describe('ChallengeBossScreen', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('renders initial state correctly', () => {
        const { getByText } = render(<ChallengeBossScreen />, { wrapper });

        expect(getByText(/Bosses Defeated:/i)).toBeTruthy();
        expect(getByText('CHALLENGE BOSS')).toBeTruthy();
    });

    it('handles countdown state properly when challenging a boss', () => {
        const { getByText, queryByText, getAllByText } = render(<ChallengeBossScreen />, { wrapper });

        fireEvent.press(getByText('CHALLENGE BOSS'));

        // Timer should show
        expect(getAllByText(/FIGHTING.../i).length).toBeGreaterThan(0);
        expect(queryByText('CHALLENGE BOSS')).toBeNull();

        // Let timer run
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        // Result displays based on Context. Without gear, should be DEFEAT
        expect(getByText(/DEFEAT!/i)).toBeTruthy();
        expect(getByText('CHALLENGE BOSS')).toBeTruthy();
    });
});
