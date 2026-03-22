import { getPronoun } from "../components/Copilot/CopilotShared";

export interface ParentChildData {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'non-binary';
}

export interface ParentCopilotContext {
    selectedChildId: string | null;
    selectedSubject: string | null;
    children: ParentChildData[];
}

export type ParentIntent = 
    | 'childoverview' 
    | 'subjectcheck' 
    | 'upcomingwork' 
    | 'missedoroverdue' 
    | 'topicexplanation' 
    | 'supportathome' 
    | 'sendnudge' 
    | 'about' 
    | 'smalltalk' 
    | 'sensitiveguardrails';

export interface ActionChip {
    label: string;
    actionType: 'navigate';
    destination?: string;
}

export interface Step {
    id: string;
    text: string;
}

export interface ParentCopilotResponse {
    content: string;
    steps?: Step[];
    actions?: ActionChip[];
    intent?: string;
}

export const processParentPrompt = (prompt: string, context: ParentCopilotContext): ParentCopilotResponse => {
    const p = prompt.toLowerCase();
    const child = context.children.find(c => c.id === context.selectedChildId) || context.children[0];
    
    // Pronoun helpers
    const { pSub, pObj, pPos, pIs } = getPronoun(child.gender);

    let intent: ParentIntent = 'smalltalk';
    let responseContent = "";
    let steps: Step[] = [];
    let actions: ActionChip[] = [];

    // Intent Detection
    if (p.includes('sad') || p.includes('angry') || p.includes('bullied') || p.includes('depressed') || p.includes('hurt') || (p.includes('worried') && !p.includes('score') && !p.includes('math') && !p.includes('science'))) {
        intent = 'sensitiveguardrails';
    } else if (p.includes('nudge') || p.includes('encourage') || p.includes('message') || p.includes('remind') || p.includes('tell him')) {
        intent = 'sendnudge';
    } else if ((p.includes('how') && (p.includes('doing') || p.includes('overall') || p.includes('child'))) || p.includes('worried')) {
        intent = 'childoverview';
    } else if (p.includes('subject') || p.includes('math') || p.includes('science') || p.includes('english')) {
        intent = 'subjectcheck';
    } else if (p.includes('upcoming') || p.includes('due') || p.includes('next week') || p.includes('schedule')) {
        intent = 'upcomingwork';
    } else if (p.includes('missed') || p.includes('late') || p.includes('overdue')) {
        intent = 'missedoroverdue';
    } else if (p.includes('explain') || p.includes('what is') || p.includes('help with topic')) {
        intent = 'topicexplanation';
    } else if (p.includes('help') || p.includes('home') || p.includes('support')) {
        intent = 'supportathome';
    } else if (p.includes('who are you') || p.includes('what can you do') || p.includes('about elora')) {
        intent = 'about';
    }

    // Response Logic
    switch (intent) {
        case 'childoverview':
            responseContent = `Overall, ${child.name} is making steady progress. ${pSub.charAt(0).toUpperCase() + pSub.slice(1)} ${pIs} staying consistent with homework and seems to be enjoying the current set of modules. There is one pending assignment, which might be worth a gentle mention to see if ${pSub} needs a hand.`;
            steps = [
                { id: '1', text: `Checking ${child.name}'s recent performance data` },
                { id: '2', text: 'Analyzing attendance and participation patterns' },
                { id: '3', text: 'Synthesizing teacher feedback' }
            ];
            actions = [
                { label: `Send ${child.name} a nudge`, actionType: 'navigate' },
                { label: 'See what’s overdue', actionType: 'navigate', destination: '/parent/assignments' },
                { label: 'What’s coming up?', actionType: 'navigate', destination: '/parent/assignments' }
            ];
            break;

        case 'subjectcheck':
            const subject = context.selectedSubject || 'mathematics';
            responseContent = `${child.name} is doing well in ${subject}, showing a stable upward trend this term. While recent scores hovered around 62%, this is actually a solid baseline and ${pSub} is actively improving in tricky areas.`;
            steps = [
                { id: 's1', text: `Scanning ${subject} grade reports` },
                { id: 's2', text: 'Comparing recent quiz scores with earlier work' }
            ];
            actions = [
                { label: `Review ${subject} accuracy`, actionType: 'navigate', destination: '/parent/progress' },
                { label: 'Explain this topic to me', actionType: 'navigate' }
            ];
            break;

        case 'upcomingwork':
            responseContent = `${child.name} has three assignments coming up in the next 7 days. The most significant one is a Science quiz on Thursday morning.`;
            steps = [
                { id: 'u1', text: `Checking ${child.name}'s assignment calendar` },
                { id: 'u2', text: 'Prioritizing upcoming deadlines' }
            ];
            actions = [
                { label: 'See all upcoming work', actionType: 'navigate', destination: '/parent/assignments' },
                { label: 'Set a reminder', actionType: 'navigate' }
            ];
            break;

        case 'missedoroverdue':
            responseContent = `I can see there are a couple of outstanding assignments that are not yet submitted. Keep in mind ${pSub} might have done them elsewhere, but it could be worth a casual check-in when you both have a moment.`;
            steps = [
                { id: 'm1', text: `Searching for late submissions` },
                { id: 'm2', text: 'Checking current assignment status' }
            ];
            actions = [
                { label: 'See everything overdue', actionType: 'navigate', destination: '/parent/assignments' }
            ];
            break;

        case 'topicexplanation':
            const topicToExplain = p.includes('algebra') ? 'Algebra' : (p.includes('fractions') ? 'Fractions' : 'the current topic');
            const explanation = topicToExplain === 'Algebra' 
                ? "Algebra uses letters and symbols to represent numbers in equations. It helps us find missing values and understand patterns."
                : "Fractions represent parts of a larger whole. They're useful for sharing things out or measuring accurately.";
            responseContent = `In class, ${child.name} is currently learning about ${topicToExplain}. ${explanation} It's a key building block for their progress this term.`;
            steps = []; // Educational explanations don't need thinking steps
            actions = [
                { label: 'See lesson details', actionType: 'navigate' }
            ];
            break;

        case 'supportathome':
            responseContent = `The best way to help ${child.name} right now is just to ask ${pObj} to show you what ${pSub} did in class today. Light encouragement works best.`;
            steps = [
                { id: 'h1', text: 'Analyzing areas for improvement' },
                { id: 'h2', text: 'Looking for low-pressure home activities' }
            ];
            actions = [
                { label: 'More practice ideas', actionType: 'navigate' }
            ];
            break;

        case 'sendnudge':
            responseContent = `I've sent a friendly reminder about the Science report! He won't know it came from you unless you tell him — it just looks like a standard system nudge.`;
            steps = [
                { id: 'n1', text: 'Finding recent accomplishments' }
            ];
            actions = [
                { label: 'Send "Well Done"', actionType: 'navigate' },
                { label: 'Send "Keep Going"', actionType: 'navigate' }
            ];
            break;

        case 'about':
            responseContent = "I'm Elora Parent Copilot. My job is to help you stay connected with your child's learning journey and give you peace of mind about their progress.";
            actions = [
                { label: 'Learn more', actionType: 'navigate' }
            ];
            break;

        case 'sensitiveguardrails':
            responseContent = `I hear your worry, and it's completely understandable to feel that way. While I can't offer wellbeing advice, speaking directly with ${child.name}'s teacher or school counselor is often a great next step.\n\nIf it's helpful, I can check ${child.name}'s recent engagement stats to see if we can spot any patterns.`;
            break;

        case 'smalltalk':
        default:
            responseContent = `I'm here! I can help you check on ${child.name}'s progress, see upcoming work, or explain what ${pSub} is learning today. What's on your mind?`;
            break;
    }

    return {
        content: responseContent,
        steps: steps.length > 0 ? steps : undefined,
        actions: actions.length > 0 ? actions : undefined,
        intent
    };
};
