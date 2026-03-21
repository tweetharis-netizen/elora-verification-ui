import React from 'react';
import { Link } from 'react-router-dom';
import { EloraLogo } from './components/EloraLogo';

interface DashboardProps {
    isAuthenticated: boolean;
}

export default function Dashboard({ isAuthenticated }: DashboardProps) {
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-elora-400 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                    <h2 className="text-2xl font-serif text-elora-400 mb-4">Access Denied</h2>
                    <p className="text-gray-500 mb-6">Please sign in first to access your dashboard.</p>
                    <div className="space-y-3">
                        <Link to="/login" className="block w-full bg-elora-400 text-white font-medium py-3 rounded-xl hover:bg-elora-300 transition-colors">
                            Go to Login
                        </Link>
                        <Link to="/" className="block w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col">
            <header className="bg-elora-400 text-white py-4 px-6 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2 text-white">
                    <EloraLogo className="w-8 h-8" withWordmark={true} />
                </div>
                <Link to="/" className="text-sm font-medium hover:text-elora-100 transition-colors">Sign Out</Link>
            </header>

            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-3xl font-serif text-elora-400">Welcome back!</h1>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">My Classes</h3>
                            <p className="text-gray-500 text-sm">3 active classes</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Recent Activity</h3>
                            <p className="text-gray-500 text-sm">No new updates</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Messages</h3>
                            <p className="text-gray-500 text-sm">0 unread</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
