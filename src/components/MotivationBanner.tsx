import React from 'react';
import { Flame, Star, Zap, TrendingUp, Sparkles } from 'lucide-react';

interface MotivationBannerProps {
    streakWeeks: number;
    levelLabel: string;
    xpEstimate: string;
    motivationalMessage?: string;
}

const MotivationBanner: React.FC<MotivationBannerProps> = ({ 
    streakWeeks, 
    levelLabel, 
    xpEstimate,
    motivationalMessage = "You're making great progress! Keep the momentum going."
}) => {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#EAE7DD] shadow-lg mb-8 group">
            {/* Background Gradient & Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#68507B] via-[#8D769A] to-[#7BB099] opacity-95 group-hover:scale-105 transition-transform duration-700"></div>
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            
            {/* Content Container */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Streak Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-sm animate-pulse">
                            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                            <span className="text-sm font-bold tracking-tight">
                                {streakWeeks} week streak
                            </span>
                        </div>
                        
                        {/* Level/XP Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10 backdrop-blur-md rounded-full border border-white/10">
                            <TrendingUp className="w-4 h-4 text-emerald-300" />
                            <span className="text-sm font-semibold">
                                {levelLabel} • {xpEstimate}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
                            Welcome back! <Sparkles className="w-6 h-6 text-yellow-300" />
                        </h2>
                        <p className="text-white/80 text-lg font-medium max-w-lg leading-relaxed italic">
                            "{motivationalMessage}"
                        </p>
                    </div>
                </div>
                
                {/* Visual Accent */}
                <div className="hidden lg:block">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-2xl rotate-12 flex items-center justify-center border border-white/20 shadow-2xl relative">
                        <Star className="w-12 h-12 text-yellow-300 fill-yellow-300 animate-bounce" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white">
                             HOT
                        </div>
                    </div>
                </div>
                
                {/* Today's Stats mini-pills */}
                <div className="flex flex-col gap-2 md:w-48 shrink-0">
                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">Topic Mastered</span>
                        <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">Next Milestone</span>
                        <ChevronRight className="w-4 h-4 text-white/50" />
                    </div>
                </div>
            </div>
        </section>
    );
};

// Internal minimal Chevron for avoidance of extra imports if needed, but we have Lucide
const ChevronRight = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default MotivationBanner;
