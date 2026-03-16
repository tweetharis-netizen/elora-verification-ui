export interface StudentSuggestion {
    kind: 'practice_task' | 'mindset_nudge' | 'review_tip';
    title: string;
    body: string;
    suggestedPackId?: string;
    suggestedTopic?: string;
}

export async function getStudentSuggestion(
    studentId: string,
    studentName: string,
    classId: string,
    className: string,
    recentPerformance: any
): Promise<StudentSuggestion> {
    try {
        const response = await fetch('http://localhost:4000/api/elora/suggestions/student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId,
                studentName,
                classId,
                className,
                recentPerformance
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: StudentSuggestion = await response.json();
        
        // Add a slight delay to simulate "AI thinking" or real network latency
        await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
        
        return data;
    } catch (error) {
        console.error('Failed to fetch AI student suggestion, falling back to local logic', error);
        return await fallbackGetStudentSuggestion(studentId, studentName, classId, className, recentPerformance);
    }
}

async function fallbackGetStudentSuggestion(
    studentId: string,
    studentName: string,
    classId: string,
    className: string,
    recentPerformance: any
): Promise<StudentSuggestion> {
    await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));

    const weakTopics = recentPerformance?.weakTopics || [];
    const recentScores = recentPerformance?.recentScores || [];

    let kind: 'practice_task' | 'mindset_nudge' | 'review_tip' = 'mindset_nudge';
    let title = "You're on track";
    let body = "You're doing well overall. Keep your momentum by playing any short practice game you enjoy today.";
    let suggestedPackId: string | undefined = undefined;
    let suggestedTopic: string | undefined = undefined;

    const hasClearWeakTopic = weakTopics.length > 0 && weakTopics[0].severity === 'severe';
    const hasMildWeakTopic = weakTopics.length > 0 && (weakTopics[0].severity === 'mild' || weakTopics[0].severity === 'moderate');
    
    const topWeakTopic = weakTopics[0]?.topic;
    const relatedPackId = recentScores[0]?.packId || 'algebra-basics';
    const packName = relatedPackId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


    if (hasClearWeakTopic) {
        kind = 'practice_task';
        title = `Focus on ${topWeakTopic} next`;
        body = `Play one short ${packName} game on ${topWeakTopic} today. It's the fastest way to strengthen this skill.`;
        suggestedPackId = relatedPackId;
        suggestedTopic = topWeakTopic;
    } else if (hasMildWeakTopic) {
         kind = 'review_tip';
         title = `Quick review on ${topWeakTopic}`;
         body = `You're close on ${topWeakTopic}. A single review game on ${packName} will help you clear up the last confusion.`;
         suggestedPackId = relatedPackId;
         suggestedTopic = topWeakTopic;
    }

    return {
        kind,
        title,
        body,
        suggestedPackId,
        suggestedTopic
    };
}
