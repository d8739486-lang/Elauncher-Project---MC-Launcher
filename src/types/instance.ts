export type ModLoader = 'Fabric' | 'Forge' | 'NeoForge' | 'Vanilla' | 'ELauncher';

export interface Instance {
  id: string;
  name: string;
  version: string;
  loader: ModLoader;
  preview: string;
  modsCount?: number;
}

export const PREVIEW_OPTIONS = [
  { id: 'campfire', src: '/previews/preset_campfire.jpg', label: 'У костра (Тайга)' },
  { id: 'cherry', src: '/previews/preset_cherry.jpg', label: 'Вишневый сад' },
  { id: 'palegarden', src: '/previews/preset_palegarden.jpg', label: 'Бледный сад' },
  { id: 'portal', src: '/previews/preset_portal.jpg', label: 'Портал в Незер' },
  { id: 'deepdark', src: '/previews/preset_deepdark.jpg', label: 'Древний город' },
  { id: 'icecaves', src: '/previews/preset_icecaves.jpg', label: 'Ледяные пещеры' },
  { id: 'copper', src: '/previews/preset_copper.jpg', label: 'Медные залы' },
  { id: 'default', src: '/previews/preset_default.png', label: 'Логотип Elauncher' },
];

export type VersionTypeCategory = 'release' | 'snapshot' | 'ancient';

export interface VersionItem {
  id: string;
  label: string;
  majorGroup: string;
  coverImage: string;
  blockIcon: string;
  category: VersionTypeCategory;
  description?: string;
  badge?: string;
}

export interface VersionGroup {
  group: string;
  category?: VersionTypeCategory;
  items: VersionItem[];
}

export const VERSION_GROUPS: VersionGroup[] = [
  // ==========================================
  // 1. ДРОПЫ И РЕЛИЗЫ СО СНАПШОТАМИ (2026 - 1.13)
  // Снапшоты и Release Candidates смешаны с релизами хронологически!
  // ==========================================
  {
    group: 'Новая эра (Годовая нумерация с 2026 года)',
    items: [
      { id: '26.4-snapshot-3', label: '26.4-snapshot-3', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_4.svg', blockIcon: '/minecraft_textures/blue_ice.png', majorGroup: 'Snapshot', description: 'Свежий снапшот: генерация ледяных пещер' },
      { id: '26.4-snapshot-2', label: '26.4-snapshot-2', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_4.svg', blockIcon: '/minecraft_textures/blue_ice.png', majorGroup: 'Snapshot', description: 'Тестирование сталактитов льда' },
      { id: '26.4-snapshot-1', label: '26.4-snapshot-1', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_4.svg', blockIcon: '/minecraft_textures/blue_ice.png', majorGroup: 'Snapshot', description: 'Первый снапшот дропа 26.4' },
      { id: '26.4', label: '26.4', category: 'release', coverImage: '/version_covers/cover_26_4.svg', blockIcon: '/minecraft_textures/blue_ice.png', majorGroup: '2026 Drops', description: 'Четвертый дроп 2026 (Ледяные пещеры)' },
      { id: '26.3-rc-1', label: '26.3-rc-1', category: 'snapshot', badge: 'RC', coverImage: '/version_covers/cover_26_3.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Release Candidate', description: 'Release Candidate Wilderness Bound' },
      { id: '26.3-snapshot-5', label: '26.3-snapshot-5', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_3.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Snapshot', description: 'Тестирование флоры пестрого леса' },
      { id: '26.3-snapshot-1', label: '26.3-snapshot-1', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_3.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Snapshot', description: 'Первый снапшот Wilderness Bound' },
      { id: '26.3', label: '26.3', category: 'release', coverImage: '/version_covers/cover_26_3.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: '2026 Drops', description: 'Wilderness Bound (Пестрый лес)' },
      { id: '26.2-rc-1', label: '26.2-rc-1', category: 'snapshot', badge: 'RC', coverImage: '/version_covers/cover_26_2.svg', blockIcon: '/minecraft_textures/magma.png', majorGroup: 'Release Candidate', description: 'Release Candidate Chaos Cubed' },
      { id: '26.2-snapshot-5', label: '26.2-snapshot-5', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_2.svg', blockIcon: '/minecraft_textures/magma.png', majorGroup: 'Snapshot', description: 'Серные пещеры и вулканические гейзеры' },
      { id: '26.2', label: '26.2', category: 'release', coverImage: '/version_covers/cover_26_2.svg', blockIcon: '/minecraft_textures/magma.png', majorGroup: '2026 Drops', description: 'Chaos Cubed (Серные пещеры)' },
      { id: '26w14a', label: '26w14a (2026)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/command_block.png', majorGroup: 'April Fools', description: 'Первоапрельский розыгрыш 2026' },
      { id: '26.1.2', label: '26.1.2', category: 'release', coverImage: '/version_covers/cover_26_1.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: '2026 Drops', description: 'Tiny Takeover хотфикс' },
      { id: '26.1.1', label: '26.1.1', category: 'release', coverImage: '/version_covers/cover_26_1.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: '2026 Drops', description: 'Tiny Takeover обновление' },
      { id: '26.1-rc-1', label: '26.1-rc-1', category: 'snapshot', badge: 'RC', coverImage: '/version_covers/cover_26_1.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Release Candidate', description: 'Release Candidate для Tiny Takeover' },
      { id: '26.1-snapshot-5', label: '26.1-snapshot-5', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_26_1.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Snapshot', description: 'Анимации малышей мобов' },
      { id: '26.1', label: '26.1', category: 'release', coverImage: '/version_covers/cover_26_1.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: '2026 Drops', description: 'Tiny Takeover (Малыши мобов)' },
    ]
  },
  {
    group: 'Линейка 1.21 (Tricky Trials & Дропы 2024-2025)',
    items: [
      { id: '1.21.11', label: '1.21.11', category: 'release', coverImage: '/version_covers/cover_1_21_11.svg', blockIcon: '/minecraft_textures/spear.png', majorGroup: '1.21 Series', description: 'Mounts of Mayhem (Копьё, зомби-всадники, наутилусы)' },
      { id: '1.21.11-rc1', label: '1.21.11-rc1', category: 'snapshot', badge: 'RC', coverImage: '/version_covers/cover_1_21_11.svg', blockIcon: '/minecraft_textures/spear.png', majorGroup: 'Release Candidate', description: 'Release Candidate 1 для Mounts of Mayhem' },
      { id: '25w46a', label: '25w46a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21_11.svg', blockIcon: '/minecraft_textures/spear.png', majorGroup: 'Snapshot', description: 'Тестирование механики копья и верховой езды' },
      { id: '25w45a', label: '25w45a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21_11.svg', blockIcon: '/minecraft_textures/heart_of_the_sea.png', majorGroup: 'Snapshot', description: 'Снапшот подводных наутилусов' },
      { id: '1.21.10', label: '1.21.10', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.21 Series', description: 'Техническое обновление и оптимизация' },
      { id: '1.21.9', label: '1.21.9', category: 'release', coverImage: '/version_covers/cover_1_21_9.svg', blockIcon: '/minecraft_textures/copper_bulb.png', majorGroup: '1.21 Series', description: 'The Copper Age (Медный голем, медные сундуки)' },
      { id: '25w37a', label: '25w37a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21_9.svg', blockIcon: '/minecraft_textures/copper_bulb.png', majorGroup: 'Snapshot', description: 'Снапшот The Copper Age (Медные блоки и големы)' },
      { id: '1.21.8', label: '1.21.8', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/compass.png', majorGroup: '1.21 Series', description: 'Хотфикс стабильности мультиплеера' },
      { id: '1.21.7', label: '1.21.7', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/gold_block.png', majorGroup: '1.21 Series', description: '«Майнкрафт в кино» мини-патч' },
      { id: '1.21.6', label: '1.21.6', category: 'release', coverImage: '/version_covers/cover_1_21_6.svg', blockIcon: '/minecraft_textures/heart_of_the_sea.png', majorGroup: '1.21 Series', description: 'Chase the Skies (Гастёныши, Счастливый Гаст)' },
      { id: '25w21a', label: '25w21a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21_6.svg', blockIcon: '/minecraft_textures/heart_of_the_sea.png', majorGroup: 'Snapshot', description: 'Снапшот Chase the Skies: полеты и Гастёныши' },
      { id: '25w14craftmine', label: '25w14craftmine (2025)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/wooden_pickaxe.png', majorGroup: 'April Fools', description: 'Первоапрельское измерение CraftMine' },
      { id: '1.21.5', label: '1.21.5', category: 'release', coverImage: '/version_covers/1_21_5.png', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: '1.21 Series', description: 'Spring to Life (Светлячки, биомные мобы)' },
      { id: '25w07a', label: '25w07a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/1_21_5.png', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Snapshot', description: 'Снапшот Spring to Life (Светлячки и весенняя флора)' },
      { id: '1.21.4', label: '1.21.4', category: 'release', coverImage: '/version_covers/cover_1_21_4.svg', blockIcon: '/minecraft_textures/creaking_heart.png', majorGroup: '1.21 Series', description: 'The Garden Awakens (Бледный сад, Скрипун)' },
      { id: '24w45a', label: '24w45a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21_4.svg', blockIcon: '/minecraft_textures/creaking_heart.png', majorGroup: 'Snapshot', description: 'Снапшот The Garden Awakens (Тесты сердца Скрипуна)' },
      { id: '24w44a', label: '24w44a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21_4.svg', blockIcon: '/minecraft_textures/creaking_heart.png', majorGroup: 'Snapshot', description: 'Первое появление Бледного сада и Скрипуна' },
      { id: '1.21.3', label: '1.21.3', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/redstone_torch.png', majorGroup: '1.21 Series', description: 'Срочное исправление багов и оптимизация' },
      { id: '1.21.2', label: '1.21.2', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/bundle.png', majorGroup: '1.21 Series', description: 'Bundles of Bravery (Мешки инвентаря)' },
      { id: '24w33a', label: '24w33a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/bundle.png', majorGroup: 'Snapshot', description: 'Тестовый снапшот переработанных мешков Bundles' },
      { id: '24w14potato', label: '24w14potato (2024)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/poisonous_potato.png', majorGroup: 'April Fools', description: 'The Poisonous Potato Update (Картофельное измерение)' },
      { id: '1.21.1', label: '1.21.1', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/writable_book.png', majorGroup: '1.21 Series', description: 'Хотфикс безопасности и новые языки' },
      { id: '24w18a', label: '24w18a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/mace.png', majorGroup: 'Snapshot', description: 'Снапшот Булавы и тяжелых ядер' },
      { id: '1.21-pre1', label: '1.21-pre1', category: 'snapshot', badge: 'Pre-release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/mace.png', majorGroup: 'Pre-release', description: 'Первый пре-релиз Tricky Trials' },
      { id: '1.21', label: '1.21', category: 'release', coverImage: '/version_covers/cover_1_21.svg', blockIcon: '/minecraft_textures/mace.png', majorGroup: '1.21 Series', description: 'Tricky Trials (Дворец испытаний, Булава)' },
    ]
  },
  {
    group: 'Линейка 1.20 (Trails & Tales)',
    items: [
      { id: '1.20.8', label: '1.20.8', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.20 Series', description: 'Хотфикс стабильности и оптимизация' },
      { id: '1.20.7', label: '1.20.7', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/redstone_torch.png', majorGroup: '1.20 Series', description: 'Технические исправления' },
      { id: '1.20.6', label: '1.20.6', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: '1.20 Series', description: 'Армуры волков и хотфикс' },
      { id: '24w11a', label: '24w11a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/saddle.png', majorGroup: 'Snapshot', description: 'Снапшот волчьей брони и 8 новых пород волков' },
      { id: '1.20.5', label: '1.20.5', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/saddle.png', majorGroup: '1.20 Series', description: 'Броненосцы, вариации волков' },
      { id: '1.20.4', label: '1.20.4', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/brick.png', majorGroup: '1.20 Series', description: 'Хотфикс декорированных горшков' },
      { id: '23w51a', label: '23w51a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/saddle.png', majorGroup: 'Snapshot', description: 'Первое появление Броненосца и щитка' },
      { id: '1.20.3', label: '1.20.3', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/prismarine_shard.png', majorGroup: '1.20 Series', description: 'Декоративные горшки и вихрь' },
      { id: '23w13a_or_b', label: '23w13a_or_b (2023)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/command_block.png', majorGroup: 'April Fools', description: 'The Vote Update (Измерение Луны, система голосований)' },
      { id: '1.20.2', label: '1.20.2', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/compass.png', majorGroup: '1.20 Series', description: 'Сетевой протокол и баланс' },
      { id: '1.20.1', label: '1.20.1', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/gold_block.png', majorGroup: '1.20 Series', description: 'Стабильный релиз для модов' },
      { id: '23w12a', label: '23w12a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/cherry_leaves.png', majorGroup: 'Snapshot', description: 'Снапшот Вишневой рощи и калиброванного скалка' },
      { id: '23w07a', label: '23w07a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/brush.png', majorGroup: 'Snapshot', description: 'Снапшот Археологии, Нюхача и кисточки' },
      { id: '1.20-pre1', label: '1.20-pre1', category: 'snapshot', badge: 'Pre-release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/cherry_leaves.png', majorGroup: 'Pre-release', description: 'Пре-релиз обновления Trails & Tales' },
      { id: '1.20', label: '1.20', category: 'release', coverImage: '/version_covers/cover_1_20.svg', blockIcon: '/minecraft_textures/cherry_leaves.png', majorGroup: '1.20 Series', description: 'Trails & Tales (Вишневые листья, Археология, Нюхач)' },
    ]
  },
  {
    group: 'Линейка 1.19 (The Wild Update)',
    items: [
      { id: '1.19.4', label: '1.19.4', category: 'release', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/sculk_catalyst.png', majorGroup: '1.19 Series', description: 'Финал дикого обновления' },
      { id: '1.19.3', label: '1.19.3', category: 'release', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/command_block.png', majorGroup: '1.19 Series', description: 'Переработка креатив-меню' },
      { id: '22w13oneblockatatime', label: '22w13oneblockatatime (2022)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/dirt.png', majorGroup: 'April Fools', description: 'One Block at a Time (Инвентарь отключен)' },
      { id: '1.19.2', label: '1.19.2', category: 'release', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/diamond_pickaxe.png', majorGroup: '1.19 Series', description: 'Популярная версия модпаков' },
      { id: '1.19.1', label: '1.19.1', category: 'release', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/totem_of_undying.png', majorGroup: '1.19 Series', description: 'Аллеи и чат-репорты' },
      { id: '22w14a', label: '22w14a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/recovery_compass.png', majorGroup: 'Snapshot', description: 'Компас возрождения, пластинка 5 и эхо-осколки' },
      { id: '22w12a', label: '22w12a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/sculk_catalyst.png', majorGroup: 'Snapshot', description: 'Появление Древнего города (Deep Dark) и Хранителя' },
      { id: '1.19-pre1', label: '1.19-pre1', category: 'snapshot', badge: 'Pre-release', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/sculk.png', majorGroup: 'Pre-release', description: 'Пре-релиз со звуковыми скалк-сенсорами' },
      { id: '1.19', label: '1.19', category: 'release', coverImage: '/version_covers/cover_1_19.svg', blockIcon: '/minecraft_textures/sculk.png', majorGroup: '1.19 Series', description: 'The Wild Update (Скалк, Хранитель, Мангры)' },
    ]
  },
  {
    group: 'Линейка 1.18 (Caves & Cliffs: Part II)',
    items: [
      { id: '1.18.2', label: '1.18.2', category: 'release', coverImage: '/version_covers/cover_1_18.svg', blockIcon: '/minecraft_textures/deepslate.png', majorGroup: '1.18 Series', description: 'Стабильная версия генерации' },
      { id: '1.18.1', label: '1.18.1', category: 'release', coverImage: '/version_covers/cover_1_18.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.18 Series', description: 'Исправление чанков и оптимизация' },
      { id: '21w44a', label: '21w44a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_18.svg', blockIcon: '/minecraft_textures/deepslate.png', majorGroup: 'Snapshot', description: 'Снапшот объединения старых и новых чанков мира' },
      { id: '1.18-pre1', label: '1.18-pre1', category: 'snapshot', badge: 'Pre-release', coverImage: '/version_covers/cover_1_18.svg', blockIcon: '/minecraft_textures/deepslate.png', majorGroup: 'Pre-release', description: 'Первый пре-релиз грандиозных пещер и скал' },
      { id: '1.18', label: '1.18', category: 'release', coverImage: '/version_covers/cover_1_18.svg', blockIcon: '/minecraft_textures/blue_ice.png', majorGroup: '1.18 Series', description: 'Новая генерация пещер (Глубинный сланец)' },
    ]
  },
  {
    group: 'Линейка 1.17 (Caves & Cliffs: Part I)',
    items: [
      { id: '1.17.1', label: '1.17.1', category: 'release', coverImage: '/version_covers/cover_1_17.svg', blockIcon: '/minecraft_textures/amethyst_cluster.png', majorGroup: '1.17 Series', description: 'Хотфикс аксолотлей и оптимизация' },
      { id: '21w14a', label: '21w14a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_17.svg', blockIcon: '/minecraft_textures/raw_iron.png', majorGroup: 'Snapshot', description: 'Снапшот добавления сырой руды (Raw Iron/Gold/Copper)' },
      { id: '20w45a', label: '20w45a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_17.svg', blockIcon: '/minecraft_textures/amethyst_cluster.png', majorGroup: 'Snapshot', description: 'Первое появление аметистовых жеод, меди и подзорной трубы' },
      { id: '1.17', label: '1.17', category: 'release', coverImage: '/version_covers/cover_1_17.svg', blockIcon: '/minecraft_textures/copper_block.png', majorGroup: '1.17 Series', description: 'Медь, аметисты, светящиеся спруты' },
    ]
  },
  {
    group: 'Линейка 1.16 (Nether Update)',
    items: [
      { id: '1.16.5', label: '1.16.5', category: 'release', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/netherite_block.png', majorGroup: '1.16 Series', description: 'Легендарная версия для модов' },
      { id: '1.16.4', label: '1.16.4', category: 'release', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/barrier.png', majorGroup: '1.16 Series', description: 'Экран блокировки игроков' },
      { id: '1.16.3', label: '1.16.3', category: 'release', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/gold_block.png', majorGroup: '1.16 Series', description: 'Фикс пиглинов и оптимизация' },
      { id: '20w14infinite', label: '20w14infinite (2020)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/writable_book.png', majorGroup: 'April Fools', description: 'The Ultimate Content Update (2 млрд измерений)' },
      { id: '1.16.2', label: '1.16.2', category: 'release', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/magma.png', majorGroup: '1.16 Series', description: 'Брутальные пиглины' },
      { id: '1.16.1', label: '1.16.1', category: 'release', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/ender_eye.png', majorGroup: '1.16 Series', description: 'Спидраннерская классика' },
      { id: '20w06a', label: '20w06a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/netherite_block.png', majorGroup: 'Snapshot', description: 'Легендарный снапшот первого появления Незерита и Багрового леса' },
      { id: '1.16-rc1', label: '1.16-rc1', category: 'snapshot', badge: 'RC', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/netherite_block.png', majorGroup: 'Release Candidate', description: 'Release Candidate финала Nether Update' },
      { id: '1.16', label: '1.16', category: 'release', coverImage: '/version_covers/cover_1_16.svg', blockIcon: '/minecraft_textures/redstone_block.png', majorGroup: '1.16 Series', description: 'Nether Update (Незерит, пиглины, биомы ада)' },
    ]
  },
  {
    group: 'Линейка 1.15 (Buzzy Bees)',
    items: [
      { id: '1.15.2', label: '1.15.2', category: 'release', coverImage: '/version_covers/cover_1_15.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.15 Series', description: 'Стабильная оптимизация рендера' },
      { id: '1.15.1', label: '1.15.1', category: 'release', coverImage: '/version_covers/cover_1_15.svg', blockIcon: '/minecraft_textures/honeycomb_block.png', majorGroup: '1.15 Series', description: 'Исправления рендера и оптимизация' },
      { id: '19w34a', label: '19w34a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_1_15.svg', blockIcon: '/minecraft_textures/honey_block.png', majorGroup: 'Snapshot', description: 'Первый снапшот с появлением пчёл, ульев и блоков мёда' },
      { id: '1.15', label: '1.15', category: 'release', coverImage: '/version_covers/cover_1_15.svg', blockIcon: '/minecraft_textures/honey_block.png', majorGroup: '1.15 Series', description: 'Buzzy Bees (Блок мёда, пчелы, ульи)' },
    ]
  },
  {
    group: 'Линейка 1.14 (Village & Pillage & Combat Tests)',
    items: [
      { id: 'Combat Test 8c', label: 'Combat Test 8c', category: 'snapshot', badge: 'Тест Jeb', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/diamond_sword.png', majorGroup: 'Combat Test', description: 'Финальный тест боевой системы: дальность атаки, щиты' },
      { id: 'Combat Test 7c', label: 'Combat Test 7c', category: 'snapshot', badge: 'Тест Jeb', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/diamond_sword.png', majorGroup: 'Combat Test', description: 'Тест задержки ударов и спринт-атак' },
      { id: 'Combat Test 4', label: 'Combat Test 4', category: 'snapshot', badge: 'Тест Jeb', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/bow.png', majorGroup: 'Combat Test', description: 'Эксперимент с заряжанием луков и броском трезубца' },
      { id: 'Combat Test 1', label: 'Combat Test 1 (2019)', category: 'snapshot', badge: 'Тест Jeb', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/diamond_sword.png', majorGroup: 'Combat Test', description: 'Самый первый эксперимент отмены кулдауна удара' },
      { id: '3D Shareware v1.34', label: '3D Shareware v1.34 (2019)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/gold_block.png', majorGroup: 'April Fools', description: 'Ретро-шутер 90-х в стиле DOOM и Wolfenstein' },
      { id: '1.14.4', label: '1.14.4', category: 'release', coverImage: '/version_covers/cover_1_14.svg', blockIcon: '/minecraft_textures/emerald_block.png', majorGroup: '1.14 Series', description: 'Финальный стабильный релиз деревень' },
      { id: '1.14.3', label: '1.14.3', category: 'release', coverImage: '/version_covers/cover_1_14.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: '1.14 Series', description: 'Баланс патрулей и жителей' },
      { id: '1.14.2', label: '1.14.2', category: 'release', coverImage: '/version_covers/cover_1_14.svg', blockIcon: '/minecraft_textures/sea_lantern.png', majorGroup: '1.14 Series', description: 'Исправления света и оптимизация' },
      { id: '1.14.1', label: '1.14.1', category: 'release', coverImage: '/version_covers/cover_1_14.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.14 Series', description: 'Хотфикс стабильности и производительности' },
      { id: '1.14-pre5', label: '1.14-pre5', category: 'snapshot', badge: 'Pre-release', coverImage: '/version_covers/cover_1_14.svg', blockIcon: '/minecraft_textures/emerald.png', majorGroup: 'Pre-release', description: 'Пре-релиз Village & Pillage с фиксом жителей' },
      { id: '1.14', label: '1.14', category: 'release', coverImage: '/version_covers/cover_1_14.svg', blockIcon: '/minecraft_textures/emerald.png', majorGroup: '1.14 Series', description: 'Village & Pillage (Изумруды, рейды, профессии)' },
    ]
  },
  {
    group: 'Линейка 1.13 (Update Aquatic)',
    items: [
      { id: '1.13.2', label: '1.13.2', category: 'release', coverImage: '/version_covers/cover_1_13.svg', blockIcon: '/minecraft_textures/heart_of_the_sea.png', majorGroup: '1.13 Series', description: 'Стабилизация водного мира' },
      { id: '1.13.1', label: '1.13.1', category: 'release', coverImage: '/version_covers/cover_1_13.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.13 Series', description: 'Хотфикс оптимизации океанов' },
      { id: '1.13', label: '1.13', category: 'release', coverImage: '/version_covers/cover_1_13.svg', blockIcon: '/minecraft_textures/trident.png', majorGroup: '1.13 Series', description: 'Update Aquatic (Сердце моря, трезубец, океаны)' },
    ]
  },
  {
    group: 'Классические версии (1.0 – 1.12)',
    items: [
      { id: '1.12.2', label: '1.12.2', category: 'release', coverImage: '/version_covers/cover_1_12.svg', blockIcon: '/minecraft_textures/glazed_terracotta.png', majorGroup: '1.12 & Legacy', description: 'Золотой стандарт моддинга Forge' },
      { id: '1.12.1', label: '1.12.1', category: 'release', coverImage: '/version_covers/cover_1_12.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.12 & Legacy', description: 'Хотфикс книги рецептов и оптимизация' },
      { id: '1.12', label: '1.12', category: 'release', coverImage: '/version_covers/cover_1_12.svg', blockIcon: '/minecraft_textures/cyan_concrete.png', majorGroup: '1.12 & Legacy', description: 'World of Color Update (Глазурованная керамика, бетон)' },
      { id: '1.11.2', label: '1.11.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/totem_of_undying.png', majorGroup: '1.12 & Legacy', description: 'Exploration Update (Тотем бессмертия, шалкеры)' },
      { id: '1.11.1', label: '1.11.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/elytra.png', majorGroup: '1.12 & Legacy', description: 'Ракеты для элитр и железные самородки' },
      { id: '1.11', label: '1.11', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/compass.png', majorGroup: '1.12 & Legacy', description: 'Exploration Update (Карты сокровищ, ламы)' },
      { id: '1.10.2', label: '1.10.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/magma.png', majorGroup: '1.12 & Legacy', description: 'Frostburn Update (Блок магмы, белые медведи)' },
      { id: '1.10.1', label: '1.10.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.12 & Legacy', description: 'Исправления мобов и оптимизация' },
      { id: '1.10', label: '1.10', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/blue_ice.png', majorGroup: '1.12 & Legacy', description: 'Frostburn Update (Полярные биомы, зимогоры)' },
      { id: '1.9.4', label: '1.9.4', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/elytra.png', majorGroup: '1.12 & Legacy', description: 'Combat Update финал (Элитры, щиты, бой)' },
      { id: '1.9.3', label: '1.9.3', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: '1.12 & Legacy', description: 'Исправления утечек памяти' },
      { id: '1.9.2', label: '1.9.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/redstone.png', majorGroup: '1.12 & Legacy', description: 'Хотфикс подключения к серверам' },
      { id: '1.9.1', label: '1.9.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: '1.12 & Legacy', description: 'Баланс щитов и надкрылий' },
      { id: '1.9', label: '1.9', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/diamond_sword.png', majorGroup: '1.12 & Legacy', description: 'Combat Update (Вторая рука, кулдаун удара)' },
      { id: '1.RV-Pre1', label: '1.RV-Pre1 (2016)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/clock.png', majorGroup: 'April Fools', description: 'The Trendy Update (VR-очки, смарт-часы, USB)' },
      { id: '1.8.9', label: '1.8.9', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/diamond_sword.png', majorGroup: 'PvP Legacy', description: 'Стандарт соревновательного PvP Hypixel' },
      { id: '1.8.8', label: '1.8.8', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/barrier.png', majorGroup: 'PvP Legacy', description: 'Хотфикс безопасности серверов' },
      { id: '1.8.7', label: '1.8.7', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'PvP Legacy', description: 'Исправления крашей безопасности' },
      { id: '1.8.6', label: '1.8.6', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'PvP Legacy', description: 'Патч критических уязвимостей' },
      { id: '1.8.5', label: '1.8.5', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/gold_block.png', majorGroup: 'PvP Legacy', description: 'Патч проверки прав доступа' },
      { id: '1.8.4', label: '1.8.4', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/redstone_torch.png', majorGroup: 'PvP Legacy', description: 'Исправления эксплойтов' },
      { id: '1.8.3', label: '1.8.3', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/clock.png', majorGroup: 'PvP Legacy', description: 'Исправление сохранения чанков' },
      { id: '1.8.2', label: '1.8.2', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/compass.png', majorGroup: 'PvP Legacy', description: 'Оптимизация физики мобов' },
      { id: '1.8.1', label: '1.8.1', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/prismarine_shard.png', majorGroup: 'PvP Legacy', description: 'Оптимизация рендера и VBO' },
      { id: '1.8-pre1', label: '1.8-pre1', category: 'snapshot', badge: 'Pre-release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/barrier.png', majorGroup: 'Pre-release', description: 'Первый публичный пре-релиз Bountiful Update' },
      { id: '1.8', label: '1.8', category: 'release', coverImage: '/version_covers/cover_1_8.svg', blockIcon: '/minecraft_textures/prismarine.png', majorGroup: 'PvP Legacy', description: 'Bountiful Update (Призмарин, монументы)' },
      { id: '15w14a', label: '15w14a (2015)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cherry_leaves.png', majorGroup: 'April Fools', description: 'The Love and Hugs Update (Мир без урона, шкала любви)' },
      { id: '1.7.10', label: '1.7.10', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/diamond_pickaxe.png', majorGroup: 'Old Mods', description: 'Культовая эра индустриальных сборок' },
      { id: '1.7.9', label: '1.7.9', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/clock.png', majorGroup: 'Old Mods', description: 'Подготовка к смене скинов и ников' },
      { id: '1.7.8', label: '1.7.8', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/ender_eye.png', majorGroup: 'Old Mods', description: 'Переход на UUID игроков' },
      { id: '1.7.7', label: '1.7.7', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'Old Mods', description: 'Исправления совместимости серверов' },
      { id: '1.7.6', label: '1.7.6', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/writable_book.png', majorGroup: 'Old Mods', description: 'Тесты системы профилей UUID' },
      { id: '1.7.5', label: '1.7.5', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/gold_block.png', majorGroup: 'Old Mods', description: 'Оптимизация серверной части для Realms' },
      { id: '1.7.4', label: '1.7.4', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/cyan_concrete.png', majorGroup: 'Old Mods', description: 'Интеграция стримов Twitch' },
      { id: '1.7.3', label: '1.7.3', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'Old Mods', description: 'Хотфиксы рендера и стабильности' },
      { id: '1.7.2', label: '1.7.2', category: 'release', coverImage: '/version_covers/cover_1_7.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Old Mods', description: 'The Update That Changed The World (Биомы)' },
      { id: '1.6.4', label: '1.6.4', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/saddle.png', majorGroup: 'Old Mods', description: 'Horse Update финал (сохранение структур)' },
      { id: '1.6.2', label: '1.6.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/golden_apple.png', majorGroup: 'Old Mods', description: 'Хотфикс приручения лошадей' },
      { id: '1.6.1', label: '1.6.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/saddle.png', majorGroup: 'Old Mods', description: 'Horse Update (Лошади, седло, поводок)' },
      { id: '1.5.2', label: '1.5.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/redstone_block.png', majorGroup: 'Old Mods', description: 'Redstone Update финал (стабильный моддинг)' },
      { id: '1.5.1', label: '1.5.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'Old Mods', description: 'Хотфикс производительности редстоуна' },
      { id: '1.5', label: '1.5', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/redstone.png', majorGroup: 'Old Mods', description: 'Redstone Update (Редстоун, компаратор)' },
      { id: '2.0', label: 'Minecraft 2.0 (2013)', category: 'snapshot', badge: '1 Апреля', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/tnt.png', majorGroup: 'April Fools', description: 'Факелы тухнут, розовый иссушитель, враждебные курицы' },
      { id: '1.4.7', label: '1.4.7', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'Old Mods', description: 'Pretty Scary Update финал (Наковальня, Иссушитель)' },
      { id: '1.4.6', label: '1.4.6', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/tnt.png', majorGroup: 'Old Mods', description: 'Новогодний фейерверк и зачарованные книги' },
      { id: '1.4.5', label: '1.4.5', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/sea_lantern.png', majorGroup: 'Old Mods', description: 'Хотфикс освещения и рендера' },
      { id: '1.4.4', label: '1.4.4', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'Old Mods', description: 'Исправления багов и оптимизация' },
      { id: '1.4.2', label: '1.4.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/sponge.png', majorGroup: 'Old Mods', description: 'Pretty Scary Update (Ведьмы, летучие мыши)' },
      { id: '1.3.2', label: '1.3.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/emerald_block.png', majorGroup: 'Old Mods', description: 'Торговля с жителями и изумруды' },
      { id: '1.3.1', label: '1.3.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/emerald.png', majorGroup: 'Old Mods', description: 'Объединение одиночного и сетевого движков' },
      { id: '1.2.5', label: '1.2.5', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/jungle_log.png', majorGroup: 'Old Mods', description: 'Джунгли, оцелоты, железный голем' },
      { id: '1.2.4', label: '1.2.4', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/writable_book.png', majorGroup: 'Old Mods', description: 'Исправления чата и шрифтов' },
      { id: '1.2.3', label: '1.2.3', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Old Mods', description: 'Исправления спавна мобов' },
      { id: '1.2.2', label: '1.2.2', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/dirt.png', majorGroup: 'Old Mods', description: 'Исправления генерации берез' },
      { id: '1.2.1', label: '1.2.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/jungle_log.png', majorGroup: 'Old Mods', description: 'Добавление биома Джунглей' },
      { id: '12w07a', label: '12w07a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'Snapshot', description: 'Первое появление Железного голема и спавнеров жителей' },
      { id: '1.1', label: '1.1', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Release', description: 'Добавление суперплоского типа мира' },
      { id: '1.0.0', label: '1.0.0', category: 'release', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/ender_eye.png', majorGroup: 'Release', description: 'Официальный релиз Minecraft (Око Эндера, Дракон)' },
      { id: '11w49a', label: '11w49a', category: 'snapshot', badge: 'Снапшот', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Snapshot', description: 'Первый снапшот с овцами, отращивающими шерсть от травы' },
    ]
  },

  // ==========================================
  // 2. РАННИЕ ВЕРСИИ И ИСТОРИЧЕСКИЕ СБОРКИ (ANCIENT)
  // ==========================================
  {
    group: 'Beta (2010–2011)',
    category: 'ancient',
    items: [
      { id: 'b1.8.1', label: 'Beta 1.8.1 (Adventure Update)', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/bow.png', majorGroup: 'Beta', description: 'Шкала голода, спринт, криты, деревни и крепости' },
      { id: 'b1.8', label: 'Beta 1.8', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/bow.png', majorGroup: 'Beta', description: 'Adventure Update pre-release' },
      { id: 'b1.7.3', label: 'Beta 1.7.3 (Golden Era)', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/piston.png', majorGroup: 'Beta', description: 'Культовый пик бета-эры: поршни, старая боевая система и генерация' },
      { id: 'b1.7.2', label: 'Beta 1.7.2', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/piston.png', majorGroup: 'Beta', description: 'Исправления поршней' },
      { id: 'b1.7', label: 'Beta 1.7', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/piston.png', majorGroup: 'Beta', description: 'Добавление липких и обычных поршней, ножниц' },
      { id: 'b1.6.6', label: 'Beta 1.6.6', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Beta', description: 'Появление травы в виде блока и исправление костной муки' },
      { id: 'b1.6.5', label: 'Beta 1.6.5', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'Beta', description: 'Исправления серверной синхронизации' },
      { id: 'b1.6.4', label: 'Beta 1.6.4', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'Beta', description: 'Хотфикс печей и крафтов' },
      { id: 'b1.6.3', label: 'Beta 1.6.3', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/dirt.png', majorGroup: 'Beta', description: 'Исправления сетевого кода' },
      { id: 'b1.6.2', label: 'Beta 1.6.2', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Исправления утечек ресурсов' },
      { id: 'b1.6.1', label: 'Beta 1.6.1', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Beta', description: 'Срочный хотфикс рендера' },
      { id: 'b1.6', label: 'Beta 1.6', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Beta', description: 'Добавление карт, люков и травы' },
      { id: 'b1.5_01', label: 'Beta 1.5_01', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/magma.png', majorGroup: 'Beta', description: 'Появление дождя, грозы, березы и сосны' },
      { id: 'b1.5', label: 'Beta 1.5', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/weather_rain.png', majorGroup: 'Beta', description: 'Погода: дождь, снегопад, гроза и рельсы с ускорением' },
      { id: 'b1.4_01', label: 'Beta 1.4_01', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'Beta', description: 'Исправление краша с кроватями' },
      { id: 'b1.4', label: 'Beta 1.4', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cookie.png', majorGroup: 'Beta', description: 'Добавление волков, печенья и какао-бобов' },
      { id: 'b1.3_01', label: 'Beta 1.3_01', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/redstone_torch.png', majorGroup: 'Beta', description: 'Хотфикс освещения' },
      { id: 'b1.3b', label: 'Beta 1.3b', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/bed.png', majorGroup: 'Beta', description: 'Серверная сборка Beta 1.3' },
      { id: 'b1.3', label: 'Beta 1.3', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/bed.png', majorGroup: 'Beta', description: 'Добавление кроватей, повторителей и гладкого освещения' },
      { id: 'b1.2_02', label: 'Beta 1.2_02', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Исправления мобов и спавна' },
      { id: 'b1.2_01', label: 'Beta 1.2_01', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/charcoal.png', majorGroup: 'Beta', description: 'Хотфикс крафта древесного угля' },
      { id: 'b1.2', label: 'Beta 1.2', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/lapis_block.png', majorGroup: 'Beta', description: 'Лазурит, песчаник, кальмары, раздатчик и нотный блок' },
      { id: 'b1.1_02', label: 'Beta 1.1_02', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Фикс инвентаря и чата' },
      { id: 'b1.1_01', label: 'Beta 1.1_01', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Хотфикс скинов' },
      { id: 'b1.0.2', label: 'Beta 1.0.2', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Исправление загрузки чанков' },
      { id: 'b1.0_01', label: 'Beta 1.0_01', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Хотфикс первой беты' },
      { id: 'b1.0', label: 'Beta 1.0 (20 декабря 2010)', category: 'ancient', badge: 'Beta', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Beta', description: 'Первый официальный релиз этапа Beta: яйца призыва и серверы' },
    ]
  },
  {
    group: 'Alpha (2010)',
    category: 'ancient',
    items: [
      { id: 'a1.2.6', label: 'Alpha 1.2.6', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Alpha', description: 'Финальный стабильный билд Alpha до перехода на Beta' },
      { id: 'a1.2.5', label: 'Alpha 1.2.5', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'Alpha', description: 'Исправление багов инвентаря и сетевой игры' },
      { id: 'a1.2.4_01', label: 'Alpha 1.2.4_01', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/anvil.png', majorGroup: 'Alpha', description: 'Хотфикс сетевого соединения' },
      { id: 'a1.2.3_04', label: 'Alpha 1.2.3_04', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Alpha', description: 'Оптимизация рендера чанков' },
      { id: 'a1.2.3_02', label: 'Alpha 1.2.3_02', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Alpha', description: 'Исправление графических глитчей' },
      { id: 'a1.2.3_01', label: 'Alpha 1.2.3_01', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Alpha', description: 'Хотфикс генерации порталов' },
      { id: 'a1.2.3', label: 'Alpha 1.2.3', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherrack.png', majorGroup: 'Alpha', description: 'Исправления генерации Незера' },
      { id: 'a1.2.2b', label: 'Alpha 1.2.2b', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherrack.png', majorGroup: 'Alpha', description: 'Хотфикс серверов Незера' },
      { id: 'a1.2.2a', label: 'Alpha 1.2.2a', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherrack.png', majorGroup: 'Alpha', description: 'Патч синхронизации здоровья' },
      { id: 'a1.2.1_01', label: 'Alpha 1.2.1_01', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Alpha', description: 'Исправление звуков гастов' },
      { id: 'a1.2.1', label: 'Alpha 1.2.1', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherite_block.png', majorGroup: 'Alpha', description: 'Хотфикс спавна ифритов и лавы' },
      { id: 'a1.2.0_02', label: 'Alpha 1.2.0_02', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherrack.png', majorGroup: 'Alpha', description: 'Хотфикс Halloween Update' },
      { id: 'a1.2.0_01', label: 'Alpha 1.2.0_01', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherrack.png', majorGroup: 'Alpha', description: 'Патч текстур адского камня' },
      { id: 'a1.2.0', label: 'Alpha 1.2.0 (Halloween Update)', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/netherite_block.png', majorGroup: 'Alpha', description: 'Первое появление Нижнего мира (Незер), гастов и ифритов' },
      { id: 'a1.1.2_01', label: 'Alpha 1.1.2_01', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Alpha', description: 'Классическая ностальгическая версия Alpha с яркой неоновой травой' },
      { id: 'a1.1.2', label: 'Alpha 1.1.2', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/grass_block.png', majorGroup: 'Alpha', description: 'Стабилизация дыма и звуков' },
      { id: 'a1.1.0', label: 'Alpha 1.1.0', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/compass.png', majorGroup: 'Alpha', description: 'Добавление компаса' },
      { id: 'a1.0.17_04', label: 'Alpha 1.0.17_04', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/fence.png', majorGroup: 'Alpha', description: 'Seecret Friday 10: добавление заборов и снеговиков' },
      { id: 'a1.0.17_02', label: 'Alpha 1.0.17_02', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/fence.png', majorGroup: 'Alpha', description: 'Seecret Friday 10 пре-релиз' },
      { id: 'a1.0.16', label: 'Alpha 1.0.16', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/iron_block.png', majorGroup: 'Alpha', description: 'Исправления сетевого инвентаря' },
      { id: 'a1.0.15', label: 'Alpha 1.0.15', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/sponge.png', majorGroup: 'Alpha', description: 'Seecret Friday 9: кактусы и лодки' },
      { id: 'a1.0.14', label: 'Alpha 1.0.14 (Seecret Friday)', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/sponge.png', majorGroup: 'Alpha', description: 'Секретное пятничное обновление: появление лодок и куриц' },
      { id: 'a1.0.11', label: 'Alpha 1.0.11', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/dirt.png', majorGroup: 'Alpha', description: 'Seecret Friday 7: добавление гравия и кремня' },
      { id: 'a1.0.5_01', label: 'Alpha 1.0.5_01', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/redstone.png', majorGroup: 'Alpha', description: 'Хотфикс редстоун-цепей' },
      { id: 'a1.0.4', label: 'Alpha 1.0.4', category: 'ancient', badge: 'Alpha', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/redstone.png', majorGroup: 'Alpha', description: 'Первое появление редстоуна, дверей и кнопок в игре' },
    ]
  },
  {
    group: 'Infdev & Indev (Бесконечные миры и крафт, 2010)',
    category: 'ancient',
    items: [
      { id: 'inf-20100618', label: 'inf-20100618', category: 'ancient', badge: 'Infdev', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Infdev', description: 'Infdev: Полноценная бесконечная процедурная генерация 3D-мира' },
      { id: 'inf-20100327', label: 'inf-20100327', category: 'ancient', badge: 'Infdev', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/dirt.png', majorGroup: 'Infdev', description: 'Самый первый билд с бесконечной картой вместо ограниченного куба' },
      { id: 'in-20100223', label: 'in-20100223', category: 'ancient', badge: 'Indev', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/dirt.png', majorGroup: 'Indev', description: 'Indev: Появление факелов, крафта 3x3 и динамического освещения' },
      { id: 'in-20091223-1', label: 'in-20091223-1', category: 'ancient', badge: 'Indev', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/brick.png', majorGroup: 'Indev', description: 'Самый первый билд фазы Indev (В разработке)' },
    ]
  },
  {
    group: 'Classic & Pre-Classic (2009)',
    category: 'ancient',
    items: [
      { id: 'c0.30_01c', label: 'c0.30_01c', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Classic', description: 'Культовый финал фазы Classic (Survival Test)' },
      { id: 'c0.28', label: 'c0.28 (Creative mode)', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/sponge.png', majorGroup: 'Classic', description: 'Классический креатив с губками и неограниченными блоками' },
      { id: 'c0.0.15a', label: 'c0.0.15a (Multiplayer test)', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Classic', description: 'Самый первый в истории многопользовательский тест Minecraft' },
      { id: 'c0.0.14a_08', label: 'c0.0.14a_08', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Classic', description: 'Ранний классический билд от мая 2009 года' },
      { id: 'c0.0.13a_03', label: 'c0.0.13a_03', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Classic', description: 'Тест разрушения и установки блоков' },
      { id: 'c0.0.13a', label: 'c0.0.13a', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Classic', description: 'Ранний классический тест генерации' },
      { id: 'c0.0.11a', label: 'c0.0.11a', category: 'ancient', badge: 'Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Classic', description: 'Появление песка и гравия' },
      { id: 'rd-161348', label: 'rd-161348', category: 'ancient', badge: 'Pre-Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Pre-Classic', description: 'Ранний тест физики падения и столкновений с блоками' },
      { id: 'rd-160052', label: 'rd-160052', category: 'ancient', badge: 'Pre-Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Pre-Classic', description: 'Ранний тест рендеринга человечков' },
      { id: 'rd-20090515', label: 'rd-20090515', category: 'ancient', badge: 'Pre-Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Pre-Classic', description: 'Билд Pre-Classic от 15 мая 2009 года' },
      { id: 'rd-132328', label: 'rd-132328', category: 'ancient', badge: 'Pre-Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Pre-Classic', description: 'Тест генерации пещерного мира' },
      { id: 'rd-132211', label: 'rd-132211 (Cave Game)', category: 'ancient', badge: 'Pre-Classic', coverImage: '/version_covers/cover_classic.svg', blockIcon: '/minecraft_textures/cobblestone.png', majorGroup: 'Pre-Classic', description: 'Самая ранняя доступная версия (13 мая 2009, оригинальный прототип Нотча)' },
    ]
  }
];

export const ALL_VERSION_ITEMS: VersionItem[] = VERSION_GROUPS.flatMap((g) => g.items);

export const MOD_LOADERS: ModLoader[] = ['Fabric', 'Forge', 'NeoForge', 'Vanilla', 'ELauncher'];

export const LOADER_METADATA: Record<ModLoader, { name: string; icon: string; brandColor: string }> = {
  ELauncher: {
    name: 'ELauncher',
    icon: '/loaders/elauncher.png',
    brandColor: '#38bdf8',
  },
  NeoForge: {
    name: 'NeoForge',
    icon: '/loaders/neoforge.svg',
    brandColor: '#E86518',
  },
  Fabric: {
    name: 'Fabric',
    icon: '/loaders/fabric.png',
    brandColor: '#B0BEC5',
  },
  Forge: {
    name: 'Forge',
    icon: '/loaders/forge.png',
    brandColor: '#FFA726',
  },
  Vanilla: {
    name: 'Vanilla',
    icon: '/loaders/vanilla.svg',
    brandColor: '#7CB342',
  },
};

/**
 * Returns the list of mod loaders supported by the given version:
 * - ELauncher is available everywhere as our custom enhanced launcher runtime.
 * - ALL Snapshots, Release Candidates, Pre-releases, April Fools, Combat Tests: Vanilla & ELauncher.
 * - Ancient builds (Beta, Alpha, Infdev, Classic): Vanilla & ELauncher.
 * - 1.2.5 – 1.12.2: Forge, Vanilla, ELauncher.
 * - 1.14 – 1.20.1: Fabric, Forge, Vanilla, ELauncher.
 * - 1.20.2 – 1.21.x: Fabric, NeoForge, Forge, Vanilla, ELauncher.
 * - 2026 Drops: Fabric, NeoForge, Forge, Vanilla, ELauncher.
 */
export function getSupportedLoaders(versionId: string, category: VersionTypeCategory): ModLoader[] {
  // На любых снапшотах, пре-релизах, экспериментах и древних версиях — Vanilla и ELauncher
  if (category === 'snapshot' || category === 'ancient') {
    return ['Vanilla', 'ELauncher'];
  }

  const isSpecialOrSnapshot =
    versionId.includes('-rc') ||
    versionId.includes('-pre') ||
    /\d{2}w\d{2}/.test(versionId) ||
    versionId.startsWith('rd-') ||
    versionId.startsWith('c0.') ||
    versionId.startsWith('in-') ||
    versionId.startsWith('inf-') ||
    versionId.startsWith('a1.') ||
    versionId.startsWith('b1.') ||
    versionId.toLowerCase().includes('combat test') ||
    versionId.toLowerCase().includes('shareware') ||
    versionId.toLowerCase().includes('minecraft 2.0');

  if (isSpecialOrSnapshot) {
    return ['Vanilla', 'ELauncher'];
  }

  // 2026 Drops (26.x): Fabric, NeoForge, Vanilla, ELauncher
  if (versionId.startsWith('26.')) {
    return ['Fabric', 'NeoForge', 'Vanilla', 'ELauncher'];
  }

  // Линейка 1.21.x: Fabric, NeoForge, Vanilla, ELauncher
  if (versionId.startsWith('1.21')) {
    return ['Fabric', 'NeoForge', 'Vanilla', 'ELauncher'];
  }

  // Линейка 1.20.x:
  if (versionId.startsWith('1.20')) {
    // 1.20 и 1.20.1 — классический Forge, Fabric, Vanilla, ELauncher
    if (versionId === '1.20' || versionId === '1.20.1') {
      return ['Fabric', 'Forge', 'Vanilla', 'ELauncher'];
    }
    // 1.20.2 - 1.20.6 — произошел раскол Forge -> NeoForge
    return ['Fabric', 'NeoForge', 'Forge', 'Vanilla', 'ELauncher'];
  }

  // Линейки 1.14 - 1.19.x: Fabric + Forge + Vanilla + ELauncher
  const match = versionId.match(/^1\.(\d+)/);
  if (match) {
    const minor = parseInt(match[1], 10);
    if (minor >= 14) {
      return ['Fabric', 'Forge', 'Vanilla', 'ELauncher'];
    }
    // Линейки 1.2.5 - 1.13.2: Forge, Vanilla, ELauncher
    if (minor >= 2 && minor <= 13) {
      return ['Forge', 'Vanilla', 'ELauncher'];
    }
  }

  // Все старые релизы до 1.2.5 (1.0.0, 1.1) — Vanilla и ELauncher
  return ['Vanilla', 'ELauncher'];
}
