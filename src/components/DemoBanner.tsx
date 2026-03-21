// src/components/DemoBanner.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const DemoBanner = () => (
    <div
        className="bg-[#FAF8F4] border-b border-[#E8E4DA] py-[7px] px-5 flex items-center justify-center gap-2.5 text-[12px] text-[#6B6456] font-medium tracking-[0.01em]"
    >
        <span
            className="inline-block w-[7px] h-[7px] rounded-full bg-[#C9A96E] shrink-0"
        />
        <span>You're viewing demo data</span>
        <span className="text-[#D0CAC0]">·</span>
        <Link
            to="/"
            className="text-[#5B7B7A] font-semibold no-underline hover:underline transition-all"
        >
            Exit demo
        </Link>
    </div>
);

export default DemoBanner;
