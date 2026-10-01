const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

const initialIngredients = [
    // Breads
    {
        name: 'French Bread',
        type: 'bread',
        description: 'Mountain Mama’s signature homemade French bread with a crisp golden crust and soft, airy interior.',
        image_url: '/images/ingredients/french_bread.jpg',
        allergens: ['wheat', 'gluten'],
        is_active: true,
        sort_order: 1,
    },
    {
        name: 'White Sandwich Bread',
        type: 'bread',
        description: 'Classic soft white artisan sandwich bread baked fresh daily.',
        image_url: '/images/ingredients/white_sandwich_bread.jpg',
        allergens: ['wheat', 'gluten', 'dairy'],
        is_active: true,
        sort_order: 2,
    },
    {
        name: 'Herby Focaccia',
        type: 'bread',
        description: 'Aromatic Italian focaccia bread infused with extra virgin olive oil, rosemary, and sea salt flakes.',
        image_url: '/images/ingredients/herby_focaccia.jpg',
        allergens: ['wheat', 'gluten', 'vegetarian'],
        is_active: true,
        sort_order: 3,
    },
    {
        name: 'Seedy Whole Grain Focaccia',
        type: 'bread',
        description: 'Hearty whole grain focaccia topped with toasted pumpkin seeds, rolled oats, and sesame seeds.',
        image_url: '/images/ingredients/seedy_whole_grain_focaccia.jpg',
        allergens: ['wheat', 'gluten', 'vegetarian'],
        is_active: true,
        sort_order: 4,
    },
    {
        name: 'Fresh Croissant',
        type: 'bread',
        description: 'Flaky, buttery French-style artisan croissant with delicate golden layers.',
        image_url: '/images/ingredients/croissant.jpg',
        allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian'],
        is_active: true,
        sort_order: 5,
    },
    {
        name: 'Regular Tortilla Wrap',
        type: 'bread',
        description: 'Traditional soft flour tortilla wrap, freshly pressed and pliable.',
        image_url: '/images/ingredients/regular_tortilla.jpg',
        allergens: ['wheat', 'gluten', 'vegetarian'],
        is_active: true,
        sort_order: 6,
    },
    {
        name: 'Gluten-Free Rustic Rosemary Loaf',
        type: 'bread',
        description: 'Artisan gluten-free loaf baked with fresh aromatic rosemary and herbs.',
        image_url: '/images/ingredients/gluten_free_rustic_rosemary.jpg',
        allergens: ['gluten_free', 'vegetarian'],
        is_active: true,
        sort_order: 7,
    },
    {
        name: 'Gluten-Free Tortilla Wrap',
        type: 'bread',
        description: 'Soft gluten-free tortilla wrap, perfect for allergen-sensitive and gluten-free diets.',
        image_url: '/images/ingredients/gluten_free_tortillas.jpg',
        allergens: ['gluten_free', 'vegetarian'],
        is_active: true,
        sort_order: 8,
    },

    // Cookies & Treats
    {
        name: 'Chocolate Chip Cookie',
        type: 'cookie',
        description: 'Classic bakery-fresh cookie packed with rich, melted semi-sweet chocolate chips.',
        image_url: '/images/ingredients/chocolate_chip_cookie.jpg',
        allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian'],
        is_active: true,
        sort_order: 1,
    },
    {
        name: 'Oatmeal Raisin Cookie',
        type: 'cookie',
        description: 'Chewy whole-grain rolled oats blended with sweet plump raisins and a hint of cinnamon.',
        image_url: '/images/ingredients/oatmeal_raisin_cookie.jpg',
        allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian'],
        is_active: true,
        sort_order: 2,
    },
    {
        name: 'Salted Caramel Cookie',
        type: 'cookie',
        description: 'Decadent gourmet cookie featuring gooey caramel pockets topped with sea salt flakes.',
        image_url: '/images/ingredients/salted_caramel_cookie.jpg',
        allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian'],
        is_active: true,
        sort_order: 3,
    },
    {
        name: 'Lemon Blueberry Cookie',
        type: 'cookie',
        description: 'Bright, zesty lemon cookie studded with real blueberries and sparkling sugar.',
        image_url: '/images/ingredients/lemon_blueberry_cookie.jpg',
        allergens: ['wheat', 'gluten', 'dairy', 'egg', 'vegetarian'],
        is_active: true,
        sort_order: 4,
    },
    {
        name: 'Gluten-Free Brownie',
        type: 'cookie',
        description: 'Rich, fudgy gluten-free chocolate brownie with a deep cocoa flavor.',
        image_url: '/images/ingredients/gluten_free_brownie.jpg',
        allergens: ['gluten_free', 'dairy', 'egg', 'vegetarian'],
        is_active: true,
        sort_order: 5,
    },
    {
        name: 'Gluten-Free Granola Bar',
        type: 'cookie',
        description: 'Wholesome crunchy granola bar loaded with toasted seeds, honey, and gluten-free rolled oats.',
        image_url: '/images/ingredients/gluten_free_granola_bar.jpg',
        allergens: ['gluten_free', 'vegetarian'],
        is_active: true,
        sort_order: 6,
    },
];

async function seed() {
    console.log('Seeding ingredients table...');
    
    // Check if table has data
    const { data: existing, error: fetchErr } = await supabase.from('ingredients').select('id, name');
    if (fetchErr) {
        console.error('Fetch error:', fetchErr);
        return;
    }

    if (existing && existing.length > 0) {
        console.log(`Table already has ${existing.length} ingredients. Updating / Upserting...`);
    }

    for (const item of initialIngredients) {
        const { error } = await supabase.from('ingredients').upsert(item, { onConflict: 'name' });
        if (error) {
            // Insert directly if no unique constraint on name
            await supabase.from('ingredients').insert(item);
        }
        console.log(`✓ Seeded ${item.type}: ${item.name}`);
    }

    console.log('Seeding complete!');
}

seed();
