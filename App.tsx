import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/Button';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { QuizInterface } from './components/QuizInterface';
import { QuizReview } from './components/QuizReview';
import {
  authAPI,
  userAPI,
  questionAPI,
  subjectAPI,
  topicAPI,
  quizAPI,
  reportAPI,
  messageAPI,
  notificationAPI,
  syllabusAPI,
  shuffleArray,
  getUserStats
} from './services/api';
import { MAIN_SUBJECTS } from './constants';
import { User, Question, Subject, Topic, QuizLog, TetCategory, IssueReport, Message, AppNotification, SyllabusItem } from './types';
import { Layout, LogOut, GraduationCap, Upload, ArrowLeft, CheckSquare, Loader2, Menu, LayoutDashboard, FileText, History, MessageSquare, Settings, User as UserIcon, Book, Layers, FileText as SyllabusIcon, Users, Bell } from 'lucide-react';

type ViewState = 'auth' | 'signup' | 'dashboard' | 'quiz' | 'result' | 'review' | 'content-mgmt';

// Hook for page visibility to track study time
const usePageVisibility = (onVisibleInterval: () => void) => {
  useEffect(() => {
    let interval: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) window.clearInterval(interval);
      } else {
        interval = window.setInterval(onVisibleInterval, 1000);
      }
    };

    // Initial start if visible
    if (!document.hidden) {
      interval = window.setInterval(onVisibleInterval, 1000);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (interval) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onVisibleInterval]);
};

const App: React.FC = () => {
  // --- GLOBAL STATE (FROM API) ---
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizLog[]>([]);
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // --- SESSION STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('auth');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- AUTH STATE ---
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // --- APP INSTALL PROMPT STATE ---
  const [installPromptOpen, setInstallPromptOpen] = useState(true);

  // User Dashboard Tab State (Controlled by App)
  const [userTab, setUserTab] = useState<'home' | 'profile' | 'history' | 'messages' | 'syllabus'>(() => {
    return (localStorage.getItem('user_active_tab') as 'home' | 'profile' | 'history' | 'messages' | 'syllabus') || 'home';
  });

  // Admin Dashboard Tab State (Controlled by App)
  const [adminTab, setAdminTab] = useState<'overview' | 'questions' | 'subjects' | 'topics' | 'syllabus' | 'users' | 'reports' | 'messages' | 'notifications' | 'profile'>(() => {
    return (localStorage.getItem('admin_active_tab') as any) || 'overview';
  });

  // Persist userTab
  useEffect(() => {
    localStorage.setItem('user_active_tab', userTab);
  }, [userTab]);

  // Persist adminTab
  useEffect(() => {
    localStorage.setItem('admin_active_tab', adminTab);
  }, [adminTab]);

  // --- SIGNUP STATE ---
  const emptySignupUser: Omit<User, '_id'> = {
    name: '',
    username: '',
    password: '',
    role: 'user',
    status: 'active',
    tetCategory: '1',
    mobile: '',
    email: '',
    district: '',
    subDistrict: '',
    avatarUrl: '',
    selectedSubjects: [],
    mainSubject: ''
  };
  const [signupData, setSignupData] = useState<Omit<User, '_id'>>(emptySignupUser);

  // --- QUIZ STATE (PERSISTED IN LOCALSTORAGE FOR RESUME) ---
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [currentQuizSubjectName, setCurrentQuizSubjectName] = useState('');
  const [quizProgress, setQuizProgress] = useState({
    currentIndex: 0,
    answers: {} as Record<string, string>,
    markedForReview: [] as string[],
    timeSeconds: 0
  });

  const [lastResult, setLastResult] = useState<{ correct: number, incorrect: number, skipped: number, score: number } | null>(null);

  // --- INITIALIZE APP ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Try to get current user
          const user = await authAPI.getCurrentUser();
          setCurrentUser(user);
          setCurrentView('dashboard');

          // Load initial data
          await loadAppData(user);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // Token invalid or expired, stay on auth page
        localStorage.removeItem('auth_token');
      } finally {
        setInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Load app data based on user
  const loadAppData = async (user: User) => {
    try {
      // Load subjects and topics (public data)
      const [subjectsData, topicsData, notificationsData] = await Promise.all([
        subjectAPI.getSubjects(),
        topicAPI.getTopics(),
        notificationAPI.getNotifications(),
      ]);

      setSubjects(subjectsData);
      setTopics(topicsData);
      setNotifications(notificationsData);

      if (user.role === 'admin') {
        // Admin loads everything
        const [usersData, questionsData, reportsData, messagesData, syllabusData] = await Promise.all([
          userAPI.getUsers(),
          questionAPI.getQuestions(),
          reportAPI.getReports(),
          messageAPI.getAllMessages(),
          syllabusAPI.getSyllabus(),
        ]);

        setUsers(usersData);
        setQuestions(questionsData);
        setReports(reportsData);
        setMessages(messagesData);
        setSyllabus(syllabusData);
      } else {
        // User loads their specific data
        const [questionsData, historyData, userMessages, syllabusData] = await Promise.all([
          questionAPI.getQuestions({ tetCategory: user.tetCategory, status: 'active' }),
          quizAPI.getQuizHistory(user._id),
          messageAPI.getUserMessages(user._id),
          syllabusAPI.getSyllabus(user.tetCategory),
        ]);

        setQuestions(questionsData);
        setQuizHistory(historyData);
        setMessages(userMessages);
        setSyllabus(syllabusData);
      }
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  };

  const navigateTo = (view: ViewState) => {
    window.scrollTo(0, 0);
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  // --- USAGE TIMER LOGIC ---
  const handleTick = useCallback(async () => {
    if (currentUser && currentUser.role === 'user') {
      const newUsageTime = (currentUser.totalUsageTime || 0) + 1;
      setCurrentUser(prev => {
        if (!prev) return null;
        return { ...prev, totalUsageTime: newUsageTime };
      });

      // Update backend every 30 seconds
      if (newUsageTime % 30 === 0) {
        try {
          await userAPI.updateUsageTime(currentUser._id, newUsageTime);
        } catch (error) {
          console.error('Error updating usage time:', error);
        }
      }
    }
  }, [currentUser]);

  usePageVisibility(handleTick);

  // --- HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const { user, token } = await authAPI.login(loginData.username, loginData.password);
      setCurrentUser(user);
      navigateTo('dashboard');
      setLoginData({ username: '', password: '' });

      // Load app data
      await loadAppData(user);
    } catch (error: any) {
      setLoginError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.username || !signupData.password || !signupData.name) {
      setLoginError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const userData = {
        ...signupData,
        avatarUrl: signupData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(signupData.name)}&background=random`,
      };

      const { user, token } = await authAPI.signup(userData);
      setCurrentUser(user);
      navigateTo('dashboard');
      setSignupData(emptySignupUser);

      // Load app data
      await loadAppData(user);
    } catch (error: any) {
      setLoginError(error.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignupData({ ...signupData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSignupSubject = (subjectId: string) => {
    const current = signupData.selectedSubjects || [];
    if (current.includes(subjectId)) {
      setSignupData({ ...signupData, selectedSubjects: current.filter(id => id !== subjectId) });
    } else {
      setSignupData({ ...signupData, selectedSubjects: [...current, subjectId] });
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const updated = await userAPI.updateUser(updatedUser._id, updatedUser);

      if (currentUser && currentUser._id === updatedUser._id) {
        setCurrentUser(updated);
      }

      if (users.length > 0) {
        setUsers(users.map(u => u._id === updated._id ? updated : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleLogout = async () => {
    // Save final usage time
    if (currentUser && currentUser.role === 'user') {
      try {
        await userAPI.updateUsageTime(currentUser._id, currentUser.totalUsageTime || 0);
      } catch (error) {
        console.error('Error saving usage time:', error);
      }
    }

    authAPI.logout();
    setCurrentUser(null);

    // Clear state
    setUsers([]);
    setQuestions([]);
    setQuizHistory([]);
    setReports([]);
    setMessages([]);

    // Clear quiz session
    setActiveQuizQuestions([]);
    setCurrentQuizSubjectName('');
    setQuizProgress({ currentIndex: 0, answers: {}, markedForReview: [], timeSeconds: 0 });

    navigateTo('auth');
  };

  const handleManageQuestions = () => {
    if (currentUser?.canManageContent) {
      navigateTo('content-mgmt');
    }
  };

  const handleReportIssue = async (questionId: string, description: string) => {
    try {
      const question = questions.find(q => q._id === questionId);
      const newReport = await reportAPI.createReport({
        questionId,
        questionText: question?.text || 'Unknown Question',
        userName: currentUser?.name || 'Anonymous',
        description,
      });
      setReports([newReport, ...reports]);
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentUser) return;

    try {
      const newMessage = await messageAPI.sendMessage({
        userId: currentUser._id,
        userName: currentUser.name,
        sender: 'user',
        content,
      });
      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAdminMessage = async (userId: string, content: string) => {
    try {
      const targetUser = users.find(u => u._id === userId);
      const newMessage = await messageAPI.sendMessage({
        userId: userId,
        userName: targetUser?.name || 'User',
        sender: 'admin',
        content,
      });
      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error('Error sending admin message:', error);
    }
  };

  const startQuiz = (subjectId: string, count: number) => {
    if (!currentUser) return;

    let filtered = questions.filter(q =>
      (q.tetCategory === 'all' || q.tetCategory === currentUser.tetCategory) &&
      q.status === 'active'
    );

    if (currentUser.selectedSubjects && currentUser.selectedSubjects.length > 0) {
      filtered = filtered.filter(q => currentUser.selectedSubjects?.includes(q.subjectId));
    }

    let subjectName = "Mixed Practice";

    if (subjectId !== 'mixed') {
      filtered = filtered.filter(q => q.subjectId === subjectId);
      const sub = subjects.find(s => s._id === subjectId);
      if (sub) subjectName = sub.name;
    } else {
      if (currentUser.selectedSubjects && currentUser.selectedSubjects.length > 0) {
        subjectName = `Mixed (${currentUser.selectedSubjects.length} subjects)`;
      }
    }

    const finalCount = Math.min(count, filtered.length);

    // Shuffle questions AND options
    let selectedQuestions = shuffleArray(filtered).slice(0, finalCount).map((q: Question) => ({
      ...q,
      options: shuffleArray([...q.options])
    }));

    if (selectedQuestions.length === 0) {
      alert("No active questions available for this selection. Please check your Profile to ensure you have selected subjects that have available questions.");
      return;
    }

    setActiveQuizQuestions(selectedQuestions);
    setCurrentQuizSubjectName(subjectName);

    // Reset Progress
    setQuizProgress({
      currentIndex: 0,
      answers: {},
      markedForReview: [],
      timeSeconds: 0
    });

    navigateTo('quiz');
  };

  const handleQuizProgressUpdate = (progress: any) => {
    setQuizProgress(progress);
  };

  const handleQuizComplete = async (results: { correct: number; incorrect: number; skipped: number; timeTaken: number }) => {
    const total = results.correct + results.incorrect + results.skipped;
    const score = total === 0 ? 0 : Math.round((results.correct / total) * 100);

    setLastResult({ ...results, score });

    if (currentUser) {
      try {
        const newLog = await quizAPI.completeQuiz({
          subjectName: currentQuizSubjectName,
          score: score,
          accuracy: score,
          totalQuestions: total,
          correctCount: results.correct,
          incorrectCount: results.incorrect,
          skippedCount: results.skipped
        });
        setQuizHistory([newLog, ...quizHistory]);
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    }

    // Do NOT clear session here yet, so we can review
    navigateTo('result');
  };

  // Filter subjects for the current user's dashboard
  const userSubjects = currentUser
    ? subjects.filter(s => s.tetCategory === currentUser.tetCategory)
    : [];

  const userHistory = currentUser
    ? quizHistory.filter(h => h.userId === currentUser._id)
    : [];

  const userMessages = currentUser
    ? messages.filter(m => m.userId === currentUser._id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const availableSubjects = subjects.filter(s => s.tetCategory === signupData.tetCategory);

  // Show loading screen during initialization
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">KTET - Tamil</h1>
            <p className="text-slate-500 mt-2">Sign in to start learning</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Enter username"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Enter password"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                disabled={loading}
              />
            </div>

            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Logging in...</> : 'Login'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm mb-2">New here?</p>
            <Button variant="outline" fullWidth onClick={() => { setLoginError(''); navigateTo('signup'); }} disabled={loading}>Create an Account</Button>
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">
            <p>Default: user/user (Student) or admin/admin (Admin)</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 my-8">
          <div className="mb-6 flex items-center">
            <button onClick={() => navigateTo('auth')} className="mr-4 text-slate-500 hover:text-slate-800" disabled={loading}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {signupData.avatarUrl ? (
                    <img src={signupData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={loading} />
                <div className="absolute bottom-0 right-0 bg-indigo-600 p-1 rounded-full text-white border-2 border-white">
                  <Upload className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input className="w-full border p-2.5 rounded-lg" required value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                <input className="w-full border p-2.5 rounded-lg" required value={signupData.username} onChange={e => setSignupData({ ...signupData, username: e.target.value })} disabled={loading} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input type="password" className="w-full border p-2.5 rounded-lg" required value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  className="w-full border p-2.5 rounded-lg bg-white"
                  required
                  value={signupData.tetCategory}
                  onChange={e => setSignupData({ ...signupData, tetCategory: e.target.value as TetCategory, selectedSubjects: [] })}
                  disabled={loading}
                >
                  <option value="1">Category 1</option>
                  <option value="2">Category 2</option>
                  <option value="3">Category 3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Main Subject</label>
              <select
                className="w-full border p-2.5 rounded-lg bg-white"
                value={signupData.mainSubject}
                onChange={e => setSignupData({ ...signupData, mainSubject: e.target.value })}
                disabled={loading}
              >
                <option value="">Select Main Subject...</option>
                {MAIN_SUBJECTS.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Your Subjects</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availableSubjects.map(s => (
                  <label key={s._id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white rounded">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${signupData.selectedSubjects?.includes(s._id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}
                      onClick={(e) => { e.preventDefault(); toggleSignupSubject(s._id); }}
                    >
                      {signupData.selectedSubjects?.includes(s._id) && <CheckSquare className="w-3 h-3" />}
                    </div>
                    <span className="text-xs text-slate-700">{s.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Questions will be filtered based on these selections.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full border p-2.5 rounded-lg" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} disabled={loading} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                <input className="w-full border p-2.5 rounded-lg" value={signupData.mobile} onChange={e => setSignupData({ ...signupData, mobile: e.target.value })} disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <input className="w-full border p-2.5 rounded-lg" value={signupData.district} onChange={e => setSignupData({ ...signupData, district: e.target.value })} disabled={loading} />
              </div>
            </div>

            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

            <div className="pt-4">
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Account...</> : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentView === 'quiz') {
    return (
      <div className="h-screen bg-slate-100 p-0 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto h-full">
          <QuizInterface
            questions={activeQuizQuestions}
            initialProgress={quizProgress}
            onProgressUpdate={handleQuizProgressUpdate}
            onComplete={handleQuizComplete}
            onExit={() => navigateTo('dashboard')}
            onReportIssue={handleReportIssue}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'result' && lastResult) {
    // SVG Calc
    const r = 58;
    const c = 2 * Math.PI * r;
    const offset = c - (lastResult.score / 100) * c;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white">
            <h2 className="text-2xl font-bold mb-6">Quiz Completed!</h2>

            <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-indigo-800"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white transition-all duration-1000 ease-out"
                  strokeDasharray={c}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{lastResult.score}%</span>
                <span className="text-xs uppercase opacity-80 mt-1">Score</span>
              </div>
            </div>
            <p className="mt-6 text-indigo-200 font-medium">{currentQuizSubjectName}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                <div className="text-2xl font-bold text-green-600">{lastResult.correct}</div>
                <div className="text-[10px] uppercase font-bold text-green-800 opacity-60">Correct</div>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-2xl font-bold text-red-500">{lastResult.incorrect}</div>
                <div className="text-[10px] uppercase font-bold text-red-800 opacity-60">Wrong</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-2xl font-bold text-slate-500">{lastResult.skipped}</div>
                <div className="text-[10px] uppercase font-bold text-slate-700 opacity-60">Skipped</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button fullWidth size="lg" onClick={() => navigateTo('review')} variant="secondary">Review Answers</Button>
              <Button fullWidth size="lg" onClick={() => navigateTo('dashboard')}>Return Home</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'review') {
    return (
      <div className="h-screen bg-slate-100 p-0 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto h-full rounded-2xl overflow-hidden shadow-2xl">
          <QuizReview
            questions={activeQuizQuestions}
            userAnswers={quizProgress.answers}
            onExit={() => navigateTo('dashboard')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header - Show for admin OR user (always) */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'user') && (
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">KTET-Tamil</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {(currentUser?.role === 'admin' || currentUser?.role === 'user') && (
        <aside className={`
          fixed top-0 left-0 w-64 bg-slate-900 text-white h-full z-50 flex flex-col 
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}
        `}>
          <div className="p-6 flex items-center space-x-3 hidden md:flex">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">KTET-Tamil</span>
          </div>

          {/* Mobile Sidebar Header */}
          <div className="p-6 flex items-center justify-between md:hidden border-b border-slate-800">
            <span className="text-xl font-bold tracking-tight">Menu</span>
            <button onClick={() => setIsSidebarOpen(false)}>
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 p-4">
            {/* User Navigation Sidebar */}
            {currentUser?.role === 'user' ? (
              <div className="space-y-1">
                <Button
                  variant={currentView === 'dashboard' && userTab === 'home' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${currentView === 'dashboard' && userTab === 'home' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setUserTab('home'); navigateTo('dashboard'); setIsSidebarOpen(false); }}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
                </Button>
                <Button
                  variant={currentView === 'dashboard' && userTab === 'syllabus' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${currentView === 'dashboard' && userTab === 'syllabus' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setUserTab('syllabus'); navigateTo('dashboard'); setIsSidebarOpen(false); }}
                >
                  <FileText className="w-5 h-5 mr-3" /> Syllabus
                </Button>
                <Button
                  variant={currentView === 'dashboard' && userTab === 'history' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${currentView === 'dashboard' && userTab === 'history' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setUserTab('history'); navigateTo('dashboard'); setIsSidebarOpen(false); }}
                >
                  <History className="w-5 h-5 mr-3" /> History
                </Button>
                <Button
                  variant={currentView === 'dashboard' && userTab === 'messages' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${currentView === 'dashboard' && userTab === 'messages' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setUserTab('messages'); navigateTo('dashboard'); setIsSidebarOpen(false); }}
                >
                  <MessageSquare className="w-5 h-5 mr-3" /> Messages
                </Button>
                {currentUser.canManageContent && (
                  <Button
                    variant={currentView === 'content-mgmt' ? 'primary' : 'ghost'}
                    fullWidth
                    className={`!justify-start pl-4 mt-4 ${currentView === 'content-mgmt' ? 'bg-indigo-600' : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30'}`}
                    onClick={handleManageQuestions}
                  >
                    <Settings className="w-5 h-5 mr-3" /> Manage Content
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Button
                  variant={adminTab === 'overview' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'overview' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('overview'); setIsSidebarOpen(false); }}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" /> Overview
                </Button>
                <Button
                  variant={adminTab === 'questions' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'questions' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('questions'); setIsSidebarOpen(false); }}
                >
                  <FileText className="w-5 h-5 mr-3" /> Questions
                </Button>
                <Button
                  variant={adminTab === 'subjects' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'subjects' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('subjects'); setIsSidebarOpen(false); }}
                >
                  <Book className="w-5 h-5 mr-3" /> Subjects
                </Button>
                <Button
                  variant={adminTab === 'topics' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'topics' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('topics'); setIsSidebarOpen(false); }}
                >
                  <Layers className="w-5 h-5 mr-3" /> Topics
                </Button>
                <Button
                  variant={adminTab === 'syllabus' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'syllabus' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('syllabus'); setIsSidebarOpen(false); }}
                >
                  <SyllabusIcon className="w-5 h-5 mr-3" /> Syllabus
                </Button>
                <Button
                  variant={adminTab === 'users' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'users' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('users'); setIsSidebarOpen(false); }}
                >
                  <Users className="w-5 h-5 mr-3" /> Users
                </Button>
                <Button
                  variant={adminTab === 'messages' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'messages' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('messages'); setIsSidebarOpen(false); }}
                >
                  <MessageSquare className="w-5 h-5 mr-3" /> Messages
                  {messages.filter(m => m.sender === 'user' && !m.isRead).length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {messages.filter(m => m.sender === 'user' && !m.isRead).length}
                    </span>
                  )}
                </Button>
                <Button
                  variant={adminTab === 'notifications' ? 'primary' : 'ghost'}
                  fullWidth
                  className={`!justify-start pl-4 ${adminTab === 'notifications' ? 'bg-indigo-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => { setAdminTab('notifications'); setIsSidebarOpen(false); }}
                >
                  <Bell className="w-5 h-5 mr-3" /> Push Msgs
                </Button>
              </div>
            )}

            {/* Mobile Navigation Links could go here if we extracted navigation from Dashboard components */}
          </div>

          <div className="p-4 border-t border-slate-800">
            <div
              className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors"
              onClick={() => {
                if (currentUser?.role === 'user') {
                  setUserTab('profile');
                  navigateTo('dashboard');
                  setIsSidebarOpen(false);
                } else if (currentUser?.role === 'admin') {
                  setAdminTab('profile');
                  navigateTo('dashboard');
                  setIsSidebarOpen(false);
                }
              }}
            >
              <img src={currentUser?.avatarUrl} alt="User" className="w-10 h-10 rounded-full border border-slate-600" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" fullWidth onClick={handleLogout} className="flex items-center justify-center">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 h-full overflow-y-auto relative`}>
        {currentUser?.role === 'admin' ? (
          <div className="p-4 md:p-8">
            <AdminDashboard
              questions={questions}
              subjects={subjects}
              topics={topics}
              users={users}
              reports={reports}
              messages={messages}
              notifications={notifications}
              syllabus={syllabus}
              onUpdateQuestions={questions => setQuestions(questions)}
              onUpdateSubjects={subjects => setSubjects(subjects)}
              onUpdateTopics={topics => setTopics(topics)}
              onUpdateUsers={usersData => setUsers(usersData)}
              onUpdateNotifications={notifs => setNotifications(notifs)}
              onUpdateSyllabus={syl => setSyllabus(syl)}
              onReplyMessage={handleAdminMessage}
              onLogout={handleLogout}
              viewMode={currentView === 'content-mgmt' ? 'questions_only' : 'full'}
              onBack={() => navigateTo('dashboard')}
              userCategory={currentUser.tetCategory as TetCategory}
              onUpdateMessages={setMessages}
              activeTab={adminTab}
              onTabChange={setAdminTab}
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
            />
          </div>
        ) : (
          currentView === 'content-mgmt' ? (
            <div className="p-4 md:p-8">
              <AdminDashboard
                questions={questions}
                subjects={subjects}
                topics={topics}
                users={[]} // Question manager doesn't see users
                viewMode='questions_only'
                onUpdateQuestions={questions => {
                  setQuestions(questions);
                  // Also update local filtered list if needed
                }}
                onUpdateSubjects={subjects => setSubjects(subjects)}
                onUpdateTopics={topics => setTopics(topics)}
                onUpdateUsers={() => { }}
                onLogout={handleLogout}
                onBack={() => navigateTo('dashboard')}
                userCategory={currentUser.tetCategory as TetCategory}
                activeTab={adminTab}
                onTabChange={setAdminTab}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
              />
            </div>
          ) : (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
              <UserDashboard
                user={currentUser!}
                stats={getUserStats()}
                subjects={userSubjects}
                history={userHistory}
                messages={userMessages}
                notifications={notifications}
                syllabus={syllabus}
                onStartQuiz={startQuiz}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                onManageQuestions={handleManageQuestions}
                onSendMessage={handleSendMessage}
                installPromptOpen={installPromptOpen}
                onDismissInstall={() => setInstallPromptOpen(false)}
                activeTab={userTab}
                onTabChange={setUserTab}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default App;