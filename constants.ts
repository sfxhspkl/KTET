import { Question, Subject, Topic, User, DashboardStats, AppNotification, SyllabusItem } from './types';

export const MAIN_SUBJECTS = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Student User',
    username: 'user',
    password: 'user',
    email: 'student@examforge.com',
    mobile: '9876543210',
    district: 'Chennai',
    subDistrict: 'Adyar',
    role: 'user',
    status: 'active',
    tetCategory: '1',
    avatarUrl: 'https://picsum.photos/200/200',
    selectedSubjects: ['sub_child', 'sub_tamil', 'sub_eng', 'sub_math', 'sub_evs'],
    mainSubject: 'Mathematics'
  },
  {
    id: 'a1',
    name: 'Admin Administrator',
    username: 'admin',
    password: 'admin',
    email: 'admin@examforge.com',
    role: 'admin',
    status: 'active',
    tetCategory: '1', // Admins can see everything usually, but type requires it
    avatarUrl: 'https://picsum.photos/201/201'
  }
];

export const SUBJECTS: Subject[] = [
  // Category 1
  { id: 'sub_child', name: 'Child Development', color: '#f59e0b', tetCategory: '1' },
  { id: 'sub_tamil', name: 'Tamil', color: '#ef4444', tetCategory: '1' },
  { id: 'sub_eng', name: 'English', color: '#3b82f6', tetCategory: '1' },
  { id: 'sub_math', name: 'Mathematics', color: '#10b981', tetCategory: '1' },
  { id: 'sub_evs', name: 'Environmental Science', color: '#14b8a6', tetCategory: '1' },

  // Category 2
  { id: 'sub_sci', name: 'Science', color: '#8b5cf6', tetCategory: '2' },
  { id: 'sub_soc', name: 'Social Science', color: '#ec4899', tetCategory: '2' },
  
  // Category 3 Specific
  { id: 'sub_c3_tamil1', name: 'Tamil Part I', color: '#e11d48', tetCategory: '3' },
  { id: 'sub_c3_tamil2', name: 'Tamil Part II', color: '#be123c', tetCategory: '3' },
  { id: 'sub_c3_eng', name: 'English', color: '#2563eb', tetCategory: '3' },
  { id: 'sub_c3_phy', name: 'Physical Science', color: '#7c3aed', tetCategory: '3' },
  { id: 'sub_c3_math', name: 'Mathematics', color: '#059669', tetCategory: '3' },
  { id: 'sub_c3_nat', name: 'Natural Science', color: '#65a30d', tetCategory: '3' },
  { id: 'sub_c3_soc', name: 'Social Science', color: '#db2777', tetCategory: '3' },
];

export const TOPICS: Topic[] = [
  { id: 'top_growth', subjectId: 'sub_child', name: 'Growth & Development', questionCount: 50 },
  { id: 'top_gram', subjectId: 'sub_tamil', name: 'Grammar', questionCount: 100 },
  { id: 'top_poet', subjectId: 'sub_eng', name: 'Poetry', questionCount: 80 },
  { id: 'top_num', subjectId: 'sub_math', name: 'Number System', questionCount: 120 },
  // Category 3 Topics (Examples)
  { id: 'top_c3_lit', subjectId: 'sub_c3_tamil1', name: 'Sangam Literature', questionCount: 40 },
  { id: 'top_c3_alg', subjectId: 'sub_c3_math', name: 'Algebra', questionCount: 60 },
];

export const MOCK_SYLLABUS: SyllabusItem[] = [
  { id: 'syl_1', tetCategory: '1', subjectId: 'sub_child', unitTitle: 'Unit I: Physical Growth', description: 'Growth and maturation, genetic factors', order: 1 },
  { id: 'syl_2', tetCategory: '1', subjectId: 'sub_tamil', unitTitle: 'Unit I: இலக்கணம்', description: 'எழுத்து, சொல், பொருள், யாப்பு, அணி', order: 1 },
  { id: 'syl_3', tetCategory: '3', subjectId: 'sub_c3_math', unitTitle: 'Unit I: Number Systems', description: 'Real numbers, Complex numbers', order: 1 },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subjectId: 'sub_math',
    topicId: 'top_num',
    text: 'What is the place value of 5 in 1524?',
    difficulty: 'easy',
    tags: ['basic'],
    mistakeCount: 1,
    tetCategory: '1', // Only for Cat 1
    status: 'active',
    explanation: 'The digit 5 is in the hundreds place. So 5 * 100 = 500.',
    options: [
      { id: 'o1', text: '5', isCorrect: false },
      { id: 'o2', text: '50', isCorrect: false },
      { id: 'o3', text: '500', isCorrect: true },
      { id: 'o4', text: '5000', isCorrect: false },
    ]
  },
  {
    id: 'q2',
    subjectId: 'sub_child',
    topicId: 'top_growth',
    text: 'Who is known as the father of Child Psychology?',
    difficulty: 'medium',
    tags: ['psychology', 'theory'],
    mistakeCount: 5,
    tetCategory: 'all', // Common for Cat 1 & 2
    status: 'active',
    explanation: 'Jean Piaget is often referred to as the father of child psychology.',
    options: [
      { id: 'o1', text: 'Jean Piaget', isCorrect: true },
      { id: 'o2', text: 'Vygotsky', isCorrect: false },
      { id: 'o3', text: 'Skinner', isCorrect: false },
      { id: 'o4', text: 'Freud', isCorrect: false },
    ]
  },
  {
    id: 'q3',
    subjectId: 'sub_sci',
    topicId: 'unknown',
    text: 'What is the chemical formula for water?',
    difficulty: 'easy',
    tags: ['chemistry'],
    mistakeCount: 0,
    tetCategory: '2', // Only for Cat 2
    status: 'active',
    explanation: 'H2O stands for 2 Hydrogen atoms and 1 Oxygen atom.',
    options: [
      { id: 'o1', text: 'H2O', isCorrect: true },
      { id: 'o2', text: 'CO2', isCorrect: false },
      { id: 'o3', text: 'NaCl', isCorrect: false },
      { id: 'o4', text: 'O2', isCorrect: false },
    ]
  },
  // Cat 3 Question
  {
    id: 'q4',
    subjectId: 'sub_c3_tamil1',
    topicId: 'top_c3_lit',
    text: 'திருக்குறளை எழுதியவர் யார்?',
    difficulty: 'easy',
    tags: ['literature'],
    mistakeCount: 0,
    tetCategory: '3',
    status: 'active',
    explanation: 'திருவள்ளுவர்.',
    options: [
      { id: 'o1', text: 'கம்பர்', isCorrect: false },
      { id: 'o2', text: 'திருவள்ளுவர்', isCorrect: true },
      { id: 'o3', text: 'பாரதியார்', isCorrect: false },
      { id: 'o4', text: 'ஔவையார்', isCorrect: false },
    ]
  }
];

export const MOCK_STATS: DashboardStats = {
  completionRate: 45,
  globalAccuracy: 68,
  pendingQuestions: 120,
  weakZoneCount: 3,
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'ticker',
    content: 'Exam dates announced! <b>Check the official website</b> for details.',
    active: true,
    color: '#ef4444', // red
    fontSize: 'text-base'
  },
  {
    id: 'notif_2',
    type: 'popup',
    content: 'Welcome to the new KTET preparation app. <br/>Start a <b>quiz</b> today!',
    active: true,
    alignment: 'center',
    fontSize: 'text-lg',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=300&h=200'
  }
];