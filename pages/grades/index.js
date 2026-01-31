import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import { motion } from "framer-motion";

const MASTERY_LEVELS = [
  { level: 0, label: "Not Started", color: "slate", icon: "⭕" },
  { level: 1, label: "Beginning", color: "rose", icon: "🔴" },
  { level: 2, label: "Developing", color: "amber", icon: "🟡" },
  { level: 3, label: "Proficient", color: "emerald", icon: "🟢" },
  { level: 4, label: "Advanced", color: "indigo", icon: "🔵" }
];

function ProgressCard({ title, value, maxValue, color, icon, trend }) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-black ${
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-600'
          }`}>
            <span>{trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">out of {maxValue}</div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {Math.round(percentage)}%
          </div>
        </div>
        
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-${color}-400 to-${color}-600 transition-all duration-1000`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function StudentRow({ student, onViewDetails }) {
  const averageScore = student.scores?.reduce((acc, score) => acc + score.value, 0) / (student.scores?.length || 1) || 0;
  const assignmentsCompleted = student.scores?.length || 0;
  const totalAssignments = student.totalAssignments || 0;
  const lastActive = student.lastActive ? new Date(student.lastActive) : null;
  const daysSinceActive = lastActive ? Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-300 font-black text-sm">
              {student.name?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{student.name}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span>Avg: {Math.round(averageScore)}%</span>
              <span>•</span>
              <span>{assignmentsCompleted}/{totalAssignments} assignments</span>
              {daysSinceActive !== null && (
                <>
                  <span>•</span>
                  <span className={daysSinceActive > 7 ? 'text-red-500' : 'text-emerald-500'}>
                    {daysSinceActive === 0 ? 'Active today' : daysSinceActive === 1 ? 'Active yesterday' : `${daysSinceActive} days ago`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onViewDetails(student)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}

function AssignmentSubmission({ submission, onGrade }) {
  const score = submission.score || 0;
  const total = submission.total || 100;
  const percentage = (score / total) * 100;
  const isLate = submission.submittedAt && submission.dueDate && new Date(submission.submittedAt) > new Date(submission.dueDate);
  
  const masteryLevel = MASTERY_LEVELS.find(level => 
    percentage >= level.level * 25 ? level : MASTERY_LEVELS[level.level - 1]
  ) || MASTERY_LEVELS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
            {submission.title}
          </h4>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Student: {submission.studentName}</span>
            <span>•</span>
            <span>Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Not submitted'}</span>
            {isLate && <span className="text-red-500 font-black">LATE</span>}
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-black flex items-center gap-2 ${
            percentage >= 80 ? 'text-emerald-600' : 
            percentage >= 60 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {score}/{total}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>{masteryLevel.icon}</span>
            <span className="font-black">{masteryLevel.label}</span>
          </div>
        </div>
      </div>
      
      {submission.feedback && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
          <h5 className="text-sm font-black text-slate-900 dark:text-white mb-2">AI Feedback:</h5>
          <p className="text-sm text-slate-600 dark:text-slate-300">{submission.feedback}</p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button className="flex-1 py-2 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors">
          View Full Response
        </button>
        {!submission.graded && onGrade && (
          <button
            onClick={() => onGrade(submission)}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors"
          >
            Grade Now
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SubjectMastery({ subject, mastery, topics }) {
  const masteryLevel = MASTERY_LEVELS.find(level => 
    mastery >= level.level * 25 ? level : MASTERY_LEVELS[level.level - 1]
  ) || MASTERY_LEVELS[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-${masteryLevel.color}-100 dark:bg-${masteryLevel.color}-500/20 flex items-center justify-center`}>
            <span className="text-xl">{masteryLevel.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{subject}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{masteryLevel.label} Level</p>
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">
          {Math.round(mastery)}%
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          <span>Topic Breakdown</span>
          <span>Mastery</span>
        </div>
        {topics?.map((topic, index) => {
          const topicMastery = MASTERY_LEVELS.find(level => 
            topic.mastery >= level.level * 25 ? level : MASTERY_LEVELS[level.level - 1]
          ) || MASTERY_LEVELS[0];
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center gap-2">
                <span>{topicMastery.icon}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{topic.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${topicMastery.color}-500`}
                    style={{ width: `${topic.mastery}%` }}
                  />
                </div>
                <span className="text-sm font-black text-slate-600 dark:text-slate-300 w-12 text-right">
                  {Math.round(topic.mastery)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function GradesPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [classData, setClassData] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, students, assignments
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentSession = getSession();
    setSession(currentSession);
    
    const userRole = currentSession?.role || 'student';
    const classId = router.query.classId;
    const assignmentId = router.query.assignmentId;
    
    // Load appropriate data based on user role and query params
    if (userRole === 'educator') {
      // Load teacher data
      if (classId) {
        // Load specific class data
        const demoClass = {
          id: classId,
          name: "Grade 10 Physics",
          subject: "Physics",
          studentCount: 24
        };
        setClassData(demoClass);
        
        // Load student performance data
        const demoStudents = [
          {
            id: "student_1",
            name: "Alice Johnson",
            scores: [
              { assignment: "Chapter 1 Quiz", value: 85, max: 100 },
              { assignment: "Lab Report 1", value: 92, max: 100 },
              { assignment: "Chapter 2 Quiz", value: 78, max: 100 }
            ],
            totalAssignments: 5,
            lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "student_2", 
            name: "Bob Chen",
            scores: [
              { assignment: "Chapter 1 Quiz", value: 91, max: 100 },
              { assignment: "Lab Report 1", value: 88, max: 100 },
              { assignment: "Chapter 2 Quiz", value: 95, max: 100 }
            ],
            totalAssignments: 5,
            lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setStudents(demoStudents);
        
        // Load submissions
        const demoSubmissions = [
          {
            id: "sub_1",
            title: "Chapter 5 Quiz: Fractions and Decimals",
            studentName: "Alice Johnson",
            score: 85,
            total: 100,
            submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            graded: false,
            feedback: null
          },
          {
            id: "sub_2",
            title: "Lab Report: Chemical Reactions", 
            studentName: "Bob Chen",
            score: 92,
            total: 100,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            graded: true,
            feedback: "Excellent analysis of the chemical reactions. Your observations were detailed and your conclusions were well-supported by the data."
          }
        ];
        setSubmissions(demoSubmissions);
      }
    } else if (userRole === 'student') {
      // Load student data
      const demoSubjectMastery = [
        {
          subject: "Mathematics",
          mastery: 78,
          topics: [
            { name: "Algebra", mastery: 85 },
            { name: "Geometry", mastery: 72 },
            { name: "Statistics", mastery: 76 }
          ]
        },
        {
          subject: "Physics",
          mastery: 82,
          topics: [
            { name: "Mechanics", mastery: 88 },
            { name: "Thermodynamics", mastery: 76 },
            { name: "Waves", mastery: 82 }
          ]
        },
        {
          subject: "English",
          mastery: 74,
          topics: [
            { name: "Reading Comprehension", mastery: 78 },
            { name: "Writing", mastery: 71 },
            { name: "Grammar", mastery: 73 }
          ]
        }
      ];
      
      // Convert to submissions format for consistency
      setSubmissions([
        {
          id: "student_progress",
          title: "Overall Progress",
          subjectMastery: demoSubjectMastery
        }
      ]);
    }
  }, [router.query]);

  const userRole = session?.role || 'student';

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Grades & Progress - Elora</title>
        <meta name="theme-color" content="#070b16" />
      </Head>

      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="elora-container pt-8 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                {userRole === 'educator' ? 'Class Performance' : 'My Progress'}
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                {classData ? `${classData.name} • ${classData.studentCount} students` : 'Track learning and performance'}
              </p>
            </div>
            
            {userRole === 'educator' && (
              <div className="flex gap-3">
                <Link
                  href="/assignments"
                  className="px-4 py-2 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-colors"
                >
                  Assignments
                </Link>
                <Link
                  href="/classes"
                  className="px-4 py-2 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-black hover:bg-slate-50 transition-colors"
                >
                  Classes
                </Link>
              </div>
            )}
          </div>

          {/* View Mode Tabs for Educators */}
          {userRole === 'educator' && (
            <div className="flex gap-2 mb-8 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'students', label: 'Students', icon: '👥' },
                { id: 'assignments', label: 'Assignments', icon: '📋' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                    viewMode === tab.id 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Content based on role and view mode */}
          {userRole === 'educator' && viewMode === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <ProgressCard
                title="Class Average"
                value={84}
                maxValue={100}
                color="emerald"
                icon="📈"
                trend={5}
              />
              <ProgressCard
                title="Assignment Completion"
                value={41}
                maxValue={50}
                color="indigo"
                icon="✅"
                trend={8}
              />
              <ProgressCard
                title="Active Students"
                value={22}
                maxValue={24}
                color="amber"
                icon="👥"
                trend={-2}
              />
            </div>
          )}

          {userRole === 'educator' && viewMode === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Student Performance</h3>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {students.length} students total
                </div>
              </div>
              {students.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onViewDetails={(student) => {
                    // TODO: Navigate to student detail view
                    alert(`Student details for ${student.name} coming soon!`);
                  }}
                />
              ))}
            </div>
          )}

          {userRole === 'educator' && viewMode === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Submissions</h3>
                <Link
                  href="/assignments"
                  className="text-sm font-black text-indigo-600 hover:text-indigo-700"
                >
                  View All →
                </Link>
              </div>
              {submissions.map(submission => (
                <AssignmentSubmission
                  key={submission.id}
                  submission={submission}
                  onGrade={(submission) => {
                    // TODO: Open grading modal
                    alert(`Grading interface for ${submission.title} coming soon!`);
                  }}
                />
              ))}
            </div>
          )}

          {/* Student View - Subject Mastery */}
          {userRole === 'student' && submissions[0]?.subjectMastery && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Your Learning Journey</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Track your progress across different subjects and see where you're excelling
                </p>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-3">
                {submissions[0].subjectMastery.map((subject, index) => (
                  <SubjectMastery
                    key={index}
                    subject={subject.subject}
                    mastery={subject.mastery}
                    topics={subject.topics}
                  />
                ))}
              </div>
              
              {/* AI Recommendations */}
              <div className="mt-12 bg-gradient-to-r from-indigo-500 to-fuchsia-600 rounded-3xl p-8 text-white text-center">
                <h3 className="text-2xl font-black mb-4">Personalized Learning Path</h3>
                <p className="mb-6 opacity-90 max-w-2xl mx-auto">
                  Based on your progress, Elora recommends focusing on these areas to improve your mastery level.
                </p>
                <Link
                  href="/assistant"
                  className="inline-flex px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-colors"
                >
                  Get AI Help
                </Link>
              </div>
            </div>
          )}

          {/* Empty State */}
          {((userRole === 'educator' && students.length === 0) || 
            (userRole === 'student' && submissions.length === 0)) && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-3xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">
                {userRole === 'educator' ? 'No Student Data Yet' : 'No Progress Data Yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                {userRole === 'educator' 
                  ? 'Once students start submitting assignments, you\'ll see their progress and performance data here.'
                  : 'Complete assignments and activities to see your learning progress and achievements.'
                }
              </p>
              {userRole === 'student' && (
                <Link
                  href="/assistant"
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors"
                >
                  Start Learning
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}