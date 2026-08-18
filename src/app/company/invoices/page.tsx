import React from 'react';
import CompanyInvoicesClient from './CompanyInvoicesClient';
import { fetchCompanyInvoices } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Invoices & Receipts | Company Dashboard',
    description: 'View and pay invoices for tour catering orders.',
};

export default async function CompanyInvoicesPage() {
    const data = await fetchCompanyInvoices();
    return <CompanyInvoicesClient initialData={data} />;
}
