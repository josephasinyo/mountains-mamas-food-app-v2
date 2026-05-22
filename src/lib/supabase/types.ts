/**
 * Database types for Mountain Mama's Café V2
 * These match the schema defined in supabase/schema.sql
 */

export interface TourCompany {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    payment_method: 'direct_pay' | 'monthly_invoice';
    stripe_customer_id: string | null;
    contract_signed_at: string | null;
    contract_pdf_url: string | null;
    representative_name?: string | null;
    representative_title?: string | null;
    is_active: boolean;
    status: 'pending_approval' | 'active' | 'suspended';
    timezone: string;
    order_link: string | null;
    needs_password_change: boolean;
    created_at: string;
    updated_at: string;
}

export interface CompanyAppConfig {
    id: string;
    company_id: string;
    show_box_lunch_category: boolean;
    show_junior_box_lunch_category: boolean;
    use_split_box_types: boolean;
    use_sandwich_only: boolean;
    show_prices: boolean;
    show_stripe_checkout: boolean;
    meal_page_options: Record<string, any>;
    confirmation_page_fields: Record<string, any>;
    custom_welcome_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface Meal {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    box_lunch_image_url: string | null;
    junior_box_lunch_image_url: string | null;
    sandwich_image_url: string | null;
    price: number;
    junior_price: number;
    sandwich_price: number | null;
    box_includes: string | null;
    junior_box_includes: string | null;
    category: 'sandwich' | 'salad' | 'cookie' | 'other';
    lunch_package: 'box' | 'bag';
    allow_split_box: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface CompanyMenuSelection {
    id: string;
    company_id: string;
    meal_id: string;
    is_selected: boolean;
    created_at: string;
}

export interface Order {
    id: string;
    company_id: string;
    customer_name: string;
    guide_name: string | null;
    tour_date: string;
    pickup_time: string | null;
    notes: string | null;
    status: 'pending' | 'ticket_created' | 'fulfilled' | 'cancelled';
    payment_status: 'unpaid' | 'paid' | 'invoiced';
    payment_method: 'stripe' | 'monthly_invoice' | null;
    stripe_payment_id: string | null;
    ticket_created_at: string | null;
    fulfilled_at: string | null;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
    // Joined data
    company?: TourCompany;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    meal_id: string | null;
    meal_name: string;
    quantity: number;
    box_type: 'Box Lunch' | 'Junior Box Lunch' | 'Sandwich only' | null;
    bread_type: 'Sandwich' | 'Make it a wrap' | 'Gluten-free bread' | 'Fresh croissant' | null;
    cookie_choice: string | null;
    customizations: string | null;
    unit_price: number;
    created_at: string;
}

export interface Invoice {
    id: string;
    company_id: string;
    period_start: string;
    period_end: string;
    total_amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    pdf_url: string | null;
    stripe_payment_link: string | null;
    sent_at: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    // Joined data
    company?: TourCompany;
}

export interface ActivityLog {
    id: string;
    user_id: string | null;
    user_email: string | null;
    user_role: 'admin' | 'company' | 'staff' | 'system' | null;
    action: string;
    entity_type: 'order' | 'meal' | 'company' | 'invoice' | 'contract' | 'auth' | 'config' | null;
    entity_id: string | null;
    details: Record<string, any>;
    ip_address: string | null;
    created_at: string;
}

export interface Contract {
    id: string;
    company_id: string;
    pdf_url: string | null;
    status: 'pending' | 'signed' | 'expired';
    signed_at: string | null;
    expires_at: string | null;
    signer_name: string | null;
    signer_email: string | null;
    signer_ip: string | null;
    created_at: string;
    // Joined data
    company?: TourCompany;
}
