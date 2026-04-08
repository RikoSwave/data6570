import {
    calculateXPForLevel,
    getLevelFromXP,
    calculateCombatStats,
    challengeBoss,
    generateRandomGear,
    generatePotion,
    calculateTownXPForLevel,
    generateQuest,
    generateShopItems
} from '../gameLogic';

describe('gameLogic utilities', () => {

    describe('XP and Level Calculation', () => {
        it('calculateXPForLevel correctly calculates levels 1-10', () => {
            expect(calculateXPForLevel(1)).toBe(0);
            expect(calculateXPForLevel(2)).toBe(80);
            // 3rd level should be 80 + (80 * 1.3) = 184
            expect(calculateXPForLevel(3)).toBe(184);
            expect(calculateXPForLevel(10)).toBeGreaterThan(calculateXPForLevel(9));
        });

        it('calculateXPForLevel correctly extrapolates past level 10', () => {
            const xp10 = calculateXPForLevel(10);
            const xp17 = calculateXPForLevel(17);
            expect(xp17).toBe(xp10 * 2);
        });

        it('getLevelFromXP correctly maps XP back to level', () => {
            expect(getLevelFromXP(0)).toBe(1);
            expect(getLevelFromXP(79)).toBe(1);
            expect(getLevelFromXP(80)).toBe(2);
            expect(getLevelFromXP(184)).toBe(3);
            expect(getLevelFromXP(100000)).toBeGreaterThan(10);
        });
    });

    describe('Combat Stats', () => {
        it('calculates combat stats correctly based on level and missing gear', () => {
            const stats = calculateCombatStats(1, {});
            expect(stats.accuracy).toBe(2);
            expect(stats.maxHit).toBe(1);
            expect(stats.defence).toBe(2);
            expect(stats.stamina).toBe(10);
        });

        it('adds gear stats properly', () => {
            const gear = {
                accuracy: 10,
                maxHit: 5,
                defence: 20,
                stamina: 50
            };
            const stats = calculateCombatStats(10, gear);
            expect(stats.accuracy).toBe(30); // 10*2 + 10
            expect(stats.maxHit).toBe(11); // Math.floor(10/2) + 1 + 5 = 6 + 5
            expect(stats.defence).toBe(40); // 10*2 + 20
            expect(stats.stamina).toBe(150); // 10*10 + 50
        });
    });

    describe('generateRandomGear', () => {
        it('generates a gear item with basic properties', () => {
            const gear = generateRandomGear(1);
            expect(gear).toHaveProperty('id');
            expect(gear).toHaveProperty('name');
            expect(gear).toHaveProperty('type');
            expect(gear).toHaveProperty('stats');
            expect(gear).toHaveProperty('value');
        });

        it('can generate varied types depending on internal random flow', () => {
            // Because it is random, we just ensure it doesn't crash on multiple calls.
            for (let i = 0; i < 50; i++) {
                const gear = generateRandomGear(100);
                expect(gear.value).toBeGreaterThan(0);
            }
        });
    });

    describe('generatePotion', () => {
        it('generates potions for specific dungeon types', () => {
            const basic = generatePotion('BASIC_POTION');
            expect(['Basic', 'Good']).toContain(basic.name.split(' ')[0]);

            const rare = generatePotion('RARE_POTION');
            expect(['Rare', 'Legendary']).toContain(rare.name.split(' ')[0]);
        });
    });

    describe('challengeBoss', () => {
        it('returns true if the player deals exceptional damage', () => {
            const opPlayer = { maxHit: 9999, accuracy: 9999, defence: 9999, stamina: 9999 };
            const fight = challengeBoss(opPlayer);
            expect(fight(0)).toBe(true);
        });

        it('returns false if player is too weak', () => {
            const weakPlayer = { maxHit: 1, accuracy: 1, defence: 0, stamina: 1 };
            const fight = challengeBoss(weakPlayer);
            expect(fight(10)).toBe(false);
        });
    });

    describe('Town Logic', () => {
        it('calculates town XP per level', () => {
            expect(calculateTownXPForLevel(1)).toBe(100);
            expect(calculateTownXPForLevel(2)).toBe(150);
        });

        it('generates a valid town quest', () => {
            const quest = generateQuest(1);
            expect(quest).toHaveProperty('id');
            expect(quest).toHaveProperty('progress', 0);
            expect(quest).toHaveProperty('isCompleted', false);
        });

        it('generates shop items correctly', () => {
            const bsItems = generateShopItems(5, 'Blacksmith');
            expect(bsItems.length).toBeGreaterThan(0);
            expect(bsItems[0]).toHaveProperty('buyPrice');
            expect(bsItems[0].type).not.toBe('Potion'); // BS sells gear

            const potionItems = generateShopItems(5, 'Potion');
            expect(potionItems.length).toBeGreaterThan(0);
            expect(potionItems[0].type).toBe('Potion');
        });
    });
});
