// components/Navigation.js
// Professional navigation bar - Notion/Linear quality

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../lib/contexts/AppContext';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
    const router = useRouter();
    const { session, user } = useApp();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
        { name: 'Assistant', href: '/assistant', icon: AssistantIcon },
        { name: 'Classes', href: '/classes', icon: ClassesIcon },
        { name: 'Assignments', href: '/assignments', icon: AssignmentsIcon },
        { name: 'Analytics', href: '/analytics', icon: AnalyticsIcon },
    ];

    const isActive = (href) => router.pathname.startsWith(href);

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="sticky top-0 z-[1100] bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-neutral-900 dark:bg-white flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                                <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-xl font-semibold text-neutral-900 dark:text-white">Elora</span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-2">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`relative px-4 py-2 rounded text-sm font-semibold ${active
                                            ? 'text-neutral-900 dark:text-white'
                                            : 'text-neutral-600 dark:text-neutral-400'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </div>
                                        {active && (
                                            <span
                                                className="absolute bottom-0 left-2 right-2 h-[2px] bg-neutral-900 dark:bg-neutral-100 rounded"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Side - User Menu */}
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Notifications removed for Tines-aligned minimal shell */}

                            {/* User Menu */}
                            {session?.verified ? (<div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                    aria-controls="user-dropdown"
                                    aria-pressed={userMenuOpen}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setUserMenuOpen(false); }}
                                >
                                    <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-900 dark:text-white font-semibold text-xs">
                                        {session?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            {session?.name || 'User'}
                                        </div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                                            {session?.role || 'Student'}
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* User Dropdown */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 py-2 z-[1000]"
                                            id="user-dropdown"
                                            role="menu"
                                        >
                                            <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300" role="menuitem">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Settings
                                            </Link>
                                            <Link href="/help" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300" role="menuitem">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Help
                                            </Link>
                                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2" />
                                            {session?.verified ? (
                                                <button className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 w-full" role="menuitem" type="button" aria-pressed="false">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            ) : null}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>) : (<Link href="/verify" className="elora-btn elora-btn-secondary">Verify</Link>)}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden flex items-center justify-center w-6 h-6 rounded focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
                                type="button"
                                aria-pressed={mobileMenuOpen}
                            >
                                <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {mobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden border-t border-neutral-200 dark:border-neutral-800"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold ${active
                                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                                                : 'text-neutral-600 dark:text-neutral-400'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}

// Icon Components
function DashboardIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function ClassesIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

function AssignmentsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function AnalyticsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function AssistantIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}
