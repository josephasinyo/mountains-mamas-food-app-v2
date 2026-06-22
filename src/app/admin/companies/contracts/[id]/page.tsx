import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDateUS } from '@/lib/utils';
import { FileText, Calendar, Globe, User, ShieldCheck } from 'lucide-react';
import { ContractHeader } from './ContractHeader';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export const dynamic = 'force-dynamic';

export default async function ContractDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Fetch the contract details
    const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (contractErr || !contract) {
        return notFound();
    }

    // 2. Fetch the corresponding company details
    const { data: company, error: companyErr } = await supabase
        .from('tour_companies')
        .select('*')
        .eq('id', contract.company_id)
        .maybeSingle();

    if (companyErr || !company) {
        return notFound();
    }

    // Helper to check if signature is drawn (base64 PNG) or typed
    const isDrawn = contract.signature_data && contract.signature_data.startsWith('data:image/png;base64,');
    const signatureText = contract.signature_data && contract.signature_data.startsWith('typed:') 
        ? contract.signature_data.substring(6) 
        : contract.signature_data || '';

    // Standardized date format helper for timestamp
    const formatDateTime = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50 print:bg-white text-gray-900 pb-16 font-sans">
            {/* Dynamic cursive font injection */}
            <link 
                href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" 
                rel="stylesheet" 
            />

            {/* Print action utility header (hidden in printing) */}
            <ContractHeader companyName={company.name} contractStatus={contract.status} />

            {/* Document layout container */}
            <main className="max-w-[850px] mx-auto mt-8 px-4 print:mt-0 print:px-0">
                <article className="bg-white print:shadow-none shadow-xl shadow-gray-200/40 rounded-[24px] border border-gray-100 print:border-none p-12 md:p-16 print:p-0 relative overflow-hidden">
                    {/* Subtle watermarked legal background */}
                    <div className="absolute top-[-10%] right-[-10%] opacity-[0.02] text-gray-900 pointer-events-none select-none -z-10">
                        <FileText size={450} />
                    </div>

                    {/* Official Contract Header */}
                    <div className="border-b border-gray-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-600 mb-2">Corporate Account Agreement</div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">MOUNTAIN MAMA&apos;S CAFÉ</h2>
                            <p className="text-xs text-gray-400 font-medium mt-1.5 leading-relaxed">
                                123 Alpine Ridge Road, Bozeman, MT 59715<br />
                                mountainmamascafe@gmail.com | (406) 461-1024
                            </p>
                        </div>
                        <div className="text-left md:text-right text-xs text-gray-500 space-y-1 bg-gray-50/70 print:bg-transparent p-4 rounded-xl border border-gray-100 print:border-none print:p-0 print:space-y-0.5">
                            <p><strong className="text-gray-900 font-bold uppercase text-[9px] tracking-wider block md:inline md:mr-1">Contract ID:</strong> <span className="font-mono">{contract.id}</span></p>
                            <p><strong className="text-gray-900 font-bold uppercase text-[9px] tracking-wider block md:inline md:mr-1">Signed Date:</strong> {formatDateUS(contract.signed_at)}</p>
                            <p><strong className="text-gray-900 font-bold uppercase text-[9px] tracking-wider block md:inline md:mr-1">Status:</strong> <span className="font-extrabold uppercase text-emerald-600">{contract.status}</span></p>
                        </div>
                    </div>

                    {/* Contract Body */}
                    <div className="mt-8 space-y-6 text-xs text-gray-600 font-medium leading-relaxed font-sans">
                        <p className="text-center font-extrabold text-sm uppercase tracking-wider text-gray-900 pb-2 border-b border-dashed border-gray-100">
                            Corporate Catering & Monthly Invoicing Agreement
                        </p>

                        <div>
                            <h3 className="font-bold text-gray-800 text-xs mb-1">1. Parties & Background</h3>
                            <p>
                                This Catering Agreement (the &quot;Agreement&quot;) is executed dynamically and electronically by and between <strong>Mountain Mama&apos;s Café</strong> (the &quot;Provider&quot;) and the self-onboarded client organization <strong>{company.name}</strong> (the &quot;Company&quot;) in relation to ordering premium custom box lunches for scheduled tours, hikes, and excursions.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 text-xs mb-1">2. Scope of Service & Dedicated Ordering Link</h3>
                            <p>
                                The Provider grants the Company a private white-label menu ordering portal hosted at the dedicated URL: <strong className="text-violet-600 font-bold">/{company.slug}</strong>. The Company agrees to distribute this link directly to all tour clients for independent menu configuration, or utilize it for direct internal order scheduling by guides.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 text-xs mb-1">3. Final Order Finalization & Cutoff Time</h3>
                            <p>
                                To ensure the availability of fresh ingredients and timely preparation, all box lunch orders must be configured and locked exactly <strong>24 hours prior</strong> to the scheduled pickup time. Any orders requested inside this 24-hour cutoff window are subject to direct café management phone approval, kitchen capacity, and immediate stock availability.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 text-xs mb-1">4. Monthly Invoicing, Pricing concealment, & Payments</h3>
                            <p>
                                By signing this monthly invoicing agreement, the Company requests that guest-facing pricing displays be completely concealed during order configuration. The Provider will aggregate all active tour orders fulfilled within each calendar month and submit a consolidated itemized corporate invoice to the Company. <strong>Payment is due upon receipt</strong>, utilizing the designated payment mechanisms of Mountain Mama&apos;s Café.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 text-xs mb-1">5. Cancellation & Adjustments Policy</h3>
                            <p>
                                Cancellations, group size reductions, or changes in product choices must be updated in the system at least 24 hours prior to the scheduled tour. Failure to notify the café within this window will result in the initial registered quantities being billed to the monthly invoice in full.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 text-xs mb-1">6. Electronic Signature Consent & Legal Binding</h3>
                            <p>
                                The representative signing below certifies that they hold the legal authority to bind the registering Company to this financial catering contract. Drawn vector canvas signatures or typed cursive legal text saved in the database are legally binding instruments identical to handwritten ink signatures under the federal ESIGN Act of 2000 and standard electronic transactions regulations.
                            </p>
                        </div>
                    </div>

                    {/* Electronic Signatures Block */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-6">Electronic Execution & Audit Trail</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Representative (Signer) Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black uppercase text-gray-400">Authorized Legal Representative</div>
                                    <div className="border-b border-gray-200 pb-3 flex flex-col justify-end min-h-[90px] relative">
                                        {/* Signature visual rendering */}
                                        {isDrawn ? (
                                            <div className="mb-1 select-none">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={contract.signature_data} 
                                                    alt="Electronic signature vector" 
                                                    className="h-16 object-contain filter contrast-125 saturate-50 mix-blend-multiply" 
                                                />
                                            </div>
                                        ) : signatureText ? (
                                            <div className="mb-2 select-none">
                                                <span 
                                                    style={{ fontFamily: "'Dancing Script', cursive" }} 
                                                    className="text-3xl text-violet-700 tracking-wide block leading-none py-1"
                                                >
                                                    {signatureText}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 italic text-xs mb-1">No signature drawing present</span>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <p className="text-gray-900 font-bold">{contract.signer_name || company.name}</p>
                                    <p className="text-gray-400 font-semibold">{contract.signer_email}</p>
                                    {contract.signer_title && <p className="text-gray-500 font-medium text-[11px]">{contract.signer_title}</p>}
                                </div>
                            </div>

                            {/* Countersigned on Behalf of Provider Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black uppercase text-gray-400">Countersigned on Behalf of Provider</div>
                                    <div className="border-b border-gray-200 pb-3 flex flex-col justify-end min-h-[90px] relative">
                                        <div className="mb-2 select-none">
                                            <span 
                                                style={{ fontFamily: "'Dancing Script', cursive" }} 
                                                className="text-3xl text-gray-500 tracking-wide block leading-none py-1"
                                            >
                                                Mountain Mama Cafe
                                            </span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <p className="text-gray-900 font-bold">Mountain Mama&apos;s Café Operations</p>
                                    <p className="text-gray-400 font-medium">Administrative Team</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Audit Trail Card (At bottom, full width, IP removed) */}
                        <div className="mt-8 bg-gray-50/70 print:bg-white border border-gray-100 p-5 rounded-2xl">
                            <div className="text-[9px] font-black uppercase text-violet-600 tracking-wider flex items-center gap-1.5 mb-3">
                                <ShieldCheck className="size-3.5 text-emerald-500" /> Secure Security Audit Trail
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-gray-600 font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-3.5 text-gray-400" />
                                    <div>
                                        <span className="text-gray-400 font-bold uppercase text-[9px] block">Execution Timestamp</span>
                                        <span className="text-gray-900 font-semibold">{formatDateTime(contract.signed_at)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="size-3.5 text-gray-400" />
                                    <div>
                                        <span className="text-gray-400 font-bold uppercase text-[9px] block">Electronic Method</span>
                                        <span className="text-gray-900 font-semibold">{isDrawn ? 'Hand-Drawn Vector Pad' : 'Cursive Typed Consent'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </main>

            {/* Custom Embedded CSS Styles specifically optimized for A4 / Letter PDF Printing */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Completely hide administrative portal shell, layouts, sidebars, and top navigation header */
                    aside,
                    header,
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Strip left margins, layout container offsets, scroll areas, and background grids */
                    div.min-h-screen,
                    div.flex,
                    div.flex-1,
                    div[class*="flex-col"],
                    div.flex-1.flex.flex-col,
                    main.flex-1.p-8,
                    main {
                        margin: 0 !important;
                        margin-left: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        background: white !important;
                    }
                    
                    body {
                        background-color: #ffffff !important;
                        color: #111827 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        padding: 0 !important;
                    }
                    
                    article {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 8mm 14mm !important;
                        margin: 0 !important;
                        background: transparent !important;
                    }

                    /* Optimized spacing distribution to fill single page beautifully */
                    .pb-8 {
                        padding-bottom: 16px !important;
                    }
                    .gap-6 {
                        gap: 12px !important;
                    }
                    
                    /* Compress margin top of body and signatures */
                    .mt-8 {
                        margin-top: 20px !important;
                    }
                    .mt-12 {
                        margin-top: 28px !important;
                    }
                    .pt-8 {
                        padding-top: 12px !important;
                    }
                    
                    /* Clause body compression */
                    .space-y-6 > * + * {
                        margin-top: 11px !important;
                    }
                    .space-y-6 h3 {
                        margin-bottom: 2px !important;
                        font-size: 11px !important;
                    }
                    .space-y-6 p {
                        font-size: 10.5px !important;
                        line-height: 1.4 !important;
                    }
                    .space-y-6 .text-center {
                        font-size: 12px !important;
                        padding-bottom: 3px !important;
                        margin-bottom: 8px !important;
                    }

                    /* Signatures and layout columns */
                    .mb-6 {
                        margin-bottom: 10px !important;
                    }
                    .gap-8 {
                        gap: 18px !important;
                    }
                    .space-y-4 > * + * {
                        margin-top: 6px !important;
                    }
                    
                    /* Signature pads height and sizing */
                    div[class*="min-h-"] {
                        min-height: 64px !important;
                        padding-bottom: 3px !important;
                    }
                    div[class*="min-h-"] img {
                        height: 46px !important;
                    }
                    div[class*="min-h-"] span[class*="text-3xl"] {
                        font-size: 26px !important;
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                    }
                    
                    /* Signature label detail typography */
                    .space-y-1\\.5 > * + * {
                        margin-top: 2px !important;
                    }
                    .space-y-1\\.5 p {
                        font-size: 10.5px !important;
                    }

                    /* Security audit trail card compression */
                    div[class*="bg-gray-50"] {
                        margin-top: 16px !important;
                        padding: 10px 14px !important;
                        border-radius: 10px !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    div[class*="bg-gray-50"] .grid {
                        gap: 4px !important;
                    }
                    div[class*="bg-gray-50"] .flex {
                        gap: 6px !important;
                    }
                    div[class*="bg-gray-50"] span {
                        font-size: 9.5px !important;
                    }
                    div[class*="bg-gray-50"] p,
                    div[class*="bg-gray-50"] span[class*="font-semibold"] {
                        font-size: 10.5px !important;
                    }
                }
                @page {
                    size: letter;
                    margin: 1.5cm;
                }
            `}} />
        </div>
    );
}
