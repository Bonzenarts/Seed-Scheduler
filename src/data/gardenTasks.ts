import { GardenTask } from '../types';

export const gardenTasks: GardenTask[] = [
  // Planning Tasks
  {
    id: 'plan-next-season',
    name: 'Plan Next Season\'s Crops',
    description: 'Plan next season\'s crops; clean and repair tools; check seed inventory',
    category: 'Planning'
  },
  {
    id: 'seed-ordering',
    name: 'Order Seeds and Potatoes',
    description: 'Order seeds and potatoes for chitting',
    category: 'Planning'
  },
  {
    id: 'crop-rotation',
    name: 'Crop Rotation Planning',
    description: 'Plan next season\'s crop rotation',
    category: 'Planning'
  },
  {
    id: 'seed-inventory',
    name: 'Seed Inventory Check',
    description: 'Check and organize seed inventory',
    category: 'Planning'
  },
  
  // Maintenance Tasks
  {
    id: 'soil-preparation',
    name: 'Soil Preparation',
    description: 'Prepare soil for sowing; add compost or manure as needed',
    category: 'Maintenance'
  },
  {
    id: 'pruning',
    name: 'Pruning',
    description: 'Prune trees, shrubs, and perennial plants',
    category: 'Maintenance'
  },
  {
    id: 'fruit-tree-pruning',
    name: 'Fruit Tree Pruning',
    description: 'Prune apple and pear trees; check overwintering crops',
    category: 'Maintenance'
  },
  {
    id: 'greenhouse-cleaning',
    name: 'Greenhouse Cleaning',
    description: 'Clean out greenhouses; ensure pots and trays are ready for spring sowing',
    category: 'Maintenance'
  },
  {
    id: 'compost-maintenance',
    name: 'Compost Maintenance',
    description: 'Prepare compost heaps; spread manure on empty beds',
    category: 'Maintenance'
  },
  {
    id: 'winter-maintenance',
    name: 'Winter Maintenance',
    description: 'Force rhubarb; check stored vegetables for rot',
    category: 'Maintenance'
  },
  {
    id: 'mulching',
    name: 'Mulching',
    description: 'Apply mulch to retain moisture and suppress weeds',
    category: 'Maintenance'
  },
  {
    id: 'weeding',
    name: 'Weeding',
    description: 'Remove weeds and unwanted plants',
    category: 'Maintenance'
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    description: 'Monitor and manage pests using organic methods',
    category: 'Maintenance'
  },

  // Planting Tasks
  {
    id: 'early-sowing',
    name: 'Early Sowing',
    description: 'Sow early crops under cover (e.g., lettuce, broad beans)',
    category: 'Planting'
  },
  {
    id: 'indoor-sowing',
    name: 'Indoor Sowing',
    description: 'Sow chillies, peppers, tomatoes, aubergines, and early brassicas indoors',
    category: 'Planting'
  },
  {
    id: 'potato-preparation',
    name: 'Potato Preparation',
    description: 'Chit potatoes; plant first early potatoes under cover',
    category: 'Planting'
  },
  {
    id: 'early-outdoor-sowing',
    name: 'Early Outdoor Sowing',
    description: 'Sow early carrots, spinach, and radishes outdoors if soil is warm enough',
    category: 'Planting'
  },
  {
    id: 'succession-sowing',
    name: 'Succession Sowing',
    description: 'Sow succession crops like lettuce, radishes, and beans',
    category: 'Planting'
  },

  // Protection Tasks
  {
    id: 'frost-protection',
    name: 'Frost Protection',
    description: 'Protect tender plants from frost with fleece or cloches',
    category: 'Protection'
  },
  {
    id: 'greenhouse-ventilation',
    name: 'Greenhouse Ventilation',
    description: 'Clear snow from greenhouse roofs; ensure good ventilation',
    category: 'Protection'
  },
  {
    id: 'winter-protection',
    name: 'Winter Protection',
    description: 'Mulch perennial crops for winter protection',
    category: 'Protection'
  },

  // Equipment Tasks
  {
    id: 'tool-maintenance',
    name: 'Tool Maintenance',
    description: 'Clean, sharpen, and maintain gardening tools',
    category: 'Equipment'
  },
  {
    id: 'irrigation-setup',
    name: 'Irrigation Setup',
    description: 'Set up or maintain irrigation systems',
    category: 'Equipment'
  },
  {
    id: 'structure-maintenance',
    name: 'Structure Maintenance',
    description: 'Check and repair garden structures, raised beds, and supports',
    category: 'Equipment'
  }
];