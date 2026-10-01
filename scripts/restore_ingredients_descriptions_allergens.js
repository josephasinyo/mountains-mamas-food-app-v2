const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

const ingredientsData = [
  // Breads
  {
    name: 'French Bread',
    description: 'Mountain Mama’s signature homemade French bread with a crisp golden crust and soft, airy interior.',
    allergens: ['wheat', 'gluten']
  },
  {
    name: 'White Sandwich Bread',
    description: 'Classic soft white artisan sandwich bread baked fresh daily.',
    allergens: ['wheat', 'gluten', 'dairy']
  },
  {
    name: 'Herby Focaccia',
    description: 'Aromatic Italian focaccia bread infused with extra virgin olive oil, rosemary, and sea salt flakes.',
    allergens: ['wheat', 'gluten', 'vegetarian']
  },
  {
    name: 'Seedy Whole Grain Focaccia',
    description: 'Hearty whole grain focaccia topped with toasted pumpkin seeds, rolled oats, and sesame seeds.',
    allergens: ['wheat', 'gluten', 'vegetarian']
  },
  {
    name: 'Fresh Croissant',
    description: 'Flaky, buttery French-style artisan croissant with delicate golden layers.',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian']
  },
  {
    name: 'Regular Tortilla Wrap',
    description: 'Traditional soft flour tortilla wrap, freshly pressed and pliable.',
    allergens: ['wheat', 'gluten', 'vegetarian']
  },
  {
    name: 'Gluten-Free Rustic Rosemary Loaf',
    description: 'Artisan gluten-free loaf baked with fresh aromatic rosemary and herbs.',
    allergens: ['gluten_free', 'vegetarian']
  },
  {
    name: 'Gluten-Free Tortilla Wrap',
    description: 'Soft gluten-free tortilla wrap, perfect for allergen-sensitive and gluten-free diets.',
    allergens: ['gluten_free', 'vegetarian']
  },
  {
    name: 'Sour Dough Bread',
    description: 'Traditional artisan sourdough bread with a crispy crust and classic tangy flavor.',
    allergens: ['wheat', 'gluten', 'vegetarian']
  },
  {
    name: 'Seedy Wheat Bread',
    description: 'Hearty whole wheat bread loaded with wholesome toasted seeds and grains.',
    allergens: ['wheat', 'gluten', 'vegetarian']
  },
  {
    name: 'Deli Sliced Wheat',
    description: 'Classic deli-style thinly sliced whole wheat bread.',
    allergens: ['wheat', 'gluten', 'vegetarian']
  },

  // Cookies
  {
    name: 'Chocolate Chip Cookie',
    description: 'Classic bakery-fresh cookie packed with rich, melted semi-sweet chocolate chips.',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian']
  },
  {
    name: 'Oatmeal Raisin Cookie',
    description: 'Chewy whole-grain rolled oats blended with sweet plump raisins and a hint of cinnamon.',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian']
  },
  {
    name: 'Salted Caramel Cookie',
    description: 'Decadent gourmet cookie featuring gooey caramel pockets topped with sea salt flakes.',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian']
  },
  {
    name: 'Lemon Blueberry Cookie',
    description: 'Bright, zesty lemon cookie studded with real blueberries and sparkling sugar.',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian']
  },
  {
    name: 'Gluten-Free Brownie',
    description: 'Rich, fudgy gluten-free chocolate brownie with a deep cocoa flavor.',
    allergens: ['gluten_free', 'dairy', 'egg', 'vegetarian']
  },
  {
    name: 'Gluten-Free Granola Bar',
    description: 'Wholesome crunchy granola bar loaded with toasted seeds, honey, and gluten-free rolled oats.',
    allergens: ['gluten_free', 'vegetarian']
  },
  {
    name: 'Homemade Cookie',
    description: 'Freshly baked homemade daily specialty cookie.',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian']
  }
];

async function restoreDescriptionsAndAllergens() {
  console.log('Restoring descriptions and allergen tags for all 18 ingredients in Supabase...');

  for (const item of ingredientsData) {
    const { data, error } = await supabase
      .from('ingredients')
      .update({
        description: item.description,
        allergens: item.allergens
      })
      .ilike('name', item.name)
      .select('id, name');

    if (error) {
      console.error(`Error updating ${item.name}:`, error);
    } else {
      console.log(`✓ Restored ${item.name}: ${item.allergens.join(', ')}`);
    }
  }

  console.log('Descriptions and allergens successfully restored!');
}

restoreDescriptionsAndAllergens();
