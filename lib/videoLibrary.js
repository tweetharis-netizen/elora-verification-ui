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
            topics: ["Algebra", "Equations", "Variables"],
            description: "A great introduction to the fundamentals of algebraic thinking."
        },
        {
            id: "v2",
            title: "Introduction to equations",
            channel: "Khan Academy",
            url: "https://www.youtube.com/watch?v=vDqOoI-4Z6M",
            thumbnail: "https://img.youtube.com/vi/vDqOoI-4Z6M/mqdefault.jpg",
            topics: ["Equations", "Linear Equations"],
            description: "Learn how to represent balanced relationships using math."
        }
    ],
    science: [
        {
            id: "v3",
            title: "Introduction to Cells: The Grand Cell Tour",
            channel: "Amoeba Sisters",
            url: "https://www.youtube.com/watch?v=8IlzKADrx8A",
            thumbnail: "https://img.youtube.com/vi/8IlzKADrx8A/mqdefault.jpg",
            topics: ["Biology", "Cells", "Organelles"],
            description: "Explore the microscopic world inside every living thing."
        },
        {
            id: "v4",
            title: "Newton's First Law of Motion",
            channel: "Crash Course",
            url: "https://www.youtube.com/watch?v=T1ux9D7-O38",
            thumbnail: "https://img.youtube.com/vi/T1ux9D7-O38/mqdefault.jpg",
            topics: ["Physics", "Mechanics", "Newton's Laws"],
            description: "Understand the concept of inertia and objects at rest."
        }
    ],
    english: [
        {
            id: "v5",
            title: "8 Common Grammar Mistakes",
            channel: "Learn English with TV",
            url: "https://www.youtube.com/watch?v=Wp8u_fS-m7k",
            thumbnail: "https://img.youtube.com/vi/Wp8u_fS-m7k/mqdefault.jpg",
            topics: ["Grammar", "Writing", "Punctuation"],
            description: "Avoid these common pitfalls to improve your writing instantly."
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
 * Searches the library for videos matching a query.
 */
export function searchVideos(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const allVideos = Object.values(VIDEO_RESOURCES).flat();

    return allVideos.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.topics.some(t => t.toLowerCase().includes(q)) ||
        v.channel.toLowerCase().includes(q)
    );
}

/**
 * Generates an "AI Insight" explanation for why these videos are shown.
 */
export function getRecommendationReason(struggleTopic, studentCount) {
    if (!struggleTopic) return "General enhancement for your current curriculum.";
    return `${studentCount} student${studentCount > 1 ? 's are' : ' is'} currently struggling with ${struggleTopic}. These resources cover the core concepts.`;
}
