// lib/videoLibrary.js

/**
 * A curated library of educational videos linked to common subjects and topics.
 * In a production app, this would be an API call to a CMS or a search engine,
 * but for this high-end demo, we provide a deterministic, high-quality mapping.
 */

const VIDEO_RESOURCES = {
    math: [
        {
            id: "v1",
            title: "Algebra Basics: What Is Algebra?",
            channel: "Math Antics",
            url: "https://www.youtube.com/watch?v=NybHckSEQBI",
            thumbnail: "https://img.youtube.com/vi/NybHckSEQBI/mqdefault.jpg",
            topics: ["Math", "Algebra", "Equations", "Variables"],
            description: "A great introduction to the fundamentals of algebraic thinking.",
            views: "12M",
            likes: "450K"
        },
        {
            id: "v2",
            title: "Introduction to equations",
            channel: "Khan Academy",
            url: "https://www.youtube.com/watch?v=vDqOoI-4Z6M",
            thumbnail: "https://img.youtube.com/vi/vDqOoI-4Z6M/mqdefault.jpg",
            topics: ["Math", "Equations", "Linear Equations"],
            description: "Learn how to represent balanced relationships using math.",
            views: "8.5M",
            likes: "320K"
        },
        {
            id: "v_frac",
            title: "Introduction to Fractions",
            channel: "Math Antics",
            url: "https://www.youtube.com/watch?v=CA9XLJpQp3c",
            thumbnail: "https://img.youtube.com/vi/CA9XLJpQp3c/mqdefault.jpg",
            topics: ["Math", "Fractions", "Numbers"],
            description: "What are fractions anyway? Learn the basics of numerator and denominator.",
            views: "15M",
            likes: "580K"
        },
        {
            id: "v_geom",
            title: "Intro to Geometry",
            channel: "Khan Academy",
            url: "https://www.youtube.com/watch?v=f-SUE_T0vEY",
            thumbnail: "https://img.youtube.com/vi/f-SUE_T0vEY/mqdefault.jpg",
            topics: ["Math", "Geometry", "Shapes", "Angles"],
            description: "Explore the language of points, lines, and planes.",
            views: "6.2M",
            likes: "210K"
        }
    ],
    science: [
        {
            id: "v3",
            title: "Introduction to Cells: The Grand Cell Tour",
            channel: "Amoeba Sisters",
            url: "https://www.youtube.com/watch?v=8IlzKADrx8A",
            thumbnail: "https://img.youtube.com/vi/8IlzKADrx8A/mqdefault.jpg",
            topics: ["Science", "Biology", "Cells", "Organelles"],
            description: "Explore the microscopic world inside every living thing.",
            views: "22M",
            likes: "890K"
        },
        {
            id: "v4",
            title: "Newton's First Law of Motion",
            channel: "Crash Course",
            url: "https://www.youtube.com/watch?v=T1ux9D7-O38",
            thumbnail: "https://img.youtube.com/vi/T1ux9D7-O38/mqdefault.jpg",
            topics: ["Science", "Physics", "Mechanics", "Newton's Laws"],
            description: "Understand the concept of inertia and objects at rest.",
            views: "5.1M",
            likes: "180K"
        },
        {
            id: "v_periodic",
            title: "The Periodic Table: Atomic Radius",
            channel: "Crash Course",
            url: "https://www.youtube.com/watch?v=0RRVV4Diomg",
            thumbnail: "https://img.youtube.com/vi/0RRVV4Diomg/mqdefault.jpg",
            topics: ["Science", "Chemistry", "Periodic Table"],
            description: "Navigate the most important chart in all of science.",
            views: "3.4M",
            likes: "125K"
        }
    ],
    english: [
        {
            id: "v5",
            title: "8 Common Grammar Mistakes",
            channel: "Learn English with TV",
            url: "https://www.youtube.com/watch?v=Wp8u_fS-m7k",
            thumbnail: "https://img.youtube.com/vi/Wp8u_fS-m7k/mqdefault.jpg",
            topics: ["English", "Grammar", "Writing", "Punctuation"],
            description: "Avoid these common pitfalls to improve your writing instantly.",
            views: "9.2M",
            likes: "410K"
        },
        {
            id: "v_creative",
            title: "The Secret to Creative Writing",
            channel: "Ted-Ed",
            url: "https://www.youtube.com/watch?v=68K9IUnE-iI",
            thumbnail: "https://img.youtube.com/vi/68K9IUnE-iI/mqdefault.jpg",
            topics: ["English", "Writing", "Storytelling"],
            description: "Learn how to build worlds and characters that feel alive.",
            views: "4.8M",
            likes: "250K"
        }
    ]
};

/**
 * Returns recommended videos based on a specific struggle point or general subject.
 */
export function getRecommendations(subject = "math", struggleTopic = null) {
    const s = String(subject).toLowerCase();
    const library = VIDEO_RESOURCES[s === 'physics' || s === 'biology' ? 'science' : s] || VIDEO_RESOURCES['math'];

    if (!struggleTopic) return library.slice(0, 2);

    // Simple fuzzy match for struggle topic
    const filtered = library.filter(v =>
        v.topics.some(t => t.toLowerCase().includes(struggleTopic.toLowerCase())) ||
        v.title.toLowerCase().includes(struggleTopic.toLowerCase())
    );

    return filtered.length > 0 ? filtered : library.slice(0, 2);
}

/**
 * Searches the library for videos matching a query, prioritizing high engagement.
 */
export function searchVideos(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const allVideos = Object.values(VIDEO_RESOURCES).flat();

    const filtered = allVideos.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.topics.some(t => t.toLowerCase().includes(q)) ||
        v.channel.toLowerCase().includes(q)
    );

    // Sort by views (higher first). 
    // Format is "12M", "8.5M", so we convert to numeric.
    const parseEngagement = (val) => {
        if (typeof val !== 'string') return 0;
        const num = parseFloat(val);
        if (val.includes('M')) return num * 1000000;
        if (val.includes('K')) return num * 1000;
        return num;
    };

    return filtered.sort((a, b) => parseEngagement(b.views) - parseEngagement(a.views));
}

/**
 * Generates an "AI Insight" explanation for why these videos are shown.
 */
export function getRecommendationReason(struggleTopic, studentCount) {
    if (!struggleTopic) return "General enhancement for your current curriculum.";
    return `${studentCount} student${studentCount > 1 ? 's are' : ' is'} currently struggling with ${struggleTopic}. These resources cover the core concepts.`;
}
