const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

// Exact original list snapshot for companies before any migration
const ORIGINAL_COMPANY_DATA = {
  "hayden-valley-nature-tours": {
    breads: ["Whole Grain Focaccia","Herby Focaccia","White Bread","Seedy Wheat Bread","Sour Dough Bread","Gluten-free bread","Fresh Croissant","French Bread","Foloro bread","Gluten-free wrap","Deli Sliced Wheat"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "yellowstone-scenic-tours": {
    breads: ["Seedy Wheat Bread","French Bread","Sour Dough Bread","Gluten-free bread"],
    cookies: ["Homemade Cookie","Homemade Brownie","Gluten free Brownie"]
  },
  "easy-tours-of-yellowstone": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "alpine-shuttle-yellowstone-odyssey-tours": {
    breads: ["Herby Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "lunches-0d56": { // Northwestern Tours
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "yellowstone-national-park-tours": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "lunches-cedb": { // Rod Run
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "lunches-b67b": { // Prt Tours
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "global-travel-alliance": {
    breads: ["Whole Grain Focaccia","Herby Focaccia","White Bread","Seedy Wheat Bread","Sour Dough Bread","Gluten-free bread","Fresh Croissant","French Bread","Foloro bread","Deli Sliced Wheat","Gluten-free wrap"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "nature-seen": {
    breads: ["Whole Grain Focaccia","Herby Focaccia","White Bread","Seedy Wheat Bread","Sour Dough Bread","Gluten-free bread","Fresh Croissant","French Bread","Foloro bread","Deli Sliced Wheat","Gluten-free wrap","Wrap"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "nations-classroom": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "buffalo-roam-tours": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "grand-classroom": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Homemade Cookie","Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "great-western-expeditions-": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "skys-the-limit": {
    breads: ["Herby Focaccia","White Bread","Seedy Wheat Bread","Sour Dough Bread","Gluten-free bread","Fresh Croissant","French Bread","Foloro bread","Deli Sliced Wheat","Gluten-free wrap","Wrap"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "yellowstone-safari": {
    breads: ["Whole Grain Focaccia","Gluten-free bread","Foloro bread","Gluten-free wrap","Sour Dough Bread","French Bread","White Bread","Herby Focaccia","Wrap","Fresh Croissant"],
    cookies: ["Salted Caramel","Gluten free Brownie","Homemade Brownie","Chocolate Chip","Oatmeal Raisin","Lemon Blueberry"]
  },
  "landmark-tourswildlife-safari": {
    breads: ["Herby Focaccia","Whole Grain Focaccia","Wrap","French Bread","Gluten-free wrap","Gluten-free bread","Sour Dough Bread","Seedy Wheat Bread","White Bread","Fresh Croissant","Deli Sliced Wheat"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Lemon Blueberry","Homemade Brownie","Gluten free Brownie"]
  },
  "teton-excursions-llc": {
    breads: ["Gluten-free bread","French Bread","Deli Sliced Wheat","Gluten-free wrap","Herby Focaccia","Whole Grain Focaccia"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "kim-test": {
    breads: ["Whole Grain Focaccia","Herby Focaccia","White Bread","Seedy Wheat Bread","Sour Dough Bread","Gluten-free bread","Fresh Croissant","French Bread","Foloro bread","Deli Sliced Wheat","Gluten-free wrap"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "lunches-9c07": { // Yellowstone Adventure Tours
    breads: ["Whole Grain Focaccia","Herby Focaccia","White Bread","Seedy Wheat Bread","Sour Dough Bread","Gluten-free bread","Fresh Croissant","French Bread","Foloro bread","Deli Sliced Wheat","Gluten-free wrap"],
    cookies: ["Chocolate Chip","Salted Caramel","Oatmeal Raisin","Homemade Brownie","Gluten free Brownie","Lemon Blueberry"]
  },
  "lunches-359c": { // New Joseph Tour Test
    breads: ["Herby Focaccia","Fresh Croissant","French Bread","White Sandwich Bread","Seedy Whole Grain Focaccia","Regular Tortilla Wrap","Gluten-Free Rustic Rosemary Loaf","Gluten-Free Tortilla Wrap"],
    cookies: ["Chocolate Chip Cookie","Oatmeal Raisin Cookie","Salted Caramel Cookie","Lemon Blueberry Cookie","Gluten-Free Brownie","Gluten-Free Granola Bar"]
  }
};

const mapBread = (name) => {
  const n = (name || '').toLowerCase().trim();
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

async function restoreAndApplyExactOrder() {
  console.log('Restoring and applying exact original company selections and orders...');
  const { data: configs, error } = await supabase
    .from('company_app_config')
    .select('id, company_id, meal_page_options, tour_companies(name, slug)');

  if (error) {
    console.error('Error fetching configs:', error);
    return;
  }

  for (const c of configs || []) {
    const slug = c.tour_companies?.slug;
    const orig = (slug && ORIGINAL_COMPANY_DATA[slug]) ? ORIGINAL_COMPANY_DATA[slug] : c.meal_page_options;

    const rawBreads = orig?.breads || [];
    const rawCookies = orig?.cookies || [];

    const mappedBreads = [];
    for (const b of rawBreads) {
      const mapped = mapBread(b);
      if (mapped && !mappedBreads.includes(mapped)) {
        mappedBreads.push(mapped);
      }
    }

    const mappedCookies = [];
    for (const ck of rawCookies) {
      const mapped = mapCookie(ck);
      if (mapped && !mappedCookies.includes(mapped)) {
        mappedCookies.push(mapped);
      }
    }

    const updatedOptions = {
      ...(c.meal_page_options || {}),
      breads: mappedBreads,
      cookies: mappedCookies
    };

    const { error: updateErr } = await supabase
      .from('company_app_config')
      .update({ meal_page_options: updatedOptions })
      .eq('id', c.id);

    if (updateErr) {
      console.error(`Error updating ${slug}:`, updateErr);
    } else {
      console.log(`✓ ${c.tour_companies?.name} (${slug}):`);
      console.log(`   Breads (${mappedBreads.length}):`, mappedBreads.join(' -> '));
      console.log(`   Cookies (${mappedCookies.length}):`, mappedCookies.join(' -> '));
    }
  }

  console.log('Exact restore and migration completed successfully!');
}

restoreAndApplyExactOrder();
