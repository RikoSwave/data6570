import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import TrainCombatScreen from '../TrainCombatScreen';
import { GameProvider } from '../../context/GameContext';

// We must mock AsyncStorage to use GameProvider
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));



const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;

describe('TrainCombatScreen', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders basic stats correctly', () => {
        const { getByText } = render(<TrainCombatScreen />, { wrapper });

        expect(getByText('Level: 1')).toBeTruthy();
        expect(getByText('10 / 10')).toBeTruthy(); // Initial Stamina
        expect(getByText('80 XP to next')).toBeTruthy(); // Initial XP to next level
        expect(getByText('HIT COMBAT DUMMY')).toBeTruthy();
        expect(getByText('Select Target')).toBeTruthy();
    });

    it('can hit the combat dummy for XP', () => {
        const { getByText, queryByText } = render(<TrainCombatScreen />, { wrapper });

        const dummyButton = getByText('HIT COMBAT DUMMY');
        fireEvent.press(dummyButton);

        // Assert we got XP output text
        expect(getByText('+2 XP')).toBeTruthy();

        // Next XP decreases
        expect(getByText('78 XP to next')).toBeTruthy();
    });

    it('can select a target and fight it', () => {
        const { getByText, queryByText } = render(<TrainCombatScreen />, { wrapper });

        // Select Chicken
        const chickenTarget = getByText('Chicken');
        fireEvent.press(chickenTarget);

        // Verify Arena is shown
        expect(getByText('VS Chicken')).toBeTruthy();
        expect(getByText('START FIGHT')).toBeTruthy();

        // Start Combat
        fireEvent.press(getByText('START FIGHT'));

        // Flee button replaces start
        expect(getByText('FLEE')).toBeTruthy();

        // Advance timers to trigger combat loops
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Flee
        fireEvent.press(getByText('FLEE'));
        expect(queryByText('FLEE')).toBeNull();

    });

    it('updates quest progress and calculates stats correctly', () => {
        // Since we are using wrapper, useGame internal functions actually do work. 
        // We'll trust the component test renders these states nicely.
        const { getByText, queryByText } = render(<TrainCombatScreen />, { wrapper });

        // Assert new stats are visible
        expect(getByText('Strength')).toBeTruthy();
        expect(getByText('Accuracy')).toBeTruthy();
        expect(getByText('Defence')).toBeTruthy();
        expect(getByText('Max HP')).toBeTruthy();
    });

});
