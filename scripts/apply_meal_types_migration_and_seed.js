const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) process.env[key] = val;
        }
    }
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_ID = 'annrpkzwsghiwwkxqdxv';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlQueries = [
    `ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'lunch';`,
    `UPDATE meals SET meal_type = 'lunch' WHERE meal_type IS NULL;`,
    `ALTER TABLE company_app_config ADD COLUMN IF NOT EXISTS allowed_meal_types TEXT[] DEFAULT ARRAY['lunch']::TEXT[];`,
    `UPDATE company_app_config SET allowed_meal_types = ARRAY['lunch']::TEXT[] WHERE allowed_meal_types IS NULL;`
];

async function runQuery(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_ID}/database/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const preview = sql.replace(/\s+/g, ' ').substring(0, 70);
                console.log(`[${res.statusCode}] ${preview}...`);
                if (res.statusCode >= 400) console.log('  Response:', data);
                resolve(res.statusCode);
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const SEED_MEALS = [
    // Breakfast items
    {
        name: 'Mountain Sunrise Breakfast Burrito',
        name_es: 'Burrito de Desayuno Amanecer de Montaña',
        description: 'Scrambled farm-fresh eggs, crispy bacon, cheddar-jack cheese, roasted breakfast potatoes, and house-made roasted salsa wrapped in a warm flour tortilla.',
        price: 13.50,
        category: 'breakfast',
        meal_type: 'breakfast',
        is_active: true,
        sort_order: 1,
        image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Continental Pastry & Fresh Fruit Platter',
        name_es: 'Plato Continental de Repostería y Fruta Fresca',
        description: 'Fresh baked butter croissant, blueberry muffin, seasonal berries, sliced melon, Greek honey yogurt, and whipped butter.',
        price: 12.00,
        category: 'breakfast',
        meal_type: 'breakfast',
        is_active: true,
        sort_order: 2,
        image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Granola & Greek Yogurt Parfait Bowl',
        name_es: 'Tazón de Parfait de Yogur Griego y Granola',
        description: 'Organic honey-toasted oats granola layered with creamy vanilla Greek yogurt, chia seeds, fresh strawberries, blueberries, and local huckleberry drizzle.',
        price: 10.50,
        category: 'breakfast',
        meal_type: 'breakfast',
        is_active: true,
        sort_order: 3,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    },

    // Dinner items
    {
        name: 'Campfire Grilled Wild Salmon Plate',
        name_es: 'Plato de Salmón Salvaje Asado al Fuego',
        description: 'Wild-caught salmon filet grilled with lemon-herb butter, served alongside roasted Yukon gold potatoes and grilled asparagus spears.',
        price: 26.00,
        category: 'dinner',
        meal_type: 'dinner',
        is_active: true,
        sort_order: 1,
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Montana Beef Tenderloin Medallions',
        name_es: 'Medallones de Solomillo de Res de Montana',
        description: 'Pan-seared tenderloin medallions with rosemary red wine reduction, garlic whipped potatoes, and butter-glazed baby carrots.',
        price: 28.50,
        category: 'dinner',
        meal_type: 'dinner',
        is_active: true,
        sort_order: 2,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Rustic Herb Roasted Chicken Plate',
        name_es: 'Pollo Rústico Asado con Hierbas',
        description: 'Slow-roasted herb-crusted half chicken served with wild rice pilaf, sweet roasted root vegetables, and natural pan jus.',
        price: 22.00,
        category: 'dinner',
        meal_type: 'dinner',
        is_active: true,
        sort_order: 3,
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    },

    // Charcuterie items
    {
        name: 'Yellowstone Artisan Charcuterie Board',
        name_es: 'Tabla de Charcutería Artesanal de Yellowstone',
        description: 'Prosciutto di Parma, Genoa salami, smoked gouda, sharp white cheddar, marinated olives, whole grain mustard, artisan crackers, and fresh grapes.',
        price: 24.00,
        category: 'charcuterie',
        meal_type: 'charcuterie',
        is_active: true,
        sort_order: 1,
        image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Gourmet Cured Meats & Aged Cheeses Platter',
        name_es: 'Plato Gourmet de Carnes Curadas y Quesos Añejos',
        description: 'Hand-selected cured chorizo, capocollo, aged manchego, creamy brie, honeycomb, spiced candied pecans, dried apricots, and rosemary crostini.',
        price: 29.50,
        category: 'charcuterie',
        meal_type: 'charcuterie',
        is_active: true,
        sort_order: 2,
        image_url: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Bison Summer Sausage & Local White Cheddar',
        name_es: 'Salchicha de Verano de Bisonte y Cheddar Blanco Local',
        description: 'Local Montana bison summer sausage, aged Flathead cheddar, cornichons, spicy brown mustard, and sea salt crackers.',
        price: 21.00,
        category: 'charcuterie',
        meal_type: 'charcuterie',
        is_active: true,
        sort_order: 3,
        image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    }
];

async function seedMeals() {
    console.log('\nChecking and seeding demo meals for Breakfast, Dinner, and Charcuterie...');
    
    for (const item of SEED_MEALS) {
        const { data: existing } = await supabase
            .from('meals')
            .select('id, name')
            .eq('name', item.name)
            .maybeSingle();

        if (existing) {
            console.log(`- Updating existing meal: "${item.name}"`);
            await supabase
                .from('meals')
                .update({
                    ...item,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            console.log(`+ Inserting new seed meal: "${item.name}" (${item.meal_type})`);
            const { error: insErr } = await supabase
                .from('meals')
                .insert([item]);
            if (insErr) {
                console.error(`  Error inserting "${item.name}":`, insErr.message);
            }
        }
    }

    // Also update any company app configs to include all meal types for testing
    console.log('\nEnabling all meal types on existing company app configs for demo...');
    const { data: configs } = await supabase
        .from('company_app_config')
        .select('id, company_id, allowed_meal_types');

    if (configs && configs.length > 0) {
        for (const cfg of configs) {
            const current = cfg.allowed_meal_types || ['lunch'];
            const allTypes = Array.from(new Set([...current, 'lunch', 'breakfast', 'dinner', 'charcuterie']));
            await supabase
                .from('company_app_config')
                .update({ allowed_meal_types: allTypes })
                .eq('id', cfg.id);
            console.log(`- Updated company_app_config ${cfg.id} with meal types:`, allTypes);
        }
    }
}

(async () => {
    if (TOKEN) {
        console.log('Running SQL migration using SUPABASE_ACCESS_TOKEN...\n');
        for (const q of sqlQueries) {
            await runQuery(q);
        }
    } else {
        console.log('No SUPABASE_ACCESS_TOKEN provided.');
        console.log('Please ensure the following SQL has been run in Supabase SQL Editor:');
        console.log('------------------------------------------------------------');
        console.log(sqlQueries.join('\n'));
        console.log('------------------------------------------------------------\n');
    }

    // Check if column exists
    const { error: testErr } = await supabase.from('meals').select('meal_type').limit(1);
    if (testErr) {
        console.log('Note: Column `meal_type` is not yet present on `meals` table.');
        console.log('Once you run the SQL above in Supabase SQL Editor, re-run:');
        console.log('node scripts/apply_meal_types_migration_and_seed.js');
    } else {
        await seedMeals();
        console.log('\nAll seed meals and configurations successfully processed!');
    }
})();
