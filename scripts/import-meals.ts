/**
 * Import meals from Google Spreadsheet "Food List" into Supabase.
 * 
 * This script:
 * 1. Parses the spreadsheet data (main items + sub items)
 * 2. Downloads images from Google Drive using public download URLs
 * 3. Uploads images to Supabase Storage (meal-images bucket)
 * 4. Inserts meal records into the meals table
 * 
 * Usage: npx tsx scripts/import-meals.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

// ---------- CONFIG ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------- SPREADSHEET DATA ----------
// Parsed from the "Food List" sheet. Each group = [main, box_lunch_sub, junior_sub]
// Fields: name, driveFileId, description, price, boxIncludes, tourCompany

interface RawRow {
    name: string;
    type: 'main' | 'sub';
    driveFileId: string;
    description: string;
    price: string;
    tourCompany: string;
    boxIncludes: string;
}

interface MealGroup {
    main: RawRow;
    boxLunch?: RawRow;
    juniorBoxLunch?: RawRow;
}

const rawRows: RawRow[] = [
    // === The Vegetarian ===
    { name: "The Vegetarian", type: "main", driveFileId: "1QofeQkFXlPja6tSKl8lsGWuBW6urZK49", description: "Seedy Wheat Foccaccia, Pesto, Hummus, pepperjack cheese, Spinach, Avocado, Sprouts, Bell Pepper, Red Onion, Tomato", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "The Vegetarian - Box Lunch", type: "sub", driveFileId: "1Oq6_KCCCLK2lWq09ON2by5Wbm9KzZ7xi", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "The Vegetarian - Junior Box Lunch", type: "sub", driveFileId: "1cjT_wGLufu3P8OWiyzYKWM1YN41vQFXM", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === The Madison ===
    { name: "The Madison", type: "main", driveFileId: "1UL_ko635Us4IZVUPJEuhebWT_ayvApjD", description: "Herby Foccaccia bread, pesto, Mayo, Spring Mix, Turkey, Bacon, Provolone cheese, avocado, Bell Pepper", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "The Madison - Box Lunch", type: "sub", driveFileId: "1frJSDfLaos297OgqAAGFMpQItZ-uZDxD", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "The Madison - Junior Box Lunch", type: "sub", driveFileId: "1XXGqG7RhOiICiO2nr8t5joZdnqBKFIRm", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === The Yellowstone Club ===
    { name: "The Yellowstone Club", type: "main", driveFileId: "1nAOP4FefNTzFBm9Ly_kE3uFHzERT2UMd", description: "Herby Fococcia Bread, Mayo, Turkey, Ham, Bacon, Cheddar Cheese, Spring Mix, Tomato", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "The Yellowstone Club - Box Lunch", type: "sub", driveFileId: "1JE9wYDImFCLLea3bAbpSZ2fW0wOIT9ov", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "The Yellowstone Club - Junior Box Lunch", type: "sub", driveFileId: "1A_ApNKVK250g6SjnCaAj-rGNIn4kIP9l", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === The BLT ===
    { name: "The BLT", type: "main", driveFileId: "1yk5rvUuaOK4hxje6hh16IgKYMoqofZ6u", description: "Herby Fococcia Bread, Mayo, Bacon, Spring Mix, tomato", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "The BLT - Box Lunch", type: "sub", driveFileId: "1LF9gtnwpcbIuWZ5Q3sxPpRGRaGcHjNyQ", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "The BLT - Junior Box Lunch", type: "sub", driveFileId: "16c7GKa07wxjSwinqkBdWV0NV2waDkwmD", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === The Grizzly Bear ===
    { name: "The Grizzly Bear", type: "main", driveFileId: "14kc5wUKGYPHn9V_7bIlDIvE10pBahkfN", description: "Herby Fococcia Bread, Chipotle BBQ sauce, Roast Beef, Cheddar Cheese", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "The Grizzly Bear - Box Lunch", type: "sub", driveFileId: "1HZjFn4FTchoyfEs4Qr_HS20WJshtaUPG", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "The Grizzly Bear - Junior Box Lunch", type: "sub", driveFileId: "19m4qtnvgw_ZaIvqeYZaUh7NOuVk9vwHg", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Ham and Cheese ===
    { name: "Ham and Cheese", type: "main", driveFileId: "14Fx_zyLGSXgYHfUKGsCvQLryAc09Qjec", description: "Herby Fococcia, Ham, Cheddar Cheese (Must request lettuce, tomato, onion)", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Ham and Cheese - Box Lunch", type: "sub", driveFileId: "1pfbbzwvGDRaUMkTJDx_n0qjJkfSyWaw3", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Ham and Cheese - Junior Box Lunch", type: "sub", driveFileId: "1f0DLunchgu5zqnJuOfq8mE79KAUGDVKi", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Peanut Butter and Huckleberry Jam ===
    { name: "Peanut Butter and Huckleberry Jam", type: "main", driveFileId: "1quJm9E85NRqkWBf92e67aqNPwIw0qrLO", description: "White Bread with creamy peanut butter and Homemade Huckleberry Jam", price: "", tourCompany: "Default, Yellowstone Scenic Tours, Teton Excursions LLC", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Peanut Butter and Huckleberry Jam - Box Lunch", type: "sub", driveFileId: "1m-i3B-9Eh8uTTPd336mXCSJeVIuSJASj", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Peanut Butter and Huckleberry Jam - Junior Box Lunch", type: "sub", driveFileId: "1orKd2uT_YThzHZyEqqtqjtAqLAIwdGiH", description: "", price: "$15.99", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Turkey and Cheese ===
    { name: "Turkey and Cheese", type: "main", driveFileId: "1N1FdECf1I566pHJVf6zGfeA7meChYyb4", description: "Herby focaccia bread, Smoked Turkey, Cheddar Cheese (Must request lettuce, tomato, onion)", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Turkey and Cheese - Box Lunch", type: "sub", driveFileId: "1xmwjvW7Uuj9sKehCmEX7pE23fRCDyuQ-", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Turkey and Cheese - Junior Box Lunch", type: "sub", driveFileId: "1Cx0LmA-uo3dRkKWUJ7A2px7ll-y4RT9p", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Roastbeef and Cheese ===
    { name: "Roastbeef and Cheese", type: "main", driveFileId: "12SnBZDNDhSj2G4Ohgh6028eobEulG57O", description: "Herby Fococcia Bread, Roast Beef, Cheddar Cheese (Must request lettuce, tomato, onion)", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Roastbeef and Cheese - Box Lunch", type: "sub", driveFileId: "1-bMgxm9CfhbKC_U4PtkWzTLZRVvGgk57", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Roastbeef and Cheese - Junior Box Lunch", type: "sub", driveFileId: "1xDcm-BcX185Y4KlTs6UM4vgbQhiyf7mP", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Chicken Salad Sandwich ===
    { name: "Chicken Salad Sandwich", type: "main", driveFileId: "1hlnKbXuAe-aYUwc2Vfw7FF6DlUj7n3cv", description: "Croissant, Homemade Chicken Salad, Lettuce", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Chicken Salad Sandwich - Box Lunch", type: "sub", driveFileId: "1QzwEUr0YNoodS4KwC5u-KIZkGyX63Uu2", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Chicken Salad Sandwich - Junior Box Lunch", type: "sub", driveFileId: "1Urrvt1CXFzOgTjophVSQPP4IkHOarihE", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Tuna Salad Sandwich ===
    { name: "Tuna Salad Sandwich", type: "main", driveFileId: "1_f--QDqK0yJb59fDnDWevACm3toHqmef", description: "Croissant, Homemade Tuna Salad, Lettuce", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Tuna Salad Sandwich - Box Lunch", type: "sub", driveFileId: "1SK9xxtUY6Qxx-G0AlbJ31B3RDRCgkt9u", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Tuna Salad Sandwich - Junior Box Lunch", type: "sub", driveFileId: "1Mf7P12AXH6WGhpTHRf_bhCjHmgq3R7gj", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Caprice Sandwich ===
    { name: "Caprice Sandwich", type: "main", driveFileId: "19_LVQOsycWJBqTAnQ_S5wACxa6MY5l9I", description: "Homemade Savory Focaccia Bread, Fresh mozzarella cheese, Tomatoes, Fresh basil leaves, Arugula, and fresh red onion. Extra-virgin olive oil, salt, and pepper", price: "", tourCompany: "Default", boxIncludes: "Sandwich, fruit, water, chips, cookie" },
    { name: "Caprice Sandwich - Box Lunch", type: "sub", driveFileId: "1GmQyChiWFnPprn2Xtro-xZUdPs6Y5nZA", description: "", price: "$19.00", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },
    { name: "Caprice Sandwich - Junior Box Lunch", type: "sub", driveFileId: "1t9ALVnc1CpOYuAF6hzv2WlXIDmvM-dKo", description: "", price: "$17.50", tourCompany: "Default", boxIncludes: "Sandwich, chips, cookie" },

    // === Grilled Chicken Salad (no box/junior) ===
    { name: "Grilled Chicken Salad", type: "main", driveFileId: "1ttNCbU9bZXJUB9Q7uAN6nZgl9xfBWlqK", description: "Grilled chicken breast, Avocado, Cucumber, Tomatoes, Kalamata olives, Red Onion, and feta cheese.", price: "", tourCompany: "Default", boxIncludes: "" },

    // === Garden Salad (no box/junior) ===
    { name: "Garden Salad", type: "main", driveFileId: "1p0SI8gbAz839ZyYvc4iM9olKsxvR6MZ9", description: "Spring mix, Bell Pepper, Cucumber, Tomato, Carrot, Freshly grated Parmesan Cheese. Choice of Huckleberry vinaigrette, ranch, or blue cheese dressing served on the side", price: "", tourCompany: "Default", boxIncludes: "" },
];

// ---------- GROUP ROWS INTO MEALS ----------
function groupIntoMeals(rows: RawRow[]): MealGroup[] {
    const groups: MealGroup[] = [];
    let currentMain: RawRow | null = null;
    let currentBoxLunch: RawRow | undefined;
    let currentJunior: RawRow | undefined;

    for (const row of rows) {
        if (row.type === 'main') {
            // Save previous group
            if (currentMain) {
                groups.push({ main: currentMain, boxLunch: currentBoxLunch, juniorBoxLunch: currentJunior });
            }
            currentMain = row;
            currentBoxLunch = undefined;
            currentJunior = undefined;
        } else {
            // Sub item
            if (row.name.includes('Junior')) {
                currentJunior = row;
            } else {
                currentBoxLunch = row;
            }
        }
    }
    // Push last group
    if (currentMain) {
        groups.push({ main: currentMain, boxLunch: currentBoxLunch, juniorBoxLunch: currentJunior });
    }
    return groups;
}

// ---------- DOWNLOAD FROM GOOGLE DRIVE ----------
async function downloadFromDrive(fileId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
            console.warn(`  ⚠ Failed to download ${fileId}: ${response.status}`);
            return null;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        return { buffer, contentType };
    } catch (err) {
        console.warn(`  ⚠ Error downloading ${fileId}:`, err);
        return null;
    }
}

// ---------- UPLOAD TO SUPABASE STORAGE ----------
async function uploadToSupabase(buffer: Buffer, contentType: string, prefix: string): Promise<string | null> {
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `${prefix}-${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
        .from('meal-images')
        .upload(fileName, buffer, { contentType, cacheControl: '3600' });

    if (error) {
        console.error(`  ✗ Upload failed for ${fileName}:`, error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(data.path);

    return publicUrl;
}

// ---------- PARSE PRICE ----------
function parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace('$', '').trim()) || 0;
}

// ---------- DETERMINE CATEGORY ----------
function determineCategory(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('sandwich')) return 'sandwich';
    if (lower.includes('salad')) return 'salad';
    if (lower.includes('cookie')) return 'cookie';
    return 'sandwich';
}

// ---------- MAIN ----------
async function main() {
    console.log('🍽  Mountain Mama\'s Café — Meal Import Script');
    console.log('━'.repeat(50));

    // First delete existing meals (optional — comment out if you want to keep existing)
    console.log('\n🗑  Clearing existing meals...');
    const { error: deleteError } = await supabase.from('meals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        console.error('Failed to clear meals:', deleteError.message);
        // Continue anyway — we'll upsert
    }

    const groups = groupIntoMeals(rawRows);
    console.log(`\n📋 Found ${groups.length} meals to import\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const mealName = group.main.name;
        console.log(`\n[${i + 1}/${groups.length}] 🥪 ${mealName}`);

        // Download & upload MAIN image
        let image_url: string | null = null;
        console.log(`  ↓ Downloading main image...`);
        const mainImg = await downloadFromDrive(group.main.driveFileId);
        if (mainImg) {
            console.log(`  ↑ Uploading main image (${mainImg.buffer.length} bytes)...`);
            image_url = await uploadToSupabase(mainImg.buffer, mainImg.contentType, 'main');
            console.log(`  ✓ Main image: ${image_url ? 'OK' : 'FAILED'}`);
        }

        // Download & upload STANDARD BOX image
        let box_lunch_image_url: string | null = null;
        if (group.boxLunch) {
            console.log(`  ↓ Downloading standard box image...`);
            const stdImg = await downloadFromDrive(group.boxLunch.driveFileId);
            if (stdImg) {
                console.log(`  ↑ Uploading standard image (${stdImg.buffer.length} bytes)...`);
                box_lunch_image_url = await uploadToSupabase(stdImg.buffer, stdImg.contentType, 'std');
                console.log(`  ✓ Standard image: ${box_lunch_image_url ? 'OK' : 'FAILED'}`);
            }
        }

        // Download & upload JUNIOR BOX image
        let junior_box_lunch_image_url: string | null = null;
        if (group.juniorBoxLunch) {
            console.log(`  ↓ Downloading junior box image...`);
            const jrImg = await downloadFromDrive(group.juniorBoxLunch.driveFileId);
            if (jrImg) {
                console.log(`  ↑ Uploading junior image (${jrImg.buffer.length} bytes)...`);
                junior_box_lunch_image_url = await uploadToSupabase(jrImg.buffer, jrImg.contentType, 'jr');
                console.log(`  ✓ Junior image: ${junior_box_lunch_image_url ? 'OK' : 'FAILED'}`);
            }
        }

        // Build meal record
        const price = group.boxLunch ? parsePrice(group.boxLunch.price) : 0;
        const juniorPrice = group.juniorBoxLunch ? parsePrice(group.juniorBoxLunch.price) : null;
        const boxIncludes = group.boxLunch?.boxIncludes || group.main.boxIncludes || null;
        const juniorBoxIncludes = group.juniorBoxLunch?.boxIncludes || null;
        const hasJunior = !!group.juniorBoxLunch;

        const mealRecord = {
            name: mealName,
            description: group.main.description,
            image_url,
            box_lunch_image_url,
            junior_box_lunch_image_url,
            price,
            junior_price: juniorPrice,
            box_includes: boxIncludes,
            junior_box_includes: juniorBoxIncludes,
            category: determineCategory(mealName),
            lunch_package: 'box' as const,
            allow_split_box: hasJunior,
            is_active: true,
            sort_order: i,
        };

        // Insert into Supabase
        const { data, error } = await supabase
            .from('meals')
            .insert(mealRecord)
            .select()
            .single();

        if (error) {
            console.error(`  ✗ DB insert failed: ${error.message}`);
            errorCount++;
        } else {
            console.log(`  ✓ Inserted: ${data.name} (ID: ${data.id})`);
            successCount++;
        }
    }

    console.log('\n' + '━'.repeat(50));
    console.log(`✅ Import complete: ${successCount} succeeded, ${errorCount} failed`);
    console.log('━'.repeat(50));
}

main().catch(console.error);
