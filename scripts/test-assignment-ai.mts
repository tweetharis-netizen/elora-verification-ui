import fs from 'node:fs';
import path from 'node:path';

type Scenario = {
  id: string;
  description: string;
  topic: string;
  subject?: string | null;
  level?: string | null;
  objectives?: string[];
  tasks?: Array<{
    title: string;
    type?: string;
    minutes?: number;
    instructions?: string;
  }>;
};

type EndpointResult = {
  status: number;
  body: any;
  error?: string;
};

type ScenarioResult = {
  id: string;
  description: string;
  suggestObjectives: EndpointResult;
  suggestTasks: EndpointResult;
  reviewFeedback: EndpointResult;
};

const BASE_URL = 'http://localhost:3000';

const scenarios: Scenario[] = [
  {
    id: 'S1',
    description: 'Fractions and equivalent fractions',
    topic: 'Fractions and equivalent fractions',
    subject: 'Math',
    level: 'Grade 6',
    objectives: [
      'Understand the concept of a fraction as a part of a whole',
      'Identify and generate equivalent fractions using multiplication and division',
      'Compare and order fractions with different denominators'
    ],
    tasks: [
      {
        title: 'Introduction to Fractions',
        type: 'explainer',
        minutes: 15,
        instructions: 'Watch a video on what fractions are and how they represent parts of a whole.'
      },
      {
        title: 'Equivalent Fraction Practice',
        type: 'activity',
        minutes: 20,
        instructions: 'Complete a worksheet finding equivalent fractions for 1/2, 3/4, and 2/5.'
      }
    ]
  },
  {
    id: 'S2',
    description: 'Causes of World War I',
    topic: 'Causes of World War I',
    subject: 'History',
    level: 'Grade 9',
    objectives: [
      'Analyze the four main causes of WWI: Militarism, Alliances, Imperialism, and Nationalism',
      'Identify the immediate trigger of the war: the assassination of Archduke Franz Ferdinand',
      'Explain how the alliance system led to a global conflict'
    ],
    tasks: [
      {
        title: 'The M.A.I.N. Causes Research',
        type: 'research',
        minutes: 30,
        instructions: 'Research each of the four MAIN causes and write a brief summary of how each contributed to the tension in Europe.'
      },
      {
        title: 'Trigger Event Analysis',
        type: 'discussion',
        minutes: 15,
        instructions: 'Discuss why the assassination in Sarajevo was the "spark" that set off the powder keg of Europe.'
      }
    ]
  },
  {
    id: 'S3',
    description: 'Introduction to persuasive writing',
    topic: 'Introduction to persuasive writing',
    subject: 'English',
    level: 'Grade 7',
    objectives: [
      'Identify the purpose and audience of a persuasive text',
      'Use persuasive techniques such as ethos, pathos, and logos',
      'Draft a clear thesis statement for a persuasive essay'
    ],
    tasks: [
      {
        title: 'Analyzing Persuasive Ads',
        type: 'activity',
        minutes: 20,
        instructions: 'Look at three different advertisements and identify which persuasive techniques they are using.'
      },
      {
        title: 'Thesis Statement Workshop',
        type: 'writing',
        minutes: 25,
        instructions: 'Choose a topic you feel strongly about and write three different versions of a thesis statement for it.'
      }
    ]
  },
  {
    id: 'S4',
    description: 'Photosynthesis and plant growth',
    topic: 'Photosynthesis and plant growth',
    subject: 'Science',
    level: 'Grade 5',
    objectives: [
      'Explain the process of photosynthesis and the role of sunlight, water, and carbon dioxide',
      'Identify the products of photosynthesis: glucose and oxygen',
      'Understand how environmental factors affect plant growth'
    ],
    tasks: [
      {
        title: 'Photosynthesis Diagram',
        type: 'drawing',
        minutes: 20,
        instructions: 'Create a colorful diagram showing the inputs and outputs of photosynthesis.'
      },
      {
        title: 'Plant Growth Observation',
        type: 'experiment',
        minutes: 15,
        instructions: 'Set up an experiment with two plants: one in the sun and one in the dark, and predict what will happen over a week.'
      }
    ]
  }
];

async function callEndpoint(path: string, payload: any): Promise<EndpointResult> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => null);
    return {
      status: response.status,
      body
    };
  } catch (error: any) {
    return {
      status: 0,
      body: null,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('Starting Assignment AI Test Harness...');
  const results: ScenarioResult[] = [];

  for (const scenario of scenarios) {
    console.log(`Processing Scenario: ${scenario.id} - ${scenario.description}`);

    const suggestObjectives = await callEndpoint('/api/elora/assignments/suggest-objectives', {
      topic: scenario.topic,
      subject: scenario.subject,
      level: scenario.level
    });

    const suggestTasks = await callEndpoint('/api/elora/assignments/suggest-tasks', {
      topic: scenario.topic,
      subject: scenario.subject,
      level: scenario.level,
      objectives: scenario.objectives
    });

    const reviewFeedback = await callEndpoint('/api/elora/assignments/review-feedback', {
      topic: scenario.topic,
      subject: scenario.subject,
      level: scenario.level,
      objectives: scenario.objectives,
      tasks: scenario.tasks
    });

    results.push({
      id: scenario.id,
      description: scenario.description,
      suggestObjectives,
      suggestTasks,
      reviewFeedback
    });
  }

  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outputPath = path.join(outputDir, 'assignment-ai-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\nTests completed. Results written to: ${outputPath}`);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
