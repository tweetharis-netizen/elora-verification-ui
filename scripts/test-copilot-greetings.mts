#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
	isGreeting,
	isCapabilityQuery,
	isGenericHelp,
	isStudyPlanning,
	isQuizGeneration,
	isReviewMyAttempt,
	isLessonPlanning,
	isReportExplanation,
} from '../src/lib/llm/router';

console.log('🧪 Copilot greeting detection tests');

assert.equal(isGreeting('Hi'), true, 'single word hi should be greeting');
assert.equal(isGreeting('hello there'), true, 'hello there greeting');
assert.equal(isGreeting('how is it going'), true, 'how is it going greeting');
assert.equal(isGreeting('Hey, can you help me with question 3?'), false, 'tasky greeting should be false');
assert.equal(isGreeting('I need help'), false, 'help phrase is tasky');
assert.equal(isGreeting('   '), false, 'empty string false');
assert.equal(isGreeting('stuck on Q3'), false, 'task-like short message false');
assert.equal(isGreeting('yo'), true, 'yo true');

console.log('✅ Copilot greeting detection tests passed');

console.log('\n🧪 Copilot capability query detection tests');

// Positive cases: capability queries
assert.equal(isCapabilityQuery('What can you do?'), true, 'what can you do is capability query');
assert.equal(isCapabilityQuery('How can you help me?'), true, 'how can you help is capability query');
assert.equal(isCapabilityQuery('What are you for?'), true, 'what are you for is capability query');
assert.equal(isCapabilityQuery('What do you do?'), true, 'what do you do is capability query');
assert.equal(isCapabilityQuery('Can you help me get started?'), true, 'help me get started is capability query');
assert.equal(isCapabilityQuery('What is Elora?'), true, 'what is elora is capability query');
assert.equal(isCapabilityQuery('Who are you?'), true, 'who are you is capability query');

// Negative cases: task-embedded or mixed intent
assert.equal(isCapabilityQuery('What can you do with this file?'), false, 'task-embedded should be false');
assert.equal(isCapabilityQuery('Explain this concept'), false, 'explain task is not capability query');
assert.equal(isCapabilityQuery('Help me solve question 5'), false, 'solve is task verb, not capability');
assert.equal(isCapabilityQuery('Can you create a quiz?'), false, 'create is explicit task');
assert.equal(isCapabilityQuery('Draft a lesson plan'), false, 'draft is explicit task');

// Boundary cases
assert.equal(isCapabilityQuery(''), false, 'empty string is false');
assert.equal(isCapabilityQuery('   '), false, 'whitespace only is false');
assert.equal(isCapabilityQuery('hi'), false, 'greeting not capability query');
assert.equal(isCapabilityQuery('a b c d e f g h i j'), false, 'too many words is false');

console.log('✅ Copilot capability query detection tests passed');

console.log('\n🧪 Copilot generic-help detection tests');
assert.equal(isGenericHelp('help'), true, 'help should be generic help');
assert.equal(isGenericHelp("I'm stuck"), true, "I'm stuck should be generic help");
assert.equal(isGenericHelp('help me please'), true, 'help me please should be generic help');
assert.equal(isGenericHelp('hi, can you help me with question 3?'), false, 'tasky help should be false');
assert.equal(isGenericHelp('can you create a quiz?'), false, 'explicit task should not be generic help');

console.log('✅ Copilot generic-help detection tests passed');

console.log('\n🧪 Copilot study-planning detection tests');
assert.equal(isStudyPlanning('Can you make a study plan for my biology exam?'), true, 'study plan request should be true');
assert.equal(isStudyPlanning('revision schedule for finals'), true, 'revision schedule should be true');
assert.equal(isStudyPlanning('plan a lesson on fractions'), false, 'lesson plan should not be study planning');
assert.equal(isStudyPlanning('I have a test tomorrow'), false, 'generic exam mention should be false');
console.log('✅ Copilot study-planning detection tests passed');

console.log('\n🧪 Copilot quiz-generation detection tests');
assert.equal(isQuizGeneration('Create a quiz on photosynthesis'), true, 'create a quiz should be true');
assert.equal(isQuizGeneration('Give me practice questions on fractions'), true, 'practice questions request should be true');
assert.equal(isQuizGeneration('Test me on algebra'), true, 'test me should be true');
assert.equal(isQuizGeneration('I have a quiz tomorrow'), false, 'quiz mention without request should be false');
console.log('✅ Copilot quiz-generation detection tests passed');

console.log('\n🧪 Copilot review-attempt detection tests');
assert.equal(isReviewMyAttempt("Here's my answer: 12 because I divided by 2"), true, 'explicit answer sharing should be true');
assert.equal(isReviewMyAttempt("I think it's 12 because the ratio simplifies"), true, 'reasoned attempt should be true');
assert.equal(isReviewMyAttempt('Is this right?'), false, 'bare is this right should be false');
console.log('✅ Copilot review-attempt detection tests passed');

console.log('\n🧪 Copilot lesson-planning detection tests');
assert.equal(isLessonPlanning('Plan a lesson on fractions'), true, 'lesson plan should be true');
assert.equal(isLessonPlanning('Unit outline for Algebra 1'), true, 'unit outline should be true');
assert.equal(isLessonPlanning('study plan for math'), false, 'study plan should not be lesson planning');
console.log('✅ Copilot lesson-planning detection tests passed');

console.log('\n🧪 Copilot report-explanation detection tests');
assert.equal(isReportExplanation('Can you explain this report card?'), true, 'report card explanation should be true');
assert.equal(isReportExplanation('Help me understand this progress report'), true, 'progress report explanation should be true');
assert.equal(isReportExplanation('Report cards are out this week'), false, 'report mention without request should be false');
console.log('✅ Copilot report-explanation detection tests passed');
