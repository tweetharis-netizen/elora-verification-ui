// components/dashboard/TeacherVideoExplorer.js
// Modernized Video Explorer for Teachers

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "../../components/Notifications";

export default function TeacherVideoExplorer({ selectedClass, onPostResource }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [videos, setVideos] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            // Mock API or actual YouTube Search
            // For now, let's provide premium-looking sample results
            setTimeout(() => {
                const mockVideos = [
                    { id: '1', title: `Mastering ${selectedClass?.subject || 'Physics'}: Core Concepts`, views: '1.2M', length: '12:45', thumbnail: '🎬' },
                    { id: '2', title: `${selectedClass?.subject || 'Science'} Fundamentals for ${selectedClass?.level || 'Students'}`, views: '850K', length: '08:20', thumbnail: '🧪' },
                    { id: '3', title: 'Advanced Problem Solving Techniques', views: '420K', length: '15:30', thumbnail: '📐' }
                ];
                setVideos(mockVideos);
                setIsSearching(false);
            }, 800);
        } catch (error) {
            notify("Search failed", "error");
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border-premium shadow-premium-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div>
                        <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-[var(--font-outfit)]">Video Explorer</h3>
                        <p className="text-neutral-400 text-sm">Curate high-impact visual resources for <b>{selectedClass?.name || 'your class'}</b>.</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search YouTube..."
                            className="bg-neutral-50 dark:bg-neutral-800 border-premium rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none flex-1 md:w-64"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            {isSearching ? <span className="animate-spin">◌</span> : "Search"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {videos.map((video, idx) => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-neutral-50 dark:bg-neutral-800/50 border-premium rounded-2xl overflow-hidden hover:shadow-premium-md transition-all active:scale-[0.98]"
                            >
                                <div className="aspect-video bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                                    {video.thumbnail}
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 mb-2 line-clamp-2">{video.title}</h4>
                                    <div className="flex items-center justify-between mb-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                        <span>{video.views} views</span>
                                        <span>{video.length}</span>
                                    </div>
                                    <button
                                        onClick={() => onPostResource({ ...video, type: 'Video' })}
                                        className="w-full py-2.5 bg-white dark:bg-neutral-900 border-premium text-neutral-600 dark:text-neutral-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all"
                                    >
                                        Post to Class →
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {videos.length === 0 && !isSearching && (
                        <div className="col-span-3 py-20 text-center border-premium border-dashed rounded-3xl opacity-50">
                            <div className="text-3xl mb-4">📺</div>
                            <p className="text-sm font-medium">Search for videos to start curating.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
