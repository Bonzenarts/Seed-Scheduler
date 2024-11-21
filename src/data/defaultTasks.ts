import { DefaultTask, Season } from '../types';

export const seasons: Season[] = [
  'winter',
  'early-spring',
  'spring',
  'early-summer',
  'summer',
  'late-summer',
  'autumn',
  'early-winter'
];

export const seasonMonths: Record<Season, number[]> = {
  'winter': [1, 2],
  'early-spring': [3, 4],
  'spring': [4, 5],
  'early-summer': [6],
  'summer': [7, 8],
  'late-summer': [9],
  'autumn': [10, 11],
  'early-winter': [12]
};

export const defaultTasks: DefaultTask[] = [
  // Winter (January – February)
  {
    id: 'plan-next-season',
    name: 'Plan Next Season\'s Crops',
    description: 'Plan next season\'s crops; clean and repair tools; check seed inventory',
    week: 1,
    season: 'winter'
  },
  {
    id: 'fruit-tree-pruning',
    name: 'Fruit Tree Pruning',
    description: 'Prune apple and pear trees; check overwintering crops',
    week: 2,
    season: 'winter'
  },
  {
    id: 'greenhouse-cleaning',
    name: 'Greenhouse Cleaning',
    description: 'Clean out greenhouses; ensure pots and trays are ready for spring sowing',
    week: 3,
    season: 'winter'
  },
  {
    id: 'seed-ordering',
    name: 'Order Seeds and Potatoes',
    description: 'Order seeds and potatoes for chitting',
    week: 4,
    season: 'winter'
  },
  {
    id: 'early-sowing',
    name: 'Early Sowing',
    description: 'Sow early crops under cover (e.g., lettuce, broad beans)',
    week: 5,
    season: 'winter'
  },
  {
    id: 'compost-maintenance',
    name: 'Compost Maintenance',
    description: 'Prepare compost heaps; spread manure on empty beds',
    week: 6,
    season: 'winter'
  },
  {
    id: 'winter-maintenance',
    name: 'Winter Maintenance',
    description: 'Force rhubarb; check stored vegetables for rot',
    week: 7,
    season: 'winter'
  },
  {
    id: 'indoor-sowing',
    name: 'Indoor Sowing',
    description: 'Sow chillies and peppers indoors',
    week: 8,
    season: 'winter'
  },
];