import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface ClassroomBreadcrumbProps {
    className?: string;
    items: {
        label: string;
        href?: string;
    }[];
}

export function ClassroomBreadcrumb({ items, className = '' }: ClassroomBreadcrumbProps) {
    return (
        <nav className={`flex items-center gap-1 text-xs md:text-sm text-slate-500 mb-4 ${className}`} aria-label="Breadcrumb">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.href ? (
                        <Link
                            to={item.href}
                            className="hover:text-[#68507B] hover:underline transition-colors font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-bold text-slate-900 truncate">
                            {item.label}
                        </span>
                    )}
                    {index < items.length - 1 && (
                        <ChevronRight size={14} className="text-slate-300 mx-0.5" strokeWidth={3} />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
