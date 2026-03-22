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
    | 'sensitiveguardrails'
    | 'parentlowconfidence';

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
    const childName = child?.name || 'your child';
    
    // Pronoun helpers
    const { pSub, pObj, pPos, pIs } = getPronoun(child?.gender || 'non-binary');

    let intent: ParentIntent = 'smalltalk';
    let responseContent = "";
    let steps: Step[] = [];
    let actions: ActionChip[] = [];

    // ── Intent Detection (order matters — most specific first) ──

    // 1. Emotional / low-confidence parent (check before sensitive)
    const isParentLowConfidence = 
        /feel like a bad parent|don't know how (he|she|they)'?re? doing|i'?m not (very |)good with school|don't understand school|lost with all this/i.test(p);

    // 2. Sensitive / wellbeing guardrail
    const isSensitive = 
        /\b(sad|angry|bullied|depressed|hurt|scared|anxious|mental health)\b/i.test(p) ||
        // "worried" only as wellbeing if NOT paired with a subject or score word
        (/worried/.test(p) && !/score|math|science|english|history|geography|assignment|grade|mark/.test(p) && !/(how is|is he|is she|is liam|is my child|keeping up|doing ok|should i be worried about)/.test(p));

    // 3. Child overview — broad "how is _ doing" / "is he okay" / "should I be worried about school"
    const isChildOverview =
        /(how is|how'?s) (liam|he|she|they|my child|him) (doing|getting on|getting along|keeping up|going)/i.test(p) ||
        /(is (liam|he|she|they|my child) (ok|okay|fine|mostly|keeping up|behind|on track|alright))/i.test(p) ||
        /(should i be worried|anything i should know|is there anything|anything on my radar|is everything ok)/i.test(p) ||
        // "how doing" as bare phrase
        /(how (is|are) (liam|he|she|they|my child) doing)/i.test(p) ||
        // subject-less "how are they doing in school"
        /(how (is|are) (he|she|they|liam) doing in school)/i.test(p) ||
        // legacy match
        ((p.includes('how') && (p.includes('doing') || p.includes('overall') || p.includes('child'))) && !/(math|science|english|history|geography)/.test(p));

    // 4. Subject-specific check — must mention a subject name
    const isSubjectCheck = 
        /(math|maths|science|english|history|geography|physics|chemistry|biology)/i.test(p) &&
        /(how is|how'?s|doing in|struggling|score|grade|mark|really)/i.test(p);

    // 5. Nudge / message
    const isSendNudge =
        /(nudge|encourage|message|remind|tell him|tell her|tell them)/i.test(p);

    // 6. Upcoming work
    const isUpcoming =
        /(upcoming|coming up|due|next week|schedule|calendar|deadlines)/i.test(p);

    // 7. Missed / overdue
    const isMissed =
        /(missed|late|overdue|not submitted|hasn't submitted)/i.test(p);

    // 8. Topic explanation
    const isTopicExplanation =
        /(explain|what is|help with topic)/i.test(p);

    // 9. Support at home (but NOT if it's a wellbeing / low-confidence query)
    const isSupportAtHome =
        !isParentLowConfidence &&
        /(help|home|support at home|what can i do)/i.test(p);

    // 10. About
    const isAbout =
        /(who are you|what can you do|about elora)/i.test(p);

    // Resolve intent (priority order)
    if (isParentLowConfidence) {
        intent = 'parentlowconfidence';
    } else if (isSensitive) {
        intent = 'sensitiveguardrails';
    } else if (isSendNudge) {
        intent = 'sendnudge';
    } else if (isChildOverview) {
        intent = 'childoverview';
    } else if (isSubjectCheck) {
        intent = 'subjectcheck';
    } else if (isUpcoming) {
        intent = 'upcomingwork';
    } else if (isMissed) {
        intent = 'missedoroverdue';
    } else if (isTopicExplanation) {
        intent = 'topicexplanation';
    } else if (isSupportAtHome) {
        intent = 'supportathome';
    } else if (isAbout) {
        intent = 'about';
    }

    // ── Response Logic ──
    switch (intent) {
        case 'childoverview':
            responseContent = `Overall, ${childName} is doing fine — ${pSub} is keeping up with most of ${pPos} work and there are no red flags this week. There is one assignment that's still pending, which is worth a gentle mention when you get the chance.\n\nWant me to show you what's coming up, or would you like to send ${pObj} a quick nudge?`;
            steps = [
                { id: '1', text: `Checking ${childName}'s recent submission and activity data` },
                { id: '2', text: 'Looking for overdue or missing work' },
                { id: '3', text: 'Checking scores and participation trends' }
            ];
            actions = [
                { label: `What's coming up for ${childName}?`, actionType: 'navigate', destination: '/parent/assignments' },
                { label: `See what's overdue`, actionType: 'navigate', destination: '/parent/assignments' },
                { label: `Send ${childName} a nudge`, actionType: 'navigate' }
            ];
            break;

        case 'subjectcheck': {
            const mentionedSubject = 
                /math(s)?/i.test(p) ? 'Math' :
                /science/i.test(p) ? 'Science' :
                /english/i.test(p) ? 'English' :
                /history/i.test(p) ? 'History' :
                /geography/i.test(p) ? 'Geography' :
                context.selectedSubject || 'that subject';

            const isStruggling = /(struggle|struggling|bad at|hard|difficult|really)/i.test(p);

            if (isStruggling) {
                responseContent = `Yes, ${childName}'s ${mentionedSubject} scores have dipped a bit recently — ${pSub} is averaging around 62%, which is slightly below where ${pSub} was last month. That said, ${pSub} is still submitting work and hasn't fallen behind on deadlines. It might be worth a light check-in at home, just to see if ${pSub} wants any extra support.\n\nWant me to show you what ${pPos} next ${mentionedSubject} assignment looks like?`;
            } else {
                responseContent = `${childName} is doing okay in ${mentionedSubject} — scores have been around 62%, which is a solid baseline, and ${pSub} has been actively engaging with the material. There's one assignment due soon that ${pSub} hasn't started yet, which is worth a mention.`;
            }
            steps = [
                { id: 's1', text: `Scanning ${mentionedSubject} grade and submission data` },
                { id: 's2', text: 'Comparing recent scores with earlier work this term' }
            ];
            actions = [
                { label: `See ${mentionedSubject} progress`, actionType: 'navigate', destination: '/parent/progress' },
                { label: `What's due in ${mentionedSubject}?`, actionType: 'navigate', destination: '/parent/assignments' }
            ];
            break;
        }

        case 'upcomingwork':
            responseContent = `${childName} has three assignments coming up in the next 7 days. The most significant one is a Science quiz on Thursday morning — that's the one worth flagging if you want to remind ${pObj} to prepare.`;
            steps = [
                { id: 'u1', text: `Checking ${childName}'s assignment calendar` },
                { id: 'u2', text: 'Prioritizing upcoming deadlines by date and subject' }
            ];
            actions = [
                { label: 'See all upcoming work', actionType: 'navigate', destination: '/parent/assignments' },
                { label: `Send ${childName} a reminder`, actionType: 'navigate' }
            ];
            break;

        case 'missedoroverdue':
            responseContent = `I can see there are a couple of assignments that haven't been submitted yet. It's worth a casual check-in — ${pSub} may have done them elsewhere, or might just need a gentle nudge to finish up.`;
            steps = [
                { id: 'm1', text: 'Searching for late or missing submissions' },
                { id: 'm2', text: 'Checking current assignment status and due dates' }
            ];
            actions = [
                { label: 'See everything overdue', actionType: 'navigate', destination: '/parent/assignments' },
                { label: `Send ${childName} a nudge`, actionType: 'navigate' }
            ];
            break;

        case 'topicexplanation': {
            const topicToExplain = p.includes('algebra') ? 'Algebra' : (p.includes('fractions') ? 'Fractions' : 'the current topic');
            const explanation = topicToExplain === 'Algebra' 
                ? "Algebra uses letters and symbols to represent numbers in equations. It helps find missing values and understand patterns — and it's actually one of the most useful things in secondary school maths."
                : "Fractions represent parts of a larger whole. They come up a lot in everyday life — sharing, measuring, cooking — which makes them great to practice at home too.";
            responseContent = `${childName} is currently learning about ${topicToExplain} in class. ${explanation}\n\nIf you'd like, I can show you what ${pPos} upcoming work in this area looks like.`;
            steps = [];
            actions = [
                { label: 'See lesson details', actionType: 'navigate' }
            ];
            break;
        }

        case 'supportathome':
            responseContent = `The best way to support ${childName} right now is just to ask ${pObj} to show you what ${pSub} did in class today. Light encouragement works better than pressure — even a "show me what you're working on" goes a long way.`;
            steps = [
                { id: 'h1', text: 'Looking at recent activity for home support ideas' }
            ];
            actions = [
                { label: 'More home support ideas', actionType: 'navigate' }
            ];
            break;

        case 'sendnudge':
            responseContent = `I've sent a friendly reminder to ${childName} about the Science report. ${pSub.charAt(0).toUpperCase() + pSub.slice(1)} won't know it came from you — it just looks like a standard reminder from the platform.`;
            steps = [
                { id: 'n1', text: `Finding ${childName}'s pending assignment` },
                { id: 'n2', text: 'Sending a friendly system nudge' }
            ];
            actions = [
                { label: 'Send "Well Done"', actionType: 'navigate' },
                { label: 'Send "Keep Going"', actionType: 'navigate' }
            ];
            break;

        case 'about':
            responseContent = `I'm the Elora Parent Copilot. My job is to give you a clear, calm view of ${childName}'s learning — without the jargon. I can check on ${pPos} progress, flag anything overdue, explain what ${pSub} is learning, and help you support ${pObj} at home. Just ask me anything.`;
            actions = [
                { label: 'Learn more about Elora', actionType: 'navigate' }
            ];
            break;

        case 'sensitiveguardrails':
            responseContent = `That sounds tough, and it makes complete sense that you'd be worried. While I can't offer wellbeing advice, speaking directly with ${childName}'s teacher or school counselor is often the best next step — they'll have context I don't.\n\nIf it helps, I can check ${childName}'s recent engagement and submissions to see if anything stands out academically.`;
            actions = [
                { label: `Check ${childName}'s recent activity`, actionType: 'navigate', destination: '/parent/progress' }
            ];
            break;

        case 'parentlowconfidence':
            responseContent = `That's completely okay — most parents feel the same way. You don't need to understand all the school stuff; that's what I'm here for.\n\nHere's the short version: ${childName} is doing fine overall. ${pSub.charAt(0).toUpperCase() + pSub.slice(1)} is keeping up with most of ${pPos} work and there are no major concerns this week. There's one assignment still pending — worth a gentle mention when you get a quiet moment.\n\nWant me to show you more, or just keep it simple?`;
            steps = [
                { id: 'lc1', text: `Checking ${childName}'s recent activity and submissions` },
                { id: 'lc2', text: 'Summarising in plain language' }
            ];
            actions = [
                { label: `What's coming up for ${childName}?`, actionType: 'navigate', destination: '/parent/assignments' },
                { label: `Send ${childName} a nudge`, actionType: 'navigate' }
            ];
            break;

        case 'smalltalk':
        default:
            responseContent = `I'm here! I can give you a quick update on ${childName}'s progress, check what's coming up, or help you understand what ${pSub} is learning. What would you like to know?`;
            actions = [
                { label: `How is ${childName} doing?`, actionType: 'navigate' },
                { label: `What's coming up?`, actionType: 'navigate', destination: '/parent/assignments' }
            ];
            break;
    }

    return {
        content: responseContent,
        steps: steps.length > 0 ? steps : undefined,
        actions: actions.length > 0 ? actions : undefined,
        intent
    };
};
