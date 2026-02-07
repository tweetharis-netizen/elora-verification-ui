// components/RubricBuilder.js
// Interactive rubric creation interface

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RubricBuilder({ initialRubric = null, onSave, onCancel }) {
    const [criteria, setCriteria] = useState(initialRubric?.criteria || [
        {
            id: Date.now(),
            name: '',
            description: '',
            weight: 25,
            levels: [
                { name: 'Excellent', points: 4, description: '' },
                { name: 'Good', points: 3, description: '' },
                { name: 'Satisfactory', points: 2, description: '' },
                { name: 'Needs Improvement', points: 1, description: '' },
            ],
        },
    ]);

    const addCriterion = () => {
        setCriteria([...criteria, {
            id: Date.now(),
            name: '',
            description: '',
            weight: 25,
            levels: [
                { name: 'Excellent', points: 4, description: '' },
                { name: 'Good', points: 3, description: '' },
                { name: 'Satisfactory', points: 2, description: '' },
                { name: 'Needs Improvement', points: 1, description: '' },
            ],
        }]);
    };

    const removeCriterion = (id) => {
        setCriteria(criteria.filter(c => c.id !== id));
    };

    const updateCriterion = (id, field, value) => {
        setCriteria(criteria.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    const updateLevel = (criterionId, levelIndex, field, value) => {
        setCriteria(criteria.map(c =>
            c.id === criterionId
                ? {
                    ...c,
                    levels: c.levels.map((l, idx) =>
                        idx === levelIndex ? { ...l, [field]: value } : l
                    ),
                }
                : c
        ));
    };

    const handleSave = () => {
        const rubric = { criteria };
        onSave(rubric);
    };

    const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Rubric Builder</h2>
                    <p className="text-xs font-normal text-neutral-500 mt-2">Define grading criteria and performance levels</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-neutral-500">Total Weight:</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {totalWeight}%
                    </span>
                </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {criteria.map((criterion, criterionIdx) => (
                        <motion.div
                            key={criterion.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="elora-card p-4 space-y-4"
                        >
                            {/* Criterion Header */}
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Criterion name (e.g., Content & Understanding)"
                                        value={criterion.name}
                                        onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                                        className="elora-input text-base"
                                    />
                                    <textarea
                                        placeholder="Description of what this criterion evaluates..."
                                        value={criterion.description}
                                        onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                                        className="elora-input min-h-[64px]"
                                        rows={2}
                                    />
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Weight:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={criterion.weight}
                                            onChange={(e) => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                                            className="elora-input w-20 text-center"
                                        />
                                        <span className="text-sm font-normal text-neutral-500">%</span>
                                    </div>
                                </div>

                                {criteria.length > 1 && (
                                    <button
                                        onClick={() => removeCriterion(criterion.id)}
                                        className="elora-btn elora-btn-secondary"
                                        type="button"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Performance Levels */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                {criterion.levels.map((level, levelIdx) => (
                                    <div key={levelIdx} className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                placeholder="Level name"
                                                value={level.name}
                                                onChange={(e) => updateLevel(criterion.id, levelIdx, 'name', e.target.value)}
                                                className="elora-input flex-1 mr-2"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={level.points}
                                                    onChange={(e) => updateLevel(criterion.id, levelIdx, 'points', Number(e.target.value))}
                                                    className="elora-input w-16 text-center"
                                                />
                                                <span className="text-xs font-normal text-neutral-500">pts</span>
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder="Description of this performance level..."
                                            value={level.description}
                                            onChange={(e) => updateLevel(criterion.id, levelIdx, 'description', e.target.value)}
                                            className="elora-input min-h-[48px] text-xs"
                                            rows={2}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Criterion Button */}
            <button onClick={addCriterion} className="elora-btn elora-btn-secondary w-full" type="button">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Criterion
            </button>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button onClick={onCancel} className="elora-btn elora-btn-secondary flex-1" type="button">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="elora-btn elora-btn-primary flex-1"
                    disabled={totalWeight !== 100 || criteria.some(c => !c.name)}
                    type="button"
                >
                    Save Rubric
                </button>
            </div>

            {totalWeight !== 100 && (
                <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300 text-center" role="alert">
                    Total weight must equal 100%
                </p>
            )}
        </div>
    );
}
