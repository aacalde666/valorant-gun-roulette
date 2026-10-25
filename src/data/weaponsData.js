export const WEAPON_CATEGORIES = [
  {
    id: 'sidearms',
    tier: 1,
    name: 'Pistolas',
    categoryDisplay: 'Sidearm',
    description: 'Pistolas y armas secundarias',
    weapons: [
      {
        id: 'classic',
        name: 'Classic',
        category: 'Sidearm',
        icon: './weapons/classic.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png'
      },
      {
        id: 'shorty',
        name: 'Shorty',
        category: 'Sidearm',
        icon: './weapons/shorty.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/42da8ccc-40d5-affc-beec-15aa47b42eda/displayicon.png'
      },
      {
        id: 'frenzy',
        name: 'Frenzy',
        category: 'Sidearm',
        icon: './weapons/frenzy.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/44d4e95c-4157-0037-81b2-17841bf2e8e3/displayicon.png'
      },
      {
        id: 'ghost',
        name: 'Ghost',
        category: 'Sidearm',
        icon: './weapons/ghost.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/1baa85b4-4c70-1284-64bb-6481dfc3bb4e/displayicon.png'
      },
      {
        id: 'bandit',
        name: 'Bandit',
        category: 'Sidearm',
        icon: './weapons/bandit.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/410b2e0b-4ceb-1321-1727-20858f7f3477/displayicon.png'
      },
      {
        id: 'sheriff',
        name: 'Sheriff',
        category: 'Sidearm',
        icon: './weapons/sheriff.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/e336c6b8-418d-9340-d77f-7a9e4cfe0702/displayicon.png'
      },
    ]
  },
  {
    id: 'smgs',
    tier: 2,
    name: 'Subfusiles',
    categoryDisplay: 'Submachine Gun',
    description: 'Armas ligeras de cadencia rápida',
    weapons: [
      {
        id: 'stinger',
        name: 'Stinger',
        category: 'Submachine Gun',
        icon: './weapons/stinger.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/f7e1b454-4ad4-1063-ec0a-159e56b58941/displayicon.png'
      },
      {
        id: 'spectre',
        name: 'Spectre',
        category: 'Submachine Gun',
        icon: './weapons/spectre.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/462080d1-4035-2937-7c09-27aa2a5c27a7/displayicon.png'
      },
    ]
  },
  {
    id: 'shotguns',
    tier: 3,
    name: 'Escopetas',
    categoryDisplay: 'Shotgun',
    description: 'Potencia destructiva a corta distancia',
    weapons: [
      {
        id: 'bucky',
        name: 'Bucky',
        category: 'Shotgun',
        icon: './weapons/bucky.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/910be174-449b-c412-ab22-d0873436b21b/displayicon.png'
      },
      {
        id: 'judge',
        name: 'Judge',
        category: 'Shotgun',
        icon: './weapons/judge.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/ec845bf4-4f79-ddda-a3da-0db3774b2794/displayicon.png'
      },
    ]
  },
  {
    id: 'rifles',
    tier: 4,
    name: 'Rifles de Asalto',
    categoryDisplay: 'Assault Rifle',
    description: 'El núcleo táctico de Valorant',
    weapons: [
      {
        id: 'bulldog',
        name: 'Bulldog',
        category: 'Assault Rifle',
        icon: './weapons/bulldog.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/ae3de142-4d85-2547-dd26-4e90bed35cf7/displayicon.png'
      },
      {
        id: 'guardian',
        name: 'Guardian',
        category: 'Assault Rifle',
        icon: './weapons/guardian.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/4ade7faa-4cf1-8376-95ef-39884480959b/displayicon.png'
      },
      {
        id: 'warden',
        name: 'Warden',
        category: 'Assault Rifle',
        icon: './weapons/warden.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/8db0a1bf-4a50-832a-4566-faaaa6d250ca/displayicon.png'
      },
      {
        id: 'phantom',
        name: 'Phantom',
        category: 'Assault Rifle',
        icon: './weapons/phantom.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a/displayicon.png'
      },
      {
        id: 'vandal',
        name: 'Vandal',
        category: 'Assault Rifle',
        icon: './weapons/vandal.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/9c82e19d-4575-0200-1a81-3eacf00cf872/displayicon.png'
      },
    ]
  },
  {
    id: 'snipers',
    tier: 5,
    name: 'Francotiradores',
    categoryDisplay: 'Sniper Rifle',
    description: 'Precisión letal a larga distancia',
    weapons: [
      {
        id: 'marshal',
        name: 'Marshal',
        category: 'Sniper Rifle',
        icon: './weapons/marshal.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/c4883e50-4494-202c-3ec3-6b8a9284f00b/displayicon.png'
      },
      {
        id: 'outlaw',
        name: 'Outlaw',
        category: 'Sniper Rifle',
        icon: './weapons/outlaw.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/5f0aaf7a-4289-3998-d5ff-eb9a5cf7ef5c/displayicon.png'
      },
      {
        id: 'operator',
        name: 'Operator',
        category: 'Sniper Rifle',
        icon: './weapons/operator.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/a03b24d3-4319-996d-0f8c-94bbfba1dfc7/displayicon.png'
      },
    ]
  },
  {
    id: 'heavies',
    tier: 6,
    name: 'Ametralladoras',
    categoryDisplay: 'Heavy Weapon',
    description: 'Fuego de supresión y cargadores masivos',
    weapons: [
      {
        id: 'ares',
        name: 'Ares',
        category: 'Heavy Weapon',
        icon: './weapons/ares.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/55d8a0f4-4274-ca67-fe2c-06ab45efdf58/displayicon.png'
      },
      {
        id: 'odin',
        name: 'Odin',
        category: 'Heavy Weapon',
        icon: './weapons/odin.png',
        fallbackIcon: 'https://media.valorant-api.com/weapons/63e6c2b6-4a8e-869c-3d4c-e38355226584/displayicon.png'
      },
    ]
  }
];

// Helper to generate a random challenge stage
export function generateRandomStage(category, minKills = 2, maxKills = 5, minDeaths = 1, maxDeaths = 3) {
  // Pick one random weapon from this category
  const weaponIndex = Math.floor(Math.random() * category.weapons.length);
  const selectedWeapon = category.weapons[weaponIndex];

  // Random kills between min and max (inclusive)
  const targetKills = Math.floor(Math.random() * (maxKills - minKills + 1)) + minKills;

  // RULE: In the pistol round (sidearms), tolerance is always FIXED TO 3 DEATHS
  // so the player always gets 3 attempts before switching pistols!
  const maxAllowedDeaths = category.id === 'sidearms'
    ? 3
    : Math.floor(Math.random() * (maxDeaths - minDeaths + 1)) + minDeaths;

  return {
    id: `${category.id}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    categoryId: category.id,
    categoryName: category.name,
    categoryDisplay: category.categoryDisplay,
    tierNumber: category.tier,
    weapon: selectedWeapon,
    targetKills,
    maxAllowedDeaths,
    currentKills: 0,
    currentDeaths: 0,
    status: 'pending' // 'pending', 'active', 'ready_to_switch', 'completed', 'demoted'
  };
}

// Generate an entire run through all categories
export function generateFullRun(categories = WEAPON_CATEGORIES, config = { minKills: 2, maxKills: 5, minDeaths: 1, maxDeaths: 3 }) {
  return categories.map((cat, idx) => {
    const stage = generateRandomStage(cat, config.minKills, config.maxKills, config.minDeaths, config.maxDeaths);
    if (idx === 0) {
      stage.status = 'active';
    }
    return stage;
  });
}
