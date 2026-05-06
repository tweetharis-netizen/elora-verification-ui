import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Citation as CitationType } from '../../lib/llm/types';
import * as pdfjs from 'pdfjs-dist';

// Set worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface EloraPdfViewerAPI {
    currentPage: number;
    totalPages: number;
    goToPage(pageNumber: number): Promise<void>;
    drawHighlight(boundingBox?: { x: number; y: number; w: number; h: number }, snippet?: string): void;
    getPdfUrl(): string | null;
}

// SourcePanel that listens for elora:openCitation and integrates PDF.js
export const SourcePanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [citation, setCitation] = useState<CitationType | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const highlightRef = useRef<HTMLDivElement | null>(null);

    // Cleanup highlights
    const clearHighlights = useCallback(() => {
        if (highlightRef.current) {
            try { document.body.removeChild(highlightRef.current); } catch {}
            highlightRef.current = null;
        }
    }, []);

    // Draw highlight on PDF canvas or text layer
    const drawHighlight = useCallback(async (boundingBox?: { x: number; y: number; w: number; h: number }) => {
        if (!canvasRef.current) return;
        clearHighlights();
        
        if (!boundingBox) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'elora-pdf-bbox-overlay elora-citation-pulse';
        overlay.style.position = 'fixed';
        overlay.style.pointerEvents = 'none';
        overlay.style.left = `${rect.left + boundingBox.x}px`;
        overlay.style.top = `${rect.top + boundingBox.y}px`;
        overlay.style.width = `${boundingBox.w}px`;
        overlay.style.height = `${boundingBox.h}px`;
        overlay.style.border = '3px solid rgba(250, 204, 21, 0.9)';
        overlay.style.background = 'rgba(250,204,21,0.06)';
        overlay.style.zIndex = '99999';
        document.body.appendChild(overlay);
        highlightRef.current = overlay;
        
        setTimeout(() => clearHighlights(), 2200);
    }, [clearHighlights]);

    // Load and render PDF page
    const goToPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc) return;
        try {
            setIsRendering(true);
            const page = await pdfDoc.getPage(Math.min(Math.max(pageNum, 1), pdfDoc.numPages));
            const viewport = page.getViewport({ scale: 1.5 });
            if (canvasRef.current) {
                canvasRef.current.width = viewport.width;
                canvasRef.current.height = viewport.height;
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    await page.render({ canvas: canvasRef.current, viewport }).promise;
                }
            }
            setCurrentPage(pageNum);
        } catch (err) {
            console.error('[SourcePanel] Failed to render page', err);
        } finally {
            setIsRendering(false);
        }
    }, [pdfDoc]);

    // Expose PDF viewer API to window
    useEffect(() => {
        if (pdfDoc) {
            const api: EloraPdfViewerAPI = {
                currentPage,
                totalPages: pdfDoc.numPages,
                goToPage,
                drawHighlight,
                getPdfUrl: () => pdfUrl,
            };
            (window as any).eloraPdfViewer = api;
        }
    }, [pdfDoc, currentPage, goToPage, drawHighlight, pdfUrl]);

    // Listen for citation events
    useEffect(() => {
        const handler = async (e: Event) => {
            const detail = (e as CustomEvent).detail as CitationType | undefined;
            if (!detail) return;
            setCitation(detail);
            setIsOpen(true);
            
            setTimeout(async () => {
                try {
                    const anyWin = window as any;
                    
                    // Try to use PDF viewer if available
                    if (detail.pageNumber && anyWin?.eloraPdfViewer && typeof anyWin.eloraPdfViewer.goToPage === 'function') {
                        try { 
                            await anyWin.eloraPdfViewer.goToPage(detail.pageNumber);
                            if (detail.boundingBox && typeof anyWin.eloraPdfViewer.drawHighlight === 'function') {
                                await anyWin.eloraPdfViewer.drawHighlight(detail.boundingBox);
                            }
                        } catch (err) {
                            console.warn('[SourcePanel] PDF viewer error', err);
                        }
                    }
                    
                    // Fallback: highlight matching snippet in text layer
                    if (detail.snippet && containerRef.current) {
                        const text = detail.snippet.trim().slice(0, 200);
                        if (text.length > 0) {
                            const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);
                            let node: Node | null;
                            while ((node = walker.nextNode())) {
                                if (node.nodeValue && node.nodeValue.toLowerCase().includes(text.toLowerCase())) {
                                    const parent = node.parentElement;
                                    if (parent) {
                                        parent.classList.add('elora-citation-highlight');
                                        parent.classList.add('elora-citation-pulse');
                                        setTimeout(() => parent.classList.remove('elora-citation-pulse'), 1600);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn('[SourcePanel] Citation handler error', err);
                }
            }, 260);
        };

        window.addEventListener('elora:openCitation', handler as EventListener);
        return () => window.removeEventListener('elora:openCitation', handler as EventListener);
    }, []);

    if (!isOpen) return null;

    return (
        <aside className="fixed right-6 top-20 w-[600px] max-h-[75vh] overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-lg p-4 z-40">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-600" />
                    <div>
                        <div className="text-sm font-semibold">Source Viewer</div>
                        <div className="text-xs text-slate-400">Cited content and reference</div>
                    </div>
                </div>
                <button onClick={() => { setIsOpen(false); clearHighlights(); }} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>

            {citation ? (
                <div className="space-y-3">
                    <div className="text-[13px] text-slate-700">
                        <strong>{citation.label ?? citation.sourceId}</strong>
                        {citation.pageNumber ? <span className="ml-2 text-xs text-slate-400">Page {citation.pageNumber}</span> : null}
                    </div>
                    
                    {/* Snippet Preview */}
                    <div className="text-sm text-slate-600 whitespace-pre-wrap p-3 bg-slate-50 border border-slate-100 rounded max-h-32 overflow-y-auto">
                        {citation.snippet ?? 'No snippet available.'}
                    </div>

                    {/* Canvas for PDF rendering */}
                    {pdfDoc && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => goToPage(currentPage - 1)} 
                                    disabled={currentPage <= 1 || isRendering}
                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs text-slate-500 flex-1 text-center">{currentPage} / {totalPages}</span>
                                <button 
                                    onClick={() => goToPage(currentPage + 1)} 
                                    disabled={currentPage >= totalPages || isRendering}
                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <canvas 
                                ref={canvasRef} 
                                className="w-full border border-slate-100 rounded"
                                style={{ maxHeight: '300px' }}
                            />
                        </div>
                    )}
                    
                    <div className="text-xs text-slate-400">
                        {pdfDoc ? 'PDF preview available above.' : 'Snippet preview shown. PDF rendering not available for this source type.'}
                    </div>
                </div>
            ) : (
                <div className="text-sm text-slate-500">No citation selected.</div>
            )}
        </aside>
    );
};

export default SourcePanel;
