'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchInvoiceForPayment, createInvoicePaymentSession } from './actions';
import { toast, Toaster } from 'sonner';

interface InvoiceLineItem {
    description: string;
    amount: number;
    metadata?: any;
}

interface InvoiceData {
    id: string;
    company_name: string;
    company_email: string;
    period_start: string;
    period_end: string;
    total_amount: number;
    discount_percentage: number;
    discount_amount: number;
    tip_amount: number;
    status: string;
    pdf_url: string | null;
    stripe_invoice_id: string | null;
    stripe_payment_link: string | null;
    line_items: InvoiceLineItem[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function InvoicePayPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;

    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tipInput, setTipInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await fetchInvoiceForPayment(invoiceId);
            if (res.success && res.invoice) {
                setInvoice(res.invoice);
            } else {
                setError(res.error || 'Invoice not found.');
            }
            setLoading(false);
        }
        if (invoiceId) load();
    }, [invoiceId]);

    const tipValue = parseFloat(tipInput) || 0;
    const grandTotal = (invoice?.total_amount || 0) + tipValue;

    const handlePay = async () => {
        if (!invoice) return;

        setProcessing(true);
        const toastId = toast.loading('Preparing secure checkout...');

        try {
            const res = await createInvoicePaymentSession(invoice.id, tipValue);
            if (res.success && res.checkoutUrl) {
                toast.success('Redirecting to payment...', { id: toastId });
                window.location.href = res.checkoutUrl;
            } else {
                toast.error(res.error || 'Failed to start checkout.', { id: toastId });
                setProcessing(false);
            }
        } catch {
            toast.error('An unexpected error occurred.', { id: toastId });
            setProcessing(false);
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div style={styles.pageWrapper}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner} />
                    <p style={styles.loadingText}>Loading invoice...</p>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error || !invoice) {
        return (
            <div style={styles.pageWrapper}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>!</div>
                    <h2 style={styles.errorTitle}>Invoice Not Found</h2>
                    <p style={styles.errorMessage}>{error || 'This invoice could not be loaded.'}</p>
                </div>
            </div>
        );
    }

    // --- Already Paid State ---
    if (invoice.status === 'paid') {
        return (
            <div style={styles.pageWrapper}>
                <div style={styles.card}>
                    <div style={styles.headerBar}>
                        <h1 style={styles.headerTitle}>Invoice Paid</h1>
                    </div>
                    <div style={{ padding: '48px 32px', textAlign: 'center' as const }}>
                        <div style={styles.paidCheckmark}>✓</div>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: '16px 0 8px' }}>
                            Payment Received
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                            This invoice for <strong>{invoice.company_name}</strong> has already been paid.
                            {invoice.tip_amount > 0 && (
                                <span> Including a {formatCurrency(invoice.tip_amount)} tip for the sandwich makers! 💜</span>
                            )}
                        </p>
                        {invoice.pdf_url && (
                            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
                                Download PDF Receipt
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- Main Payment View ---
    // Separate line items into regular items and fee/discount items
    const mealItems = invoice.line_items.filter(
        (item) => !item.metadata?.type || item.metadata.type === 'meal'
    );
    const feeItems = invoice.line_items.filter(
        (item) => item.metadata?.type && item.metadata.type !== 'meal'
    );

    const showToggle = mealItems.length > 5;
    const displayedMealItems = showToggle && !isExpanded ? [] : mealItems;
    const lunchesSubtotal = mealItems.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div style={styles.pageWrapper}>
            <Toaster position="top-center" expand richColors />

            <div style={styles.card}>
                {/* Header */}
                <div style={styles.headerBar}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1 style={styles.headerTitle}>Mountain Mama&apos;s Café</h1>
                            <p style={styles.headerSub}>Invoice Payment</p>
                        </div>
                        {invoice.pdf_url && (
                            <a
                                href={invoice.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="download-pdf-btn"
                                style={styles.downloadPdfHeaderBtn}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ marginRight: '6px' }}
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                PDF Invoice
                            </a>
                        )}
                    </div>
                </div>

                {/* Invoice Meta */}
                <div style={styles.metaSection}>
                    <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>Bill To</span>
                        <span style={styles.metaValue}>{invoice.company_name}</span>
                    </div>
                    <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>Period</span>
                        <span style={styles.metaValue}>
                            {formatDate(invoice.period_start)} — {formatDate(invoice.period_end)}
                        </span>
                    </div>
                    <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>Status</span>
                        <span style={{
                            ...styles.statusBadge,
                            backgroundColor: invoice.status === 'sent' ? '#fef3c7' : '#ede9fe',
                            color: invoice.status === 'sent' ? '#92400e' : '#6d28d9',
                        }}>
                            {invoice.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Line Items */}
                {invoice.line_items.length > 0 && (
                    <div style={styles.lineItemsSection}>
                        <h3 style={styles.sectionTitle}>Order Details</h3>
                        <div style={styles.lineItemsTable}>
                            {displayedMealItems.map((item, i) => (
                                <div key={i} style={{
                                    ...styles.lineItemRow,
                                    backgroundColor: item.amount < 0 ? '#f0fdf4' : 'transparent',
                                }}>
                                    <span style={styles.lineItemDesc}>{item.description}</span>
                                    <span style={{
                                        ...styles.lineItemAmount,
                                        color: item.amount < 0 ? '#16a34a' : '#111827',
                                    }}>
                                        {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {showToggle && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="btn-expand"
                                style={styles.expandButton}
                            >
                                <span>{isExpanded ? 'Show Less' : `Show All Orders (${mealItems.length})`}</span>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        )}

                        {/* Lunches Subtotal Row */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 12px 6px',
                            marginTop: '8px',
                            borderTop: '1px solid #f3f4f6',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>Lunches Subtotal</span>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{formatCurrency(lunchesSubtotal)}</span>
                        </div>

                        {feeItems.length > 0 && (
                            <>
                                <div style={{ height: '8px' }} />
                                {feeItems.map((item, i) => (
                                    <div key={`fee-${i}`} style={{
                                        ...styles.lineItemRow,
                                        backgroundColor: item.amount < 0 ? '#f0fdf4' : '#f9fafb',
                                    }}>
                                        <span style={{ ...styles.lineItemDesc, fontSize: '12px', color: '#6b7280' }}>
                                            {item.description}
                                        </span>
                                        <span style={{
                                            ...styles.lineItemAmount,
                                            fontSize: '12px',
                                            color: item.amount < 0 ? '#16a34a' : '#6b7280',
                                        }}>
                                            {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Invoice Total */}
                <div style={styles.totalSection}>
                    <div style={styles.totalRow}>
                        <span style={styles.totalLabel}>Invoice Total</span>
                        <span style={styles.totalAmount}>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                </div>

                {/* Tip Section */}
                <div style={styles.tipSection}>
                    <div style={styles.tipHeader}>
                        <span style={styles.tipEmoji}>💜</span>
                        <div>
                            <h3 style={styles.tipTitle}>Add a Tip for the Sandwich Makers</h3>
                            <p style={styles.tipSubtext}>
                                Show your appreciation for the team that prepares your lunches!
                            </p>
                        </div>
                    </div>

                    {/* Quick Tip Buttons */}
                    <div style={styles.tipButtons}>
                        {[75, 125, 175, 200].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setTipInput(amount.toString())}
                                className="tip-btn"
                                style={{
                                    ...styles.tipButton,
                                    ...(tipValue === amount ? styles.tipButtonActive : {}),
                                }}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>

                    {/* Custom Tip Input */}
                    <div style={styles.tipInputWrapper}>
                        <span style={styles.tipCurrency}>$</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Custom amount"
                            value={tipInput}
                            onChange={(e) => setTipInput(e.target.value)}
                            style={styles.tipInput}
                        />
                    </div>

                    {tipValue > 0 && (
                        <p style={styles.tipConfirm}>
                            Adding {formatCurrency(tipValue)} tip — Thank you! 🎉
                        </p>
                    )}
                </div>

                {/* Grand Total & Pay Button */}
                <div style={styles.paySection}>
                    <div style={styles.grandTotalRow}>
                        <span style={styles.grandTotalLabel}>
                            {tipValue > 0 ? 'Total with Tip' : 'Total Due'}
                        </span>
                        <span style={styles.grandTotalAmount}>
                            {formatCurrency(grandTotal)}
                        </span>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        style={{
                            ...styles.payButton,
                            ...(processing ? styles.payButtonDisabled : {}),
                        }}
                    >
                        {processing ? (
                            <span style={styles.payButtonContent}>
                                <span style={styles.buttonSpinner} />
                                Processing...
                            </span>
                        ) : (
                            <span style={styles.payButtonContent}>
                                🔒 Pay {formatCurrency(grandTotal)} Securely
                            </span>
                        )}
                    </button>

                    <p style={styles.secureNote}>
                        Payments are processed securely by Stripe. Your card details never touch our servers.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <p style={styles.footer}>
                Mountain Mama&apos;s Café · Big Sky, Montana
            </p>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .btn-expand:hover {
                    background-color: #e5e7eb !important;
                    color: #1f2937 !important;
                }
                .tip-btn:hover {
                    border-color: #7c3aed !important;
                    background-color: #faf5ff !important;
                }
                .download-pdf-btn:hover {
                    background-color: rgba(255, 255, 255, 0.25) !important;
                    border-color: rgba(255, 255, 255, 0.4) !important;
                }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────
// Inline styles (no Tailwind dependency)
// ─────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    card: {
        width: '100%',
        maxWidth: '720px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
    },
    headerBar: {
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        padding: '28px 32px',
        color: '#ffffff',
    },
    downloadPdfHeaderBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 14px',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 700,
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        border: '1px solid rgba(255, 255, 255, 0.25)',
    },
    headerTitle: {
        fontSize: '22px',
        fontWeight: 900,
        margin: 0,
        letterSpacing: '-0.5px',
    },
    headerSub: {
        fontSize: '13px',
        opacity: 0.85,
        marginTop: '4px',
        fontWeight: 600,
    },
    metaSection: {
        padding: '24px 32px',
        borderBottom: '1px solid #f3f4f6',
    },
    metaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
    },
    metaLabel: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#9ca3af',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    metaValue: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#111827',
    },
    statusBadge: {
        fontSize: '10px',
        fontWeight: 800,
        padding: '3px 10px',
        borderRadius: '100px',
        letterSpacing: '0.1em',
    },
    lineItemsSection: {
        padding: '24px 32px',
        borderBottom: '1px solid #f3f4f6',
    },
    sectionTitle: {
        fontSize: '11px',
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: '16px',
    },
    lineItemsTable: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    lineItemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: '8px',
    },
    lineItemDesc: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
        flex: 1,
        paddingRight: '16px',
    },
    lineItemAmount: {
        fontSize: '13px',
        fontWeight: 800,
        color: '#111827',
        whiteSpace: 'nowrap' as const,
    },
    feeDivider: {
        height: '1px',
        background: '#e5e7eb',
        margin: '12px 0',
    },
    expandButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        padding: '10px 0',
        marginTop: '12px',
        background: '#f3f4f6',
        border: 'none',
        borderRadius: '10px',
        color: '#4b5563',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    totalSection: {
        padding: '20px 32px',
        borderBottom: '1px solid #f3f4f6',
        background: '#faf5ff',
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    totalLabel: {
        fontSize: '14px',
        fontWeight: 800,
        color: '#374151',
    },
    totalAmount: {
        fontSize: '24px',
        fontWeight: 900,
        color: '#6d28d9',
    },
    tipSection: {
        padding: '28px 32px',
        borderBottom: '1px solid #f3f4f6',
        background: 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)',
    },
    tipHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '20px',
    },
    tipEmoji: {
        fontSize: '28px',
        lineHeight: '1',
        flexShrink: 0,
    },
    tipTitle: {
        fontSize: '16px',
        fontWeight: 800,
        color: '#111827',
        margin: '0 0 4px',
    },
    tipSubtext: {
        fontSize: '13px',
        color: '#6b7280',
        margin: 0,
        fontWeight: 500,
    },
    tipButtons: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '12px',
    },
    tipButton: {
        padding: '10px',
        borderRadius: '12px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
        background: '#ffffff',
        fontSize: '15px',
        fontWeight: 800,
        color: '#374151',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    tipButtonActive: {
        borderColor: '#7c3aed',
        background: '#ede9fe',
        color: '#6d28d9',
    },
    tipInputWrapper: {
        display: 'flex',
        alignItems: 'center',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '0 16px',
        background: '#ffffff',
        transition: 'border-color 0.15s ease',
    },
    tipCurrency: {
        fontSize: '18px',
        fontWeight: 800,
        color: '#9ca3af',
        marginRight: '4px',
    },
    tipInput: {
        width: '100%',
        padding: '12px 0',
        border: 'none',
        outline: 'none',
        fontSize: '18px',
        fontWeight: 700,
        color: '#111827',
        background: 'transparent',
    },
    tipConfirm: {
        marginTop: '12px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#7c3aed',
        textAlign: 'center' as const,
    },
    paySection: {
        padding: '28px 32px 32px',
    },
    grandTotalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '20px',
    },
    grandTotalLabel: {
        fontSize: '16px',
        fontWeight: 800,
        color: '#111827',
    },
    grandTotalAmount: {
        fontSize: '28px',
        fontWeight: 900,
        color: '#111827',
    },
    payButton: {
        width: '100%',
        padding: '16px',
        borderRadius: '14px',
        border: 'none',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
    },
    payButtonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    payButtonContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    buttonSpinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        display: 'inline-block',
    },
    secureNote: {
        marginTop: '16px',
        fontSize: '11px',
        color: '#9ca3af',
        textAlign: 'center' as const,
        fontWeight: 600,
    },
    footer: {
        marginTop: '24px',
        fontSize: '12px',
        color: '#9ca3af',
        fontWeight: 600,
    },

    // Loading
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #ede9fe',
        borderTopColor: '#7c3aed',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#6b7280',
    },

    // Error
    errorCard: {
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
        padding: '48px 32px',
        textAlign: 'center' as const,
    },
    errorIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#fef2f2',
        color: '#ef4444',
        fontSize: '24px',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    errorTitle: {
        fontSize: '20px',
        fontWeight: 900,
        color: '#111827',
        margin: '0 0 8px',
    },
    errorMessage: {
        fontSize: '14px',
        color: '#6b7280',
        margin: 0,
    },

    // Paid
    paidCheckmark: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
    },
    downloadLink: {
        display: 'inline-block',
        marginTop: '20px',
        padding: '10px 24px',
        borderRadius: '12px',
        background: '#f3f4f6',
        color: '#374151',
        fontSize: '13px',
        fontWeight: 700,
        textDecoration: 'none',
    },
};
