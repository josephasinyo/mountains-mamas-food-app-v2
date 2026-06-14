export interface FoodItem {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    price: number;
    junior_price?: number;
    sandwich_price?: number;
    box_includes: string | null;
    junior_box_includes?: string | null;
    category: string;
    is_active: boolean;
    sort_order: number;
    box_lunch_image_url?: string | null;
    junior_box_lunch_image_url?: string | null;
    sandwich_image_url?: string | null;
    lunch_package?: 'box' | 'bag';
    allow_split_box: boolean;
}

export interface CartItem {
    cartId: string; // unique id for cart item (e.g. foodId + options)
    id: string;     // meal_id
    name: string;
    quantity: number;
    selectedOption?: string;
    unitPrice: number;
    guest_name?: string;
    customizations?: string;
    bread_type?: string;
    cookie_choice?: string;
    dynamic_fields?: any;
}

export interface CompanyConfig {
    id: string;
    company_id: string;
    show_box_lunch_category: boolean;
    show_junior_box_lunch_category: boolean;
    use_split_box_types?: boolean;
    use_sandwich_only?: boolean;
    show_prices: boolean;
    show_stripe_checkout: boolean;
    meal_page_options: any;
    confirmation_page_fields: any;
    custom_welcome_message: string | null;
    use_mountain_mamas_branding?: boolean;
}

export interface TourCompany {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    payment_method: 'direct_pay' | 'monthly_invoice';
    status: 'pending_approval' | 'active' | 'suspended';
    representative_name?: string | null;
    representative_title?: string | null;
    discount_percentage?: number;
    prep_instructions?: string | null;
    default_slug?: string | null;
    generic_slug?: string | null;
}
