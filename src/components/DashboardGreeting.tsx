import React from 'react';
import { buildUnifiedGreeting } from './Copilot/CopilotShared';

interface DashboardGreetingProps {
    displayName: string;
    subtext?: string;
    textColor?: string;
    className?: string;
    subtextClass?: string;
}

/**
 * Standardized Dashboard Greeting component.
 * Uses buildUnifiedGreeting to provide time-aware "Good morning/afternoon/evening, Name!" 
 * with consistent bold typography.
 */
const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ 
    displayName, 
    subtext, 
    textColor = 'text-white',
    className = "",
    subtextClass = "opacity-90"
}) => {
    const greeting = buildUnifiedGreeting(displayName);
    
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <h1 className={`text-2xl md:text-3xl lg:text-4xl font-extrabold ${textColor} tracking-tight leading-tight`}>
                {greeting}!
            </h1>
            {subtext && (
                <p className={`text-sm md:text-base font-medium ${textColor} ${subtextClass}`}>
                    {subtext}
                </p>
            )}
        </div>
    );
};

export default DashboardGreeting;
