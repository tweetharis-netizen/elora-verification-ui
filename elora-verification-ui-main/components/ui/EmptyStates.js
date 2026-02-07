// components/ui/EmptyStates.js
// Context-specific empty state components with clear CTAs

import { motion } from 'framer-motion';

/**
 * Empty assignments view
 */
export function EmptyAssignments({ role = 'student', onCreate }) {
    if (role === 'educator') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center"
            >
                <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 flex items-center justify-center">
                    <svg className="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">No assignments yet</h3>
                <p className="text-text-secondary mb-8 max-w-md">
                    Create your first assignment to get started with assessing student work.
                </p>
                <button onClick={onCreate} className="btn btn-primary btn-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Assignment
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-secondary-100 to-tertiary-100 dark:from-secondary-900 dark:to-tertiary-900 flex items-center justify-center">
                <svg className="w-16 h-16 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">No assignments yet</h3>
            <p className="text-text-secondary max-w-md">
                Your teacher hasn&apos;t posted any assignments for this class yet. Check back soon!
            </p>
        </motion.div>
    );
}

/**
 * Empty classes view
 */
export function EmptyClasses({ role = 'student', onCreate, onJoin }) {
    if (role === 'educator') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center"
            >
                <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 flex items-center justify-center">
                    <svg className="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">Create your first class</h3>
                <p className="text-text-secondary mb-8 max-w-md">
                    Organize your students, share resources, and manage assignments all in one place.
                </p>
                <button onClick={onCreate} className="btn btn-primary btn-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Class
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-secondary-100 to-tertiary-100 dark:from-secondary-900 dark:to-tertiary-900 flex items-center justify-center">
                <svg className="w-16 h-16 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">Join your first class</h3>
            <p className="text-text-secondary mb-8 max-w-md">
                Ask your teacher for a class code to get started.
            </p>
            <button onClick={onJoin} className="btn btn-primary btn-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join Class
            </button>
        </motion.div>
    );
}

/**
 * Empty chat history
 */
export function EmptyChatHistory() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center h-full"
        >
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 flex items-center justify-center">
                <svg className="w-12 h-12 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Start a conversation</h3>
            <p className="text-text-secondary max-w-md">
                Ask a question, request an explanation, or get help with homework.
            </p>
        </motion.div>
    );
}

/**
 * Empty search results
 */
export function EmptySearchResults({ query }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <div className="w-24 h-24 mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3">No results found</h3>
            <p className="text-text-secondary max-w-md">
                {query ? `No results for "${query}". Try different keywords.` : 'Try searching for something else.'}
            </p>
        </motion.div>
    );
}

/**
 * Empty resources
 */
export function EmptyResources({ onCreate }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-tertiary-100 to-primary-100 dark:from-tertiary-900 dark:to-primary-900 flex items-center justify-center">
                <svg className="w-16 h-16 text-tertiary-600 dark:text-tertiary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">No resources yet</h3>
            <p className="text-text-secondary mb-8 max-w-md">
                Add learning resources to share with your class.
            </p>
            {onCreate && (
                <button onClick={onCreate} className="btn btn-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Resource
                </button>
            )}
        </motion.div>
    );
}

/**
 * Generic empty state
 */
export function EmptyState({ icon, title, description, action }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            {icon && (
                <div className="w-24 h-24 mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    {icon}
                </div>
            )}
            <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>
            {description && <p className="text-text-secondary mb-6 max-w-md">{description}</p>}
            {action && action}
        </motion.div>
    );
}
