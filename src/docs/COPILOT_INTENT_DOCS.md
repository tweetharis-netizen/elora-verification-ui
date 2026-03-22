# Elora Copilot Update Summary

## 1. Small-talk / Greetings Detection
Detected via case-insensitive keywords ('hi', 'hey', etc.) OR if the message is short (<= 6 words) and matches no other intent keywords.
Pattern fired: No thinking strip rendered. A short, friendly fallback message provides guided examples to help the user.

## 2. Thinking Steps Construction
Steps are dynamically created array objects matching the natural logic of the check.
Example (Planning intent):
- Step 1: "Context: Sec 3 Mathematics — scoping all lookups to this class." (or All classes aggregate text)
- Step 2: "Checked overdue/upcoming assignments for Sec 3 Mathematics."
- Step 3: "Checked weak topic flags — none found this week."

## 3. Updated Copilot Description & Examples
The "what is elora" / "what is copilot" intent clearly explains that Copilot works strictly on actual tracked class data and won't guess beyond it.
Example prompts:
- 'Which students need my attention before Friday?'
- 'Explain Algebra – Factorisation simply for this class.'
- 'Draft a short note to parents about Algebra Quiz 1 being overdue.'

## 4. Example Responses
### a) "Hi"
   - Steps: None
   - Text: "Hey! I work best when you ask me about your Elora classes — data, topics, students, or upcoming deadlines. Try something like:
   • 'Who needs my attention before Friday?'
   • 'Explain Algebra – Factorisation simply for this class.'
   • 'Draft a short note to parents about Algebra Quiz 1 being overdue.'"

### b) "Which students need my attention before Friday?" (Sec 3 Mathematics)
   - Steps:
     1. "Context: Sec 3 Mathematics — scoping all lookups to this class."
     2. "Loaded assignments for Sec 3 Mathematics — found 1 overdue (Algebra Quiz 1)."
     3. "Checked recent sessions — filtered to the last 7 days."
     4. "Ranked by urgency: overdue first, then low scores, then weak topics."
   - Text: "In **Sec 3 Mathematics**, three students need your attention before Friday:
   **Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.
   **Priya Nair** — Algebra Quiz 1 hasn't started yet, 3 days overdue.
   **Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in."

### c) "What is Elora?"
   - Steps: None
   - Text: "Elora is a teaching platform that tracks your classes, assignments, topics, and how students are progressing. I'm the Copilot built into Elora — I read your class data and turn it into suggestions, summaries, and drafts. I only work with what's actually in your data; I don't guess beyond that.
   You can ask me things like:
   • 'Which students need my attention before Friday?'
   • 'Explain Algebra – Factorisation simply for this class.'
   • 'Draft a short message to parents about an overdue assignment.'"
