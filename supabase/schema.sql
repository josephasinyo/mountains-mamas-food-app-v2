-- ===========================================
-- Mountain Mama's Café - V2 Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. TOUR COMPANIES
-- =========================================
CREATE TABLE tour_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone TEXT,
    payment_method TEXT NOT NULL DEFAULT 'direct_pay' CHECK (payment_method IN ('direct_pay', 'monthly_invoice')),
    stripe_customer_id TEXT,
    contract_signed_at TIMESTAMPTZ,
    contract_pdf_url TEXT,
    representative_name TEXT,
    representative_title TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'suspended')),
    timezone TEXT NOT NULL DEFAULT 'America/Denver',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 2. COMPANY APP CONFIG (white-label settings)
-- =========================================
CREATE TABLE company_app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL UNIQUE REFERENCES tour_companies(id) ON DELETE CASCADE,
    show_box_lunch_category BOOLEAN NOT NULL DEFAULT true,
    show_junior_box_lunch_category BOOLEAN NOT NULL DEFAULT true,
    show_prices BOOLEAN NOT NULL DEFAULT true,
    show_stripe_checkout BOOLEAN NOT NULL DEFAULT true,
    meal_page_options JSONB NOT NULL DEFAULT '{}',
    confirmation_page_fields JSONB NOT NULL DEFAULT '{}',
    custom_welcome_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 3. MEALS
-- =========================================
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    type TEXT NOT NULL DEFAULT 'Main item' CHECK (type IN ('Main item', 'Sub item')),
    parent_meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    box_includes TEXT,
    category TEXT NOT NULL DEFAULT 'sandwich' CHECK (category IN ('sandwich', 'salad', 'cookie', 'other')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 4. COMPANY MENU SELECTIONS
-- =========================================
CREATE TABLE company_menu_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES tour_companies(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    is_selected BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, meal_id)
);

-- =========================================
-- 5. ORDERS
-- =========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES tour_companies(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    guide_name TEXT,
    tour_date DATE NOT NULL,
    pickup_time TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ticket_created', 'fulfilled', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'invoiced')),
    payment_method TEXT CHECK (payment_method IN ('stripe', 'monthly_invoice')),
    stripe_payment_id TEXT,
    ticket_created_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 6. ORDER ITEMS
-- =========================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
    meal_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    box_type TEXT CHECK (box_type IN ('Box Lunch', 'Junior Box Lunch', 'Bag Lunch', 'Junior Bag Lunch', 'Sandwich only', 'This is a box lunch', 'This is a junior box lunch', 'This is a bag lunch', 'This is a junior bag lunch', 'This is a standalone sandwich')),
    bread_type TEXT CHECK (bread_type IN ('Sandwich', 'Make it a wrap', 'Gluten-free bread', 'Fresh croissant')),
    cookie_choice TEXT,
    customizations TEXT,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 7. INVOICES
-- =========================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES tour_companies(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    pdf_url TEXT,
    stripe_payment_link TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 8. ACTIVITY LOG
-- =========================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT,
    user_role TEXT CHECK (user_role IN ('admin', 'company', 'staff', 'system')),
    action TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('order', 'meal', 'company', 'invoice', 'contract', 'auth', 'config')),
    entity_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 9. CONTRACTS
-- =========================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES tour_companies(id) ON DELETE CASCADE,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired')),
    signed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    signer_name TEXT,
    signer_email TEXT,
    signer_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- INDEXES for performance
-- =========================================
CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_tour_date ON orders(tour_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_company_menu_selections_company ON company_menu_selections(company_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_tour_companies_slug ON tour_companies(slug);

-- =========================================
-- AUTO-UPDATE updated_at TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_companies_updated_at
    BEFORE UPDATE ON tour_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_app_config_updated_at
    BEFORE UPDATE ON company_app_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- AUTO-CREATE company_app_config on new company
-- =========================================
CREATE OR REPLACE FUNCTION create_default_app_config()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_app_config (company_id)
    VALUES (NEW.id);
    
    -- If payment method is monthly_invoice, disable prices and Stripe
    IF NEW.payment_method = 'monthly_invoice' THEN
        UPDATE company_app_config 
        SET show_prices = false, show_stripe_checkout = false
        WHERE company_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_app_config
    AFTER INSERT ON tour_companies
    FOR EACH ROW EXECUTE FUNCTION create_default_app_config();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================
ALTER TABLE tour_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_menu_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Meals are publicly readable (needed for ordering app)
CREATE POLICY "Meals are publicly readable" ON meals
    FOR SELECT USING (true);

-- Tour companies: public can read active ones (for ordering app routing)
CREATE POLICY "Active companies are publicly readable" ON tour_companies
    FOR SELECT USING (is_active = true AND status = 'active');

-- Company app config: public can read (needed for ordering app)
CREATE POLICY "App config is publicly readable" ON company_app_config
    FOR SELECT USING (true);

-- Company menu selections: public can read (needed to show correct menu)
CREATE POLICY "Menu selections are publicly readable" ON company_menu_selections
    FOR SELECT USING (true);

-- Orders: public can insert (customers placing orders)
CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT WITH CHECK (true);

-- Order items: public can insert (part of order creation)
CREATE POLICY "Anyone can create order items" ON order_items
    FOR INSERT WITH CHECK (true);

-- Service role bypasses all RLS (used for admin/company server-side operations)
-- This is handled by using the service_role key in server-side code
