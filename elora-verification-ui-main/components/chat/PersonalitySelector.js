// components/chat/PersonalitySelector.js
// AI personality mode selector for adaptive responses

import { motion } from 'framer-motion';

export default function PersonalitySelector({ selected, onChange }) {
    const personalities = [
        {
            id: 'encouraging',
            name: 'Encouraging Coach',
            icon: '🌟',
            description: 'Warm, supportive, celebrates progress',
            gradient: 'from-secondary-400 to-tertiary-400',
            textColor: 'text-secondary-700 dark:text-secondary-300',
        },
        {
            id: 'socratic',
            name: 'Socratic Guide',
            icon: '🤔',
            description: 'Asks guiding questions, helps you discover',
            gradient: 'from-primary-400 to-secondary-400',
            textColor: 'text-primary-700 dark:text-primary-300',
        },
        {
            id: 'strict',
            name: 'Academic Expert',
            icon: '📚',
            description: 'Direct, rigorous, focused on accuracy',
            gradient: 'from-neutral-400 to-primary-400',
            textColor: 'text-neutral-700 dark:text-neutral-300',
        },
    ];

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-text-secondary">AI Personality</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {personalities.map((personality) => {
                    const isSelected = selected === personality.id;

                    return (
                        <motion.button
                            key={personality.id}
                            onClick={() => onChange(personality.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                                    : 'border-border-primary hover:border-primary-300 dark:hover:border-primary-700'
                                }`}
                        >
                            {/* Gradient Background */}
                            {isSelected && (
                                <div className={`absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl`} />
                            )}

                            <div className="relative">
                                {/* Icon */}
                                <div className="text-3xl mb-2">{personality.icon}</div>

                                {/* Name */}
                                <div className={`font-bold mb-1 ${isSelected ? personality.textColor : 'text-text-primary'}`}>
                                    {personality.name}
                                </div>

                                {/* Description */}
                                <p className="text-xs text-text-secondary">
                                    {personality.description}
                                </p>

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
