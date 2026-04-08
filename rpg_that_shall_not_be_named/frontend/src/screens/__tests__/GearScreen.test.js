import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GearScreen from '../GearScreen';
import { GameProvider } from '../../context/GameContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));



const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;

describe('GearScreen', () => {
    it('renders the gear screen without crashing', () => {
        const { getByText } = render(<GearScreen />, { wrapper });

        expect(getByText('PLAYER STATS')).toBeTruthy();
        expect(getByText('EQUIPPED GEAR')).toBeTruthy();
        expect(getByText('INVENTORY (0)')).toBeTruthy();
    });

    it('displays empty slots for all gear types', () => {
        const { getByText, getAllByText } = render(<GearScreen />, { wrapper });

        expect(getByText('Weapon')).toBeTruthy();
        expect(getByText('Armor')).toBeTruthy();
        expect(getByText('Helmet')).toBeTruthy();
        expect(getAllByText('Empty').length).toBe(9);
    });
});
