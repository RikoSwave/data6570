
// src/utils/gameLogic.js


// Constants
export const BASE_XP_PER_CLICK = 2;
export const LEVEL_2_XP = 80;

// Pre-calculate XP table for levels 1-10
function getBaseXPTable() {
    const table = [0, 0]; // Level 0, Level 1 (0 XP)
    let currentLevelXP = LEVEL_2_XP; // XP needed to get FROM 1 TO 2
    table[2] = currentLevelXP;

    // Level 3 to 10
    // "1.3x the previous level's experience" -> means the *interval* scales.
    for (let l = 3; l <= 10; l++) {
        currentLevelXP = currentLevelXP * 1.3;
        table[l] = table[l - 1] + currentLevelXP;
    }
    return table;
}

const BASE_TABLE = getBaseXPTable();
const XP_AT_LEVEL_10 = BASE_TABLE[10];

/**
 * Calculates the total XP required to reach a specific level.
 * @param {number} level - The target level.
 * @returns {number} - The total XP required.
 */
export const calculateXPForLevel = (level) => {
    if (level <= 1) return 0;
    if (level <= 10) return Math.floor(BASE_TABLE[level]);

    // For level > 10.
    // The rule: Total(17) = 2 * Total(10)
    // Generally: The Total XP doubles every 7 levels.
    // Total(10 + 7n) = XP_AT_LEVEL_10 * (2^n)

    // level = 10 + 7n + remainder
    const levelsPast10 = level - 10;
    const n = Math.floor(levelsPast10 / 7);
    const remainder = levelsPast10 % 7;

    const xpAtBracketStart = XP_AT_LEVEL_10 * Math.pow(2, n);
    // Linear interpolation for remainder levels
    // The "Difference" needed is xpAtBracketStart (since next is double).
    // So we need to gain xpAtBracketStart XP over 7 levels.
    const xpPerLevelInBracket = xpAtBracketStart / 7;

    return Math.floor(xpAtBracketStart + (remainder * xpPerLevelInBracket));
};

export const getLevelFromXP = (xp) => {
    let level = 1;
    // Simple iterative check
    while (calculateXPForLevel(level + 1) <= xp) {
        level++;
    }
    return level;
};

// Combat Logic
export const calculateCombatStats = (level, gearStats) => {
    // Base stats from level
    const baseStats = {
        accuracy: level * 3,
        maxHit: Math.floor(level) + 1,
        defence: level * 3,
        stamina: level * 15 // Base stamina
    };

    // Calculate percentages strictly against base stats
    const accBonus = Math.floor(baseStats.accuracy * ((gearStats.accuracyPercent || 0) / 100));
    const strBonus = Math.floor(baseStats.maxHit * ((gearStats.maxHitPercent || 0) / 100));

    // Add gear stats
    return {
        accuracy: baseStats.accuracy + accBonus + (gearStats.accuracy || 0),
        maxHit: baseStats.maxHit + strBonus + (gearStats.maxHit || 0),
        defence: baseStats.defence + (gearStats.defence || 0),
        stamina: baseStats.stamina + (gearStats.stamina || 0)
    };
};

export const CREATURES = [
    { id: 'chicken', name: 'Chicken', stamina: 10, defence: 0, maxHit: 1, xp: 5 },
    { id: 'cow', name: 'Cow', stamina: 25, defence: 2, maxHit: 2, xp: 15 },
    { id: 'goblin', name: 'Small Goblin', stamina: 50, defence: 5, maxHit: 4, xp: 30 }
];

export const getBossStats = (bossesDefeated) => {
    return {
        hp: 50 + ((bossesDefeated) ^ 2 * 50),
        defence: 10 + ((bossesDefeated) ^ 2 * 5),
        maxHit: 5 + ((bossesDefeated) ^ 2 * 2),
        accuracy: 10 + ((bossesDefeated) ^ 2 * 5)
    };
};

export const challengeBoss = (playerStats) => {
    return (bossesDefeated) => {
        const bossStats = getBossStats(bossesDefeated);
        const bossHP = bossStats.hp;
        const bossDefence = bossStats.defence;
        const bossDamage = bossStats.maxHit;

        // Player damage output in 5 seconds.
        const playerHitChance = Math.min(0.95, playerStats.accuracy / (bossDefence * 2));
        const playerAvgHit = (playerStats.maxHit / 2) * playerHitChance;
        const totalPlayerDamage = playerAvgHit * 5;

        // Boss damage to player
        const playerHP = 50 + (playerStats.defence * 2);

        // Calculate boss accuracy against player defence instead of flat 0.5
        const bossHitChance = Math.min(0.95, bossStats.accuracy / (playerStats.defence * 2 + 1));
        const bossTotalDamage = (bossDamage * bossHitChance) * 5;

        const effectiveHP = playerStats.stamina || playerHP;

        if (bossTotalDamage >= effectiveHP) return false; // Player died
        if (totalPlayerDamage >= bossHP) return true; // Boss died

        return false; // Time ran out / didn't kill boss
    }
};



// Gear Logic
export const GEAR_TYPES = ['Weapon', 'Armor', 'Helmet', 'Legs', 'Boots', 'Gloves', 'Amulet', 'Magic Artifact', 'Shield'];

const GEAR_PREFIXES = ['Broken', 'Rusty', 'Iron', 'Steel', 'Mithril', 'Adamant', 'Rune', 'Dragon'];

// Map internal types to display names or categories if needed
// We will generate items with a 'type' that matches GEAR_TYPES
const GEAR_SLOT_MAP = [
    { type: 'Weapon', name: 'Sword' },
    { type: 'Armor', name: 'Platebody' },
    { type: 'Helmet', name: 'Helm' },
    { type: 'Legs', name: 'Platelegs' },
    { type: 'Boots', name: 'Boots' },
    { type: 'Gloves', name: 'Gloves' },
    { type: 'Shield', name: 'Shield' }
];

const RARE_SLOT_MAP = [
    { type: 'Amulet', name: 'Amulet' },
    { type: 'Magic Artifact', name: 'Artifact' }
];

export const generateRandomGear = (level) => {
    // Rarity Check: 10% chance for Amulet/Artifact
    const isRare = Math.random() < 0.1;
    // Lucky Check: 1% chance (very rare)
    const isLucky = Math.random() < 0.01;

    // Select Slot
    let slotData;
    if (isRare) {
        slotData = RARE_SLOT_MAP[Math.floor(Math.random() * RARE_SLOT_MAP.length)];
    } else {
        slotData = GEAR_SLOT_MAP[Math.floor(Math.random() * GEAR_SLOT_MAP.length)];
    }

    // Determine Tier
    const tier = Math.min(GEAR_PREFIXES.length - 1, Math.floor(Math.random() * (level / 5)) + Math.floor(Math.random() * 2));
    const prefix = GEAR_PREFIXES[Math.max(0, tier)];

    let baseVal = (tier + 1) * 5;

    // Rare items are more powerful
    if (isRare) {
        baseVal = Math.floor(baseVal * 1.5);
    }

    // Stat Randomization
    // Range: +/- 20%
    // If Lucky: Max roll (+20%)
    let variance = 0;
    if (isLucky) {
        variance = 0.2;
    } else {
        // Random between -0.2 and 0.2
        variance = (Math.random() * 0.4) - 0.2;
    }

    let baseStat = Math.floor(baseVal * (1 + variance));
    // Ensure at least 1
    baseStat = Math.max(1, baseStat);

    let stats = { accuracy: 0, maxHit: 0, defence: 0, stamina: 0 };

    // Percent chance roll (only for Adamant or higher, which is tier 5+)
    const rollPercent = (tier >= 5) && (Math.random() < 0.33);

    switch (slotData.type) {
        case 'Weapon':
            if (rollPercent) {
                stats.accuracyPercent = Math.max(5, (tier + 1) * 3);
                stats.maxHitPercent = Math.max(5, (tier + 1) * 3);
            } else {
                stats.accuracy = Math.floor(baseStat / 1.5);
                stats.maxHit = Math.floor(baseStat / 1.5);
            }
            break;
        case 'Armor':
            stats.defence = baseStat;
            stats.stamina = Math.floor(baseStat / 2);
            break;
        case 'Legs':
            stats.defence = baseStat;
            stats.stamina = Math.floor(baseStat / 3);
            break;
        case 'Helmet':
            stats.defence = Math.floor(baseStat * 0.8);
            stats.accuracy = Math.floor(baseStat * 0.2);
            break;
        case 'Boots':
            stats.defence = Math.floor(baseStat / 2);
            stats.maxHit = Math.floor(baseStat / 3);
            break;
        case 'Gloves':
            stats.accuracy = Math.floor(baseStat / 3);
            stats.maxHit = Math.floor(baseStat / 3);
            stats.defence = Math.floor(baseStat / 3);
            break;
        case 'Shield':
            stats.defence = baseStat;
            stats.stamina = Math.floor(baseStat / 2);
            // Higher tier shields give strength
            if (tier >= 4) { // Mithril+
                stats.maxHit = Math.floor(baseStat / 4);
            }
            break;
        case 'Amulet':
            if (rollPercent) {
                stats.accuracyPercent = Math.max(5, (tier + 1) * 5);
            } else {
                stats.accuracy = Math.floor(baseStat * 0.8);
                stats.defence = Math.floor(baseStat * 0.3);
                stats.maxHit = Math.floor(baseStat * 0.5);
            }
            break;
        case 'Magic Artifact':
            if (rollPercent) {
                stats.maxHitPercent = Math.max(5, (tier + 1) * 5);
                stats.speedBonus = (tier + 1) * 2;
            } else {
                stats.maxHit = Math.floor(baseStat * 0.8);
                stats.accuracy = Math.floor(baseStat * 0.5);
                stats.stamina = Math.floor(baseStat * 0.2);
                stats.speedBonus = (tier + 1) * 2;
            }
            break;
    }

    let finalName = `${prefix} ${slotData.name}`;

    // Apply Lucky Bonus
    if (isLucky) {
        finalName = `Lucky ${finalName}`;
        // Bonus Amount: 30% of base stat (min 2)
        const luckyBonus = Math.max(2, Math.floor(baseVal * 0.3));
        stats.accuracy = (stats.accuracy || 0) + luckyBonus;
        stats.maxHit = (stats.maxHit || 0) + luckyBonus;
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        name: finalName,
        type: slotData.type, // This MUST match GEAR_TYPES keys
        stats,
        value: Math.floor((tier + 1) * (isRare ? 50 : 10) * (isLucky ? 5 : 1) / 2)
    };
};

// Potion Logic
export const POTION_TYPES = ['Accuracy', 'Strength', 'Defence', 'Health'];
export const POTION_TIERS = ['Basic', 'Good', 'Rare', 'Legendary'];

export const DUNGEON_TYPES = {
    GEAR: { name: 'Gear Dungeon', cost: 0, time: 15, type: 'gear', description: 'Find equipment and weapons to boost your stats.' },
    BASIC_POTION: { name: 'Basic Potion Dungeon', cost: 10, time: 30, type: 'potion', tier: 'Basic', description: 'Acquire basic potions for temporary buffs.' },
    GOOD_POTION: { name: 'Good Potion Dungeon', cost: 50, time: 30, type: 'potion', tier: 'Good', description: 'Find stronger potions with better effects.' },
    RARE_POTION: { name: 'Rare Potion Dungeon', cost: 200, time: 30, type: 'potion', tier: 'Rare', description: 'Hunt for the most powerful potions in the land.' },
};

export const generatePotion = (dungeonType) => {
    // Determine Potion Tier based on dungeon
    let possibleTiers = [];
    if (dungeonType === 'BASIC_POTION') possibleTiers = ['Basic', 'Good'];
    if (dungeonType === 'GOOD_POTION') possibleTiers = ['Good', 'Rare'];
    if (dungeonType === 'RARE_POTION') possibleTiers = ['Rare', 'Legendary'];

    // Weighted random for better tier?
    // Let's say 20% chance for the higher tier
    const isHigher = Math.random() < 0.2;
    const tier = isHigher ? possibleTiers[1] : possibleTiers[0];

    const type = POTION_TYPES[Math.floor(Math.random() * POTION_TYPES.length)];

    let multiplier = 1.1; // Basic = +10%
    let healPercent = 0.25; // 25% max HP heal
    let value = 5; // Basic sell value (Cost 10)

    if (tier === 'Good') {
        multiplier = 1.25; // +25%
        healPercent = 0.50;
        value = 25; // Good sell value (Cost 50)
    }
    if (tier === 'Rare') {
        multiplier = 1.5; // +50%
        healPercent = 0.75;
        value = 100; // Rare sell value (Cost 200)
    }
    if (tier === 'Legendary') {
        multiplier = 2.0; // +100%
        healPercent = 1.0;
        value = 150; // Legendary sell value (obtained from 200 cost dungeon)
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        name: `${tier} ${type} Potion`,
        type: 'Potion',
        effectType: type, // 'Accuracy', 'Strength', 'Defence', 'Health'
        multiplier: type === 'Health' ? 1 : multiplier,
        healPercent: type === 'Health' ? healPercent : 0,
        value: value
    };
};

// Town Logic
export const calculateTownXPForLevel = (level) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const TOWN_QUESTS = [
    { id: 'q1', targetId: 'chicken', count: 5, name: 'Pest Control', description: 'Defeat 5 Chickens', rewardCoins: 10, rewardTownXP: 5 },
    { id: 'q2', targetId: 'cow', count: 3, name: 'Beef Supply', description: 'Defeat 3 Cows', rewardCoins: 10, rewardTownXP: 10 },
    { id: 'q3', targetId: 'goblin', count: 3, name: 'Goblin Trouble', description: 'Defeat 3 Small Goblins', rewardCoins: 15, rewardTownXP: 25 },
    { id: 'q4', targetId: 'chicken', count: 10, name: 'Obsessive Hunter', description: 'Defeat 10 Chickens', rewardCoins: 10, rewardTownXP: 20 },
    { id: 'q5', targetId: 'cow', count: 10, name: 'Steak Dinner', description: 'Defeat 10 Cows', rewardCoins: 20, rewardTownXP: 10 },
    { id: 'q6', targetId: 'goblin', count: 10, name: 'Goblin Slayer', description: 'Defeat 10 Small Goblins', rewardCoins: 25, rewardTownXP: 25 },
];

export const generateQuest = (townLevel) => {
    // simple random selection for now
    const quest = TOWN_QUESTS[Math.floor(Math.random() * TOWN_QUESTS.length)];
    return { ...quest, progress: 0, isCompleted: false };
};

export const generateShopItems = (townLevel, shopType) => {
    const items = [];
    const itemCount = 2 + Math.floor(townLevel / 2); // Expands with level

    for (let i = 0; i < itemCount; i++) {
        if (shopType === 'Blacksmith') {
            // Gear Shop
            // Tier based on townLevel?
            // Let's reuse generateRandomGear but force strict tiers?
            // "The tiers... should depend on the city level"
            // Let's modify generateRandomGear to accept a 'tierOverride' or just filter?
            // Easier to just generate random gear with a 'level' equivalent to townLevel * 10?
            // Player Level ~ Town Level * 5?
            const item = generateRandomGear(townLevel * 5);
            // "Buy price... very high"
            item.buyPrice = item.value * 5;
            // "average or good quality" -> Maybe filter out 'Rusty' or ensuring not 'Legendary'? 
            // generateRandomGear handles low tiers.
            items.push(item);
        } else if (shopType === 'Potion') {
            // Potion Shop
            // Unlock tiers based on Town Level
            let dungeonType = 'BASIC_POTION';
            if (townLevel >= 3) dungeonType = 'GOOD_POTION';
            if (townLevel >= 5) dungeonType = 'RARE_POTION';

            const potion = generatePotion(dungeonType);
            potion.buyPrice = potion.value * 5;
            items.push(potion);
        }
    }
    return items;
};

export const getTownLevelBonuses = (level) => {
    const bonuses = [];
    if (level === 2) {
        bonuses.push('Upgrades Inn (+10 HP)');
        bonuses.push('Expands Shop Stock');
    } else if (level === 3) {
        bonuses.push('Unlocks Good Potions');
        bonuses.push('Better Gear in Shop');
    } else if (level === 5) {
        bonuses.push('Unlocks Rare Potions');
        bonuses.push('Max Shop Items Expanded');
    } else if (level > 2) {
        bonuses.push('Better Gear in Shop');
        bonuses.push('Expands Shop Stock');
    } else {
        bonuses.push('More items added to Town Shops');
    }
    bonuses.push('Slightly increase Dungeon exploration success chance.');
    return bonuses;
};
