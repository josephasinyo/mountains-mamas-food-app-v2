const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

const mapBread = (name) => {
  const n = (name || '').toLowerCase().trim();
  // Exact / distinct breads
  if (n.includes('deli') || n.includes('sliced wheat')) return 'Deli Sliced Wheat';
  if (n.includes('seedy wheat')) return 'Seedy Wheat Bread';
  if (n.includes('sour dough') || n.includes('sourdough')) return 'Sour Dough Bread';
  if (n.includes('whole grain') || (n.includes('seedy') && n.includes('focaccia'))) return 'Seedy Whole Grain Focaccia';
  if (n.includes('gluten') && n.includes('wrap')) return 'Gluten-Free Tortilla Wrap';
  if (n.includes('gluten') || n.includes('rosemary')) return 'Gluten-Free Rustic Rosemary Loaf';
  if (n.includes('wrap') || n.includes('tortilla') || n.includes('foloro')) return 'Regular Tortilla Wrap';
  if (n.includes('croissant')) return 'Fresh Croissant';
  if (n.includes('herby')) return 'Herby Focaccia';
  if (n.includes('white')) return 'White Sandwich Bread';
  if (n.includes('french')) return 'French Bread';
  return null;
};

const mapCookie = (name) => {
  const n = (name || '').toLowerCase().trim();
  if (n === 'homemade cookie' || n === 'homemade') return 'Homemade Cookie';
  if (n.includes('granola')) return 'Gluten-Free Granola Bar';
  if (n.includes('brownie')) return 'Gluten-Free Brownie';
  if (n.includes('lemon') || n.includes('blueberry')) return 'Lemon Blueberry Cookie';
  if (n.includes('salted') || n.includes('caramel')) return 'Salted Caramel Cookie';
  if (n.includes('oatmeal') || n.includes('raisin')) return 'Oatmeal Raisin Cookie';
  if (n.includes('chocolate') || n.includes('cookie')) return 'Chocolate Chip Cookie';
  return null;
};

// Global default order fallback
const DEFAULT_GLOBAL_BREAD_ORDER = [
  "Herby Focaccia",
  "Seedy Whole Grain Focaccia",
  "Regular Tortilla Wrap",
  "French Bread",
  "Gluten-Free Tortilla Wrap",
  "Gluten-Free Rustic Rosemary Loaf",
  "Sour Dough Bread",
  "Seedy Wheat Bread",
  "White Sandwich Bread",
  "Fresh Croissant",
  "Deli Sliced Wheat"
];

const DEFAULT_GLOBAL_COOKIE_ORDER = [
  "Homemade Cookie",
  "Chocolate Chip Cookie",
  "Salted Caramel Cookie",
  "Oatmeal Raisin Cookie",
  "Lemon Blueberry Cookie",
  "Gluten-Free Brownie",
  "Gluten-Free Granola Bar"
];

async function migrateCompanyMealPageOptions() {
  console.log('Migrating company_app_config meal_page_options to updated 11 breads and 7 cookies...');
  
  // 1. Update app_settings (global settings)
  const { data: globalSettings } = await supabase.from('app_settings').select('*').limit(1).single();
  if (globalSettings) {
    await supabase.from('app_settings').update({
      bread_options: DEFAULT_GLOBAL_BREAD_ORDER,
      cookie_options: DEFAULT_GLOBAL_COOKIE_ORDER
    }).eq('id', globalSettings.id);
    console.log('✓ Updated global app_settings bread & cookie default arrays');
  }

  // 2. Fetch all company configs
  const { data: configs, error } = await supabase
    .from('company_app_config')
    .select('id, company_id, meal_page_options, tour_companies(name, slug)');

  if (error) {
    console.error('Error fetching configs:', error);
    return;
  }

  for (const c of configs || []) {
    const origBreads = c.meal_page_options?.breads || [];
    const origCookies = c.meal_page_options?.cookies || [];

    const newBreads = [];
    for (const b of origBreads) {
      const mapped = mapBread(b);
      if (mapped && !newBreads.includes(mapped)) newBreads.push(mapped);
    }

    const newCookies = [];
    for (const ck of origCookies) {
      const mapped = mapCookie(ck);
      if (mapped && !newCookies.includes(mapped)) newCookies.push(mapped);
    }

    // If company had full list or empty list, ensure default sequence
    const finalBreads = newBreads.length > 0 ? newBreads : DEFAULT_GLOBAL_BREAD_ORDER;
    const finalCookies = newCookies.length > 0 ? newCookies : DEFAULT_GLOBAL_COOKIE_ORDER;

    const updatedOptions = {
      ...(c.meal_page_options || {}),
      breads: finalBreads,
      cookies: finalCookies
    };

    const { error: updateErr } = await supabase
      .from('company_app_config')
      .update({ meal_page_options: updatedOptions })
      .eq('id', c.id);

    if (updateErr) {
      console.error(`Failed to update company ${c.company_id}:`, updateErr);
    } else {
      console.log(`✓ Updated ${c.tour_companies?.name || c.company_id}:`);
      console.log(`   Breads (${finalBreads.length}):`, finalBreads.join(' -> '));
      console.log(`   Cookies (${finalCookies.length}):`, finalCookies.join(' -> '));
    }
  }

  console.log('Company migration complete!');
}

migrateCompanyMealPageOptions();
