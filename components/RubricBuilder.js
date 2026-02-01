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
                    <h2 className="text-2xl font-bold text-text-primary">Rubric Builder</h2>
                    <p className="text-text-secondary mt-1">Define grading criteria and performance levels</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Total Weight:</span>
                    <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-secondary-600' : 'text-warning'}`}>
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="card p-6 space-y-4"
                        >
                            {/* Criterion Header */}
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Criterion name (e.g., Content & Understanding)"
                                        value={criterion.name}
                                        onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                                        className="input text-lg font-semibold"
                                    />
                                    <textarea
                                        placeholder="Description of what this criterion evaluates..."
                                        value={criterion.description}
                                        onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                                        className="input min-h-[60px]"
                                        rows={2}
                                    />
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-text-secondary">Weight:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={criterion.weight}
                                            onChange={(e) => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                                            className="input w-20 text-center"
                                        />
                                        <span className="text-sm text-text-secondary">%</span>
                                    </div>
                                </div>

                                {criteria.length > 1 && (
                                    <button
                                        onClick={() => removeCriterion(criterion.id)}
                                        className="btn btn-ghost text-error hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Performance Levels */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border-primary">
                                {criterion.levels.map((level, levelIdx) => (
                                    <div key={levelIdx} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                placeholder="Level name"
                                                value={level.name}
                                                onChange={(e) => updateLevel(criterion.id, levelIdx, 'name', e.target.value)}
                                                className="input-sm flex-1 mr-2"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={level.points}
                                                    onChange={(e) => updateLevel(criterion.id, levelIdx, 'points', Number(e.target.value))}
                                                    className="input-sm w-16 text-center"
                                                />
                                                <span className="text-xs text-text-tertiary">pts</span>
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder="Description of this performance level..."
                                            value={level.description}
                                            onChange={(e) => updateLevel(criterion.id, levelIdx, 'description', e.target.value)}
                                            className="input-sm min-h-[50px] text-xs"
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
            <button onClick={addCriterion} className="btn btn-outline w-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Criterion
            </button>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border-primary">
                <button onClick={onCancel} className="btn btn-outline flex-1">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="btn btn-primary flex-1"
                    disabled={totalWeight !== 100 || criteria.some(c => !c.name)}
                >
                    Save Rubric
                </button>
            </div>

            {totalWeight !== 100 && (
                <p className="text-warning text-sm text-center">
                    ⚠️ Total weight must equal 100%
                </p>
            )}
        </div>
    );
}
