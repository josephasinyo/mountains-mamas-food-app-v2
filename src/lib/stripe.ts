import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-04-22.dahlia', // Use a stable version
  typescript: true,
});

export const getStripeSession = async (sessionId: string) => {
  return await stripe.checkout.sessions.retrieve(sessionId);
};

export const createCheckoutSession = async (params: Stripe.Checkout.SessionCreateParams) => {
  return await stripe.checkout.sessions.create(params);
};

export const createStripeCustomer = async (email: string, name: string, metadata?: Record<string, string>) => {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
};

export const createPaymentLink = async (lineItems: Stripe.PaymentLinkCreateParams.LineItem[], metadata?: Record<string, string>) => {
  return await stripe.paymentLinks.create({
    line_items: lineItems,
    metadata,
  });
};

export const getOrCreateStripeCustomer = async (companyId: string, email: string, name: string) => {
    const { createAdminClient } = await import('./supabase/server');
    const supabase = createAdminClient();

    // 1. Check if we already have it in Supabase
    const { data: company } = await supabase
        .from('tour_companies')
        .select('stripe_customer_id')
        .eq('id', companyId)
        .single();

    if (company?.stripe_customer_id) {
        return company.stripe_customer_id;
    }

    // 2. Search in Stripe by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
        const stripeId = customers.data[0].id;
        // Sync to Supabase
        await supabase.from('tour_companies').update({ stripe_customer_id: stripeId }).eq('id', companyId);
        return stripeId;
    }

    // 3. Create new customer
    const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: { company_id: companyId }
    });

    // Sync to Supabase
    await supabase.from('tour_companies').update({ stripe_customer_id: newCustomer.id }).eq('id', companyId);
    
    return newCustomer.id;
};
