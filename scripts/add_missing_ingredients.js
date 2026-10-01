const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

const itemsToAdd = [
  {
    name: 'Sour Dough Bread',
    type: 'bread',
    description: 'Traditional artisan sourdough bread with a crispy crust and classic tangy flavor.',
    image_url: '/images/ingredients/default_bread.svg',
    allergens: ['wheat', 'gluten', 'vegetarian'],
    is_active: true,
    sort_order: 9
  },
  {
    name: 'Seedy Wheat Bread',
    type: 'bread',
    description: 'Hearty whole wheat bread loaded with wholesome toasted seeds and grains.',
    image_url: '/images/ingredients/default_bread.svg',
    allergens: ['wheat', 'gluten', 'vegetarian'],
    is_active: true,
    sort_order: 10
  },
  {
    name: 'Deli Sliced Wheat',
    type: 'bread',
    description: 'Classic deli-style thinly sliced whole wheat bread.',
    image_url: '/images/ingredients/default_bread.svg',
    allergens: ['wheat', 'gluten', 'vegetarian'],
    is_active: true,
    sort_order: 11
  },
  {
    name: 'Homemade Cookie',
    type: 'cookie',
    description: 'Freshly baked homemade daily specialty cookie.',
    image_url: '/images/ingredients/default_cookie.svg',
    allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian'],
    is_active: true,
    sort_order: 7
  }
];

async function addMissingIngredients() {
  console.log('Adding missing bread and cookie ingredients...');
  for (const item of itemsToAdd) {
    const { data: existing } = await supabase
      .from('ingredients')
      .select('id, name')
      .ilike('name', item.name);

    if (existing && existing.length > 0) {
      console.log(`- ${item.name} already exists (ID: ${existing[0].id})`);
    } else {
      const { data, error } = await supabase.from('ingredients').insert(item).select().single();
      if (error) {
        console.error(`Error inserting ${item.name}:`, error);
      } else {
        console.log(`✓ Added ${item.type}: ${item.name}`);
      }
    }
  }
  console.log('Done adding missing ingredients!');
}

addMissingIngredients();
