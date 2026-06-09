'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchInvoiceForPayment } from '../pay/actions';

export default function InvoiceSuccessPage() {
    const params = useParams();
    const invoiceId = params.id as string;
    const [companyName, setCompanyName] = useState('');
    const [tipAmount, setTipAmount] = useState(0);

    useEffect(() => {
        async function load() {
            const res = await fetchInvoiceForPayment(invoiceId);
            if (res.success && res.invoice) {
                setCompanyName(res.invoice.company_name);
                setTipAmount(res.invoice.tip_amount || 0);
            }
        }
        if (invoiceId) load();
    }, [invoiceId]);

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.card}>
                <div style={styles.iconWrapper}>
                    <div style={styles.checkmark}>✓</div>
                </div>

                <h1 style={styles.title}>Payment Successful!</h1>

                <p style={styles.message}>
                    Thank you{companyName ? `, ${companyName}` : ''}! Your invoice payment has been received
                    and processed successfully.
                </p>

                {tipAmount > 0 && (
                    <div style={styles.tipNote}>
                        <span style={styles.tipEmoji}>💜</span>
                        <p style={styles.tipText}>
                            Your ${tipAmount.toFixed(2)} tip for the sandwich makers means the world to us!
                        </p>
                    </div>
                )}

                <div style={styles.divider} />

                <p style={styles.footer}>
                    A receipt has been sent to your email. If you have any questions,
                    please contact Kim at{' '}
                    <a href="mailto:mountainmamascafe@gmail.com" style={styles.emailLink}>
                        mountainmamascafe@gmail.com
                    </a>
                </p>
            </div>

            <p style={styles.brand}>Mountain Mama&apos;s Café · Big Sky, Montana</p>

            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    card: {
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
        padding: '48px 32px',
        textAlign: 'center' as const,
        animation: 'fadeUp 0.6s ease-out',
    },
    iconWrapper: {
        marginBottom: '24px',
    },
    checkmark: {
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        fontSize: '36px',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        animation: 'popIn 0.5s ease-out 0.2s both',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
    },
    title: {
        fontSize: '26px',
        fontWeight: 900,
        color: '#111827',
        margin: '0 0 12px',
        letterSpacing: '-0.5px',
    },
    message: {
        fontSize: '15px',
        color: '#6b7280',
        lineHeight: 1.6,
        margin: '0 0 24px',
        fontWeight: 500,
    },
    tipNote: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#faf5ff',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '24px',
        border: '1px solid #ede9fe',
    },
    tipEmoji: {
        fontSize: '24px',
        flexShrink: 0,
    },
    tipText: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#6d28d9',
        margin: 0,
        textAlign: 'left' as const,
    },
    divider: {
        height: '1px',
        background: '#f3f4f6',
        margin: '0 0 24px',
    },
    footer: {
        fontSize: '13px',
        color: '#9ca3af',
        lineHeight: 1.6,
        margin: 0,
    },
    emailLink: {
        color: '#7c3aed',
        fontWeight: 700,
        textDecoration: 'none',
    },
    brand: {
        marginTop: '24px',
        fontSize: '12px',
        color: '#9ca3af',
        fontWeight: 600,
    },
};
