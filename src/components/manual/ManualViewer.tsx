'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, Printer, BookOpen, ChevronRight, ChevronLeft,
    ZoomIn, X, FileText, CheckCircle2, AlertTriangle, Lightbulb, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { safePrint } from '@/lib/utils';
import { ManualData, ManualSection } from '@/lib/manuals-data';

interface ManualViewerProps {
    data: ManualData;
}

// Helper to style directory paths (e.g. /admin, /company/settings, /cart) as interactive clickable badges
function formatBadgeText(text: string): React.ReactNode {
    if (!text) return text;
    
    // Regex matching route paths starting with / followed by word chars, hyphens, brackets, or slashes
    const pathRegex = /(\/(?:[a-zA-Z0-9_\-\[\]]+)(?:\/[a-zA-Z0-9_\-\[\]]+)*)/g;
    const parts = text.split(pathRegex);

    return parts.map((part, i) => {
        if (part.startsWith('/') && part.length > 1 && !part.includes(' ')) {
            // Dynamic route placeholders like /[slug] or /[id] cannot be passed to Next.js <Link> in App Router
            if (part.includes('[') || part.includes(']')) {
                return (
                    <span
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-gray-100 border border-gray-200 text-violet-700 font-mono text-xs font-semibold shadow-2xs"
                    >
                        <span>{part}</span>
                    </span>
                );
            }

            return (
                <Link
                    key={i}
                    href={part}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-gray-100 border border-gray-200 text-violet-700 font-mono text-xs font-semibold shadow-2xs hover:bg-violet-100 hover:border-violet-300 hover:text-violet-900 transition-colors group/link cursor-pointer"
                    title={`Click to navigate to ${part}`}
                >
                    <span>{part}</span>
                    <ExternalLink className="size-2.5 text-violet-500 opacity-60 group-hover/link:opacity-100 transition-opacity shrink-0" />
                </Link>
            );
        }
        return part;
    });
}

function SectionContent({ 
    section, 
    onZoomImage 
}: { 
    section: ManualSection; 
    onZoomImage: (img: { src: string; alt?: string }) => void;
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>{section.title}</span>
            </h2>

            {section.description && (
                <div className="bg-indigo-50/70 border-l-4 border-indigo-500 p-4 rounded-r-2xl text-xs md:text-sm text-indigo-950 font-medium my-3 shadow-2xs">
                    {formatBadgeText(section.description)}
                </div>
            )}

            {section.paragraphs && section.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">
                    {formatBadgeText(p)}
                </p>
            ))}

            {section.steps && section.steps.length > 0 && (
                <ol className="space-y-2.5 my-4">
                    {section.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-gray-700 leading-relaxed">
                            <span className="size-6 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="pt-0.5">{formatBadgeText(step)}</span>
                        </li>
                    ))}
                </ol>
            )}

            {/* Section Image */}
            {section.image && (
                <figure className="mt-8 mb-6 space-y-2.5 group/img">
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 group-hover/img:shadow-md transition-shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={section.image.src} 
                            alt={section.image.alt} 
                            className="w-full h-auto object-cover max-h-[520px] cursor-pointer"
                            onClick={() => onZoomImage({ src: section.image!.src, alt: section.image!.alt })}
                        />
                        <button
                            onClick={() => onZoomImage({ src: section.image!.src, alt: section.image!.alt })}
                            className="print:hidden absolute bottom-3 right-3 size-8 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                        >
                            <ZoomIn className="size-4" />
                        </button>
                    </div>
                    {section.image.caption && (
                        <figcaption className="text-center text-xs text-gray-500 font-medium italic pt-1">
                            {section.image.caption}
                        </figcaption>
                    )}
                </figure>
            )}

            {/* Subsections */}
            {section.subsections && section.subsections.map((sub, sIdx) => (
                <div key={sIdx} className="bg-gray-50/70 p-4 md:p-6 rounded-2xl border border-gray-100 space-y-3.5 mt-4">
                    {sub.title && (
                        <h3 className="font-extrabold text-sm md:text-base text-gray-900">
                            {sub.title}
                        </h3>
                    )}
                    {sub.paragraphs && sub.paragraphs.map((sp, pIdx) => (
                        <p key={pIdx} className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            {formatBadgeText(sp)}
                        </p>
                    ))}
                    {sub.steps && (
                        <ul className="space-y-2">
                            {sub.steps.map((ss, stIdx) => (
                                <li key={stIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-700">
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{formatBadgeText(ss)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* Subsection Images */}
                    {(sub.images || (sub.image ? [sub.image] : [])).map((imgObj, iIdx) => (
                        <figure key={iIdx} className="mt-6 mb-4 space-y-2.5 group/img">
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 group-hover/img:shadow-md transition-shadow">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={imgObj.src} 
                                    alt={imgObj.alt} 
                                    className="w-full h-auto max-h-[460px] object-cover cursor-pointer"
                                    onClick={() => onZoomImage({ src: imgObj.src, alt: imgObj.alt })}
                                />
                                <button
                                    onClick={() => onZoomImage({ src: imgObj.src, alt: imgObj.alt })}
                                    className="print:hidden absolute bottom-3 right-3 size-8 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                                >
                                    <ZoomIn className="size-4" />
                                </button>
                            </div>
                            {imgObj.caption && (
                                <figcaption className="text-center text-xs text-gray-500 font-medium italic pt-1">
                                    {imgObj.caption}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                    {sub.tip && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-950 border border-amber-200/80 text-xs font-medium">
                            <Lightbulb className="size-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{formatBadgeText(sub.tip)}</span>
                        </div>
                    )}
                </div>
            ))}

            {/* Tips & Warnings */}
            {section.tip && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 text-amber-950 border border-amber-200/80 text-xs md:text-sm font-medium my-4">
                    <Lightbulb className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <span className="font-bold text-amber-900 block">Pro-Tip</span>
                        <p className="text-amber-900/90">{formatBadgeText(section.tip)}</p>
                    </div>
                </div>
            )}

            {section.warning && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 text-rose-950 border border-rose-200/80 text-xs md:text-sm font-medium my-4">
                    <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <span className="font-bold text-rose-900 block">Important Note</span>
                        <p className="text-rose-900/90">{formatBadgeText(section.warning)}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ManualViewer({ data }: ManualViewerProps) {
    const [selectedSectionId, setSelectedSectionId] = useState<string>(data.sections[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [zoomImage, setZoomImage] = useState<{ src: string; alt?: string } | null>(null);

    // If active section ID is not found, reset to first section
    useEffect(() => {
        if (!data.sections.some(s => s.id === selectedSectionId) && data.sections.length > 0) {
            setSelectedSectionId(data.sections[0].id);
        }
    }, [data.sections, selectedSectionId]);

    // Filter sections based on search query for TOC
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return data.sections;
        const q = searchQuery.toLowerCase();
        
        return data.sections.filter(sec => {
            if (sec.title.toLowerCase().includes(q)) return true;
            if (sec.description?.toLowerCase().includes(q)) return true;
            if (sec.paragraphs?.some(p => p.toLowerCase().includes(q))) return true;
            if (sec.steps?.some(s => s.toLowerCase().includes(q))) return true;
            if (sec.subsections?.some(sub => 
                sub.title?.toLowerCase().includes(q) ||
                sub.paragraphs?.some(p => p.toLowerCase().includes(q)) ||
                sub.steps?.some(s => s.toLowerCase().includes(q))
            )) return true;
            return false;
        });
    }, [data.sections, searchQuery]);

    // Find current active section
    const currentSectionIndex = data.sections.findIndex(s => s.id === selectedSectionId);
    const currentSection = data.sections[currentSectionIndex] || data.sections[0];

    const prevSection = currentSectionIndex > 0 ? data.sections[currentSectionIndex - 1] : null;
    const nextSection = currentSectionIndex < data.sections.length - 1 ? data.sections[currentSectionIndex + 1] : null;

    const handleSelectSection = (id: string) => {
        setSelectedSectionId(id);
        // Scroll smoothly to top of manual content on mobile / small screens
        const mainContent = document.getElementById('manual-main-content');
        if (mainContent && window.innerWidth < 1024) {
            mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header & Controls (Hidden during browser print) */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-indigo-200/50">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
                        <BookOpen className="size-3.5" />
                        <span>User Manual</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">{data.title}</h1>
                    <p className="text-white/80 text-sm max-w-xl font-medium">{data.subtitle}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button 
                        onClick={() => safePrint()} 
                        className="rounded-xl bg-white text-indigo-900 hover:bg-white/90 font-bold shadow-lg gap-2 text-xs md:text-sm cursor-pointer"
                    >
                        <Printer className="size-4" />
                        <span>Print / Save PDF</span>
                    </Button>
                </div>
            </div>

            {/* Interactive Screen Layout (TOC on Left, Active Section on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:hidden">
                {/* Sidebar Table of Contents */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
                    <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden bg-white">
                        <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <FileText className="size-4 text-violet-600" />
                                Table of Contents
                            </h3>
                            <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-800 font-bold">
                                {data.sections.length} Sections
                            </Badge>
                        </div>

                        {/* Search Filter */}
                        <div className="p-3 border-b border-gray-100 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                                <Input 
                                    type="text"
                                    placeholder="Search manual topics..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 text-xs h-9 rounded-xl border-gray-200 focus-visible:ring-violet-500"
                                />
                            </div>
                        </div>

                        {/* TOC List */}
                        <div className="max-h-[65vh] overflow-y-auto p-2 space-y-1.5">
                            {filteredSections.length === 0 ? (
                                <div className="text-center py-6 px-3">
                                    <p className="text-xs text-gray-500">No matching sections found.</p>
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="text-xs text-violet-600 font-semibold hover:underline mt-1 cursor-pointer"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                filteredSections.map((section) => {
                                    const isSelected = section.id === selectedSectionId;
                                    const origIdx = data.sections.findIndex(s => s.id === section.id);

                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => handleSelectSection(section.id)}
                                            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-200 translate-x-0.5' 
                                                    : 'font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <span className={`size-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-700'
                                                }`}>
                                                    {origIdx + 1}
                                                </span>
                                                <span className="truncate">{section.title}</span>
                                            </div>
                                            <ChevronRight className={`size-3.5 shrink-0 transition-transform ${
                                                isSelected ? 'text-white translate-x-0.5' : 'text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5'
                                            }`} />
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* Main Content Pane (Displays ONLY the Selected Section) */}
                <div id="manual-main-content" className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-8 min-h-[500px]">
                    {currentSection ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSection.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                {/* Section Category / Counter Badge */}
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-200/60">
                                        Section {currentSectionIndex + 1} of {data.sections.length}
                                    </span>
                                </div>

                                {/* Active Section Body */}
                                <SectionContent 
                                    section={currentSection} 
                                    onZoomImage={setZoomImage} 
                                />

                                {/* Section Navigation Controls (Previous / Next) */}
                                <div className="border-t border-gray-100 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {prevSection ? (
                                        <button
                                            onClick={() => handleSelectSection(prevSection.id)}
                                            className="w-full sm:w-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-900 transition-all text-xs font-bold group cursor-pointer"
                                        >
                                            <ChevronLeft className="size-4 text-gray-400 group-hover:text-violet-600 transition-colors shrink-0" />
                                            <div className="text-left">
                                                <div className="text-[10px] text-gray-400 font-medium">Previous Section</div>
                                                <div className="truncate max-w-[200px]">{prevSection.title}</div>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="hidden sm:block" />
                                    )}

                                    {nextSection && (
                                        <button
                                            onClick={() => handleSelectSection(nextSection.id)}
                                            className="w-full sm:w-auto flex items-center justify-end gap-2.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200 transition-all text-xs font-bold group cursor-pointer ml-auto"
                                        >
                                            <div className="text-right">
                                                <div className="text-[10px] text-white/70 font-medium">Next Section</div>
                                                <div className="truncate max-w-[200px]">{nextSection.title}</div>
                                            </div>
                                            <ChevronRight className="size-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-sm">Please select a section from the Table of Contents.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Print-Only Layout (Renders All Sections Sequentially for Clean PDF Export) */}
            <div className="hidden print:block space-y-12">
                <div className="border-b-2 border-gray-900 pb-4 mb-8">
                    <h1 className="text-3xl font-black text-gray-900">{data.title}</h1>
                    <p className="text-gray-600 text-sm mt-1">{data.subtitle}</p>
                </div>
                {data.sections.map((sec) => (
                    <div key={sec.id} className="break-inside-avoid border-b border-gray-200 pb-8 space-y-4">
                        <SectionContent 
                            section={sec} 
                            onZoomImage={() => {}} 
                        />
                    </div>
                ))}
            </div>

            {/* Full-Screen Image Lightbox Modal */}
            <AnimatePresence>
                {zoomImage && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setZoomImage(null)}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 cursor-zoom-out"
                    >
                        {/* Close button */}
                        <button 
                            onClick={() => setZoomImage(null)}
                            className="absolute top-6 right-6 z-10 size-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-xl cursor-pointer"
                            title="Close full screen"
                        >
                            <X className="size-6" />
                        </button>

                        {/* Full Screen Image Container */}
                        <div className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={zoomImage.src} 
                                alt={zoomImage.alt || 'Full screen view'} 
                                className="max-w-[95vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10 cursor-default"
                            />

                            {zoomImage.alt && (
                                <p className="text-xs md:text-sm text-gray-200 font-medium mt-4 text-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                                    {zoomImage.alt}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
