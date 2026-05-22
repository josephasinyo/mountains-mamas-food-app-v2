import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding orders...');

    // 1. Get companies
    const { data: companies, error: companiesError } = await supabase
        .from('tour_companies')
        .select('id, name')
        .limit(3);

    if (companiesError || !companies?.length) {
        console.error('Failed to fetch companies. Ensure you have tour companies in the DB.', companiesError);
        return;
    }

    // 2. Insert Orders
    const ordersToInsert = [
        {
            company_id: companies[0].id,
            customer_name: 'John Doe',
            guide_name: 'Mike',
            tour_date: new Date().toISOString().split('T')[0], // today
            pickup_time: '07:30 AM',
            notes: 'Please pack the cookies separately.',
            status: 'pending',
            payment_status: 'paid',
            is_locked: false,
        },
        {
            company_id: companies[0].id,
            customer_name: 'Jane Smith',
            guide_name: 'Sarah',
            tour_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
            pickup_time: '08:00 AM',
            status: 'ticket_created',
            payment_status: 'unpaid',
            is_locked: true,
        },
        {
            company_id: companies[1]?.id || companies[0].id,
            customer_name: 'Alice Johnson',
            guide_name: null,
            tour_date: new Date().toISOString().split('T')[0],
            pickup_time: '06:45 AM',
            notes: 'Extra napkins please.',
            status: 'fulfilled',
            payment_status: 'invoiced',
            is_locked: true,
        }
    ];

    const { data: insertedOrders, error: ordersError } = await supabase
        .from('orders')
        .insert(ordersToInsert)
        .select();

    if (ordersError) {
        console.error('Failed to insert orders:', ordersError);
        return;
    }
    
    console.log(`Inserted ${insertedOrders.length} orders.`);

    // 3. Insert Order Items
    const itemsToInsert = [];

    // Order 1 items
    itemsToInsert.push({
        order_id: insertedOrders[0].id,
        meal_name: 'Turkey Club Sandwich',
        quantity: 2,
        box_type: 'Box Lunch',
        bread_type: 'Sandwich',
        cookie_choice: 'Homemade Cookie',
        customizations: 'No mayo, extra tomato',
        unit_price: 15.00
    });
    itemsToInsert.push({
        order_id: insertedOrders[0].id,
        meal_name: 'Greek Salad',
        quantity: 1,
        box_type: 'Box Lunch',
        bread_type: null,
        cookie_choice: 'Gluten-free Brownie',
        customizations: 'Dressing on the side',
        unit_price: 13.50
    });

    // Order 2 items
    itemsToInsert.push({
        order_id: insertedOrders[1].id,
        meal_name: 'Ham & Cheese Wrap',
        quantity: 3,
        box_type: 'Junior Box Lunch',
        bread_type: 'Make it a wrap',
        cookie_choice: 'Homemade Cookie',
        customizations: null,
        unit_price: 12.00
    });

    // Order 3 items
    itemsToInsert.push({
        order_id: insertedOrders[2].id,
        meal_name: 'Veggie Sandwich',
        quantity: 1,
        box_type: 'Box Lunch',
        bread_type: 'Gluten-free bread',
        cookie_choice: 'Gluten-free Brownie',
        customizations: 'No onions',
        unit_price: 14.50
    });

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

    if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
        return;
    }

    console.log('Successfully inserted all seed data!');
}

seed().catch(console.error);
