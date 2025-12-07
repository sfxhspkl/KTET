import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DashboardStats, User, Subject, QuizLog, Message, AppNotification, SyllabusItem } from '../types';
import { messageAPI } from '../services/api';
import { Button } from './Button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Play, TrendingUp, AlertTriangle, User as UserIcon, BookOpen, Hash, History, LogOut, Camera, Save, X, Clock, Award, Target, Calendar, Settings, MessageSquare, Send, Download, Bell, CheckSquare, Square, FileText } from 'lucide-react';
import { MAIN_SUBJECTS } from '../constants';

interface UserDashboardProps {
   user: User;
   stats: DashboardStats;
   subjects: Subject[];
   history: QuizLog[];
   messages: Message[];
   notifications?: AppNotification[];
   syllabus?: SyllabusItem[];
   activeTab: 'home' | 'profile' | 'history' | 'messages' | 'syllabus';
   onTabChange: (tab: 'home' | 'profile' | 'history' | 'messages' | 'syllabus') => void;
   onStartQuiz: (subjectId: string | 'mixed', count: number) => void;
   onLogout: () => void;
   onUpdateUser: (user: User) => void;
   onManageQuestions?: () => void;
   onSendMessage: (content: string) => void;
   installPromptOpen: boolean;
   onDismissInstall: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
   user, stats, subjects, history, messages, notifications = [], syllabus = [],
   activeTab, onTabChange,
   onStartQuiz, onLogout, onUpdateUser, onManageQuestions, onSendMessage,
   installPromptOpen, onDismissInstall
}) => {
   // Local alias for compatibility with existing code (or just use onTabChange directly)
   const setActiveTab = onTabChange;

   const [quizSetup, setQuizSetup] = useState<{ step: 'none' | 'subject' | 'count'; subjectId: string | null }>({
      step: 'none',
      subjectId: null
   });
   // Removed isSyllabusOpen state

   // Local state for formatted time to ensure it updates
   const [formattedTime, setFormattedTime] = useState('');

   // Local state for current clock
   const [currentTime, setCurrentTime] = useState(new Date());

   // Profile Edit State
   const [isEditingProfile, setIsEditingProfile] = useState(false);
   const [editFormData, setEditFormData] = useState<User>(user);

   // Message State
   const [newMessage, setNewMessage] = useState('');
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const chatInputRef = useRef<HTMLInputElement>(null);

   // Notification State
   const [popupNotif, setPopupNotif] = useState<AppNotification | null>(null);

   useEffect(() => {
      // Check for popup notifications on mount
      const activePopup = notifications.find(n => n.type === 'popup' && n.active);
      if (activePopup) {
         const hasSeen = sessionStorage.getItem(`seen_notif_${activePopup.id}`);
         if (!hasSeen) {
            setPopupNotif(activePopup);
            sessionStorage.setItem(`seen_notif_${activePopup.id}`, 'true');
         }
      }
   }, [notifications]);

   // Redirect to profile if no subjects selected
   useEffect(() => {
      if (!user.selectedSubjects || user.selectedSubjects.length === 0) {
         if (activeTab !== 'profile') {
            setActiveTab('profile');
         }
      }
   }, [user.selectedSubjects]);

   // Scroll to bottom of chat
   const scrollToBottom = () => {
      if (messagesEndRef.current) {
         messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
   };

   useEffect(() => {
      if (activeTab === 'messages') {
         // Small timeout to ensure DOM is ready especially on mobile
         setTimeout(scrollToBottom, 100);
      }
   }, [messages, activeTab]);

   // Chart Data
   const completionData = [
      { name: 'Completed', value: stats.completionRate },
      { name: 'Remaining', value: 100 - stats.completionRate },
   ];

   // --- PREDICTION LOGIC ---
   const calculatePrediction = () => {
      if (history.length === 0) return { score: 0, probability: 'Unknown', color: 'text-slate-400' };

      const totalCorrect = history.reduce((acc, curr) => acc + curr.correctCount, 0);
      const totalQuestions = history.reduce((acc, curr) => acc + curr.totalQuestions, 0);

      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) : 0;
      const predictedScore = Math.round(accuracy * 150); // Out of 150 marks

      let probability = 'Low';
      let color = 'text-red-500';

      if (accuracy >= 0.60) { // 60% is usually pass
         probability = 'High';
         color = 'text-green-600';
      } else if (accuracy >= 0.45) {
         probability = 'Medium';
         color = 'text-amber-500';
      }

      return { score: predictedScore, probability, color };
   };

   const prediction = calculatePrediction();

   // --- TIME FORMATTING ---
   useEffect(() => {
      const formatSeconds = (totalSeconds: number) => {
         const hours = Math.floor(totalSeconds / 3600);
         const minutes = Math.floor((totalSeconds % 3600) / 60);
         if (hours > 0) return `${hours}h ${minutes}m`;
         return `${minutes}m`;
      };
      setFormattedTime(formatSeconds(user.totalUsageTime || 0));
   }, [user.totalUsageTime]);

   // --- MARK MESSAGES READ ---
   useEffect(() => {
      if (activeTab === 'messages') {
         const markRead = async () => {
            try {
               await messageAPI.markAsReadByUser(user._id || user.id);
            } catch (error) {
               console.error('Error marking messages read:', error);
            }
         };
         markRead();
      }
   }, [activeTab, user._id, user.id]);

   // --- CURRENT CLOCK ---
   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   const dateString = currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

   // --- QUIZ SETUP HANDLERS ---
   const handleStartSetup = () => {
      setQuizSetup({ step: 'subject', subjectId: null });
   };

   const selectSubject = (id: string) => {
      setQuizSetup({ step: 'count', subjectId: id });
   };

   const confirmStart = (count: number) => {
      if (quizSetup.subjectId) {
         onStartQuiz(quizSetup.subjectId, count);
         setQuizSetup({ step: 'none', subjectId: null });
      }
   };

   // --- PROFILE HANDLERS ---
   const handleProfileSave = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateUser(editFormData);
      setIsEditingProfile(false);
   };

   const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setEditFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
         };
         reader.readAsDataURL(file);
      }
   };

   const toggleSubjectSelection = (subjectId: string) => {
      const current = editFormData.selectedSubjects || [];
      if (current.includes(subjectId)) {
         setEditFormData({ ...editFormData, selectedSubjects: current.filter(id => id !== subjectId) });
      } else {
         setEditFormData({ ...editFormData, selectedSubjects: [...current, subjectId] });
      }
   };

   const handleSubmitMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim()) {
         onSendMessage(newMessage);
         setNewMessage('');
         if (window.innerWidth > 768) {
            chatInputRef.current?.focus();
         }
      }
   };

   const activeTicker = notifications.find(n => n.type === 'ticker' && n.active);

   // Filter subjects based on User Category AND selected subjects
   const displaySubjects = subjects.filter(s => {
      if (user.selectedSubjects && user.selectedSubjects.length > 0) {
         return user.selectedSubjects.includes(s._id);
      }
      return true;
   });

   // Filter Syllabus Logic
   const filteredSyllabus = syllabus.filter(item => {
      if (item.tetCategory !== user.tetCategory) return false;
      if (user.selectedSubjects && user.selectedSubjects.length > 0) {
         return user.selectedSubjects.includes(item.subjectId);
      }
      return true;
   }).sort((a, b) => a.order - b.order);

   const syllabusBySubject = filteredSyllabus.reduce((acc, item) => {
      if (!acc[item.subjectId]) acc[item.subjectId] = [];
      acc[item.subjectId].push(item);
      return acc;
   }, {} as Record<string, SyllabusItem[]>);

   if (activeTab === 'syllabus') {
      return (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                     <FileText className="w-6 h-6 text-indigo-600" /> Syllabus
                  </h2>
                  <p className="text-sm text-slate-500">Category {user.tetCategory} • Relevant Topics</p>
               </div>
               {/* <Button variant="secondary" onClick={() => onTabChange('home')}>Back</Button> */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6">
                  {Object.keys(syllabusBySubject).length === 0 ? (
                     <div className="text-center py-12 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No syllabus content available for your selected subjects.</p>
                     </div>
                  ) : (
                     <div className="space-y-8">
                        {Object.keys(syllabusBySubject).map(subId => {
                           const subName = subjects.find(s => s._id === subId)?.name || 'Unknown Subject';
                           const subColor = subjects.find(s => s._id === subId)?.color || '#6366f1';

                           return (
                              <div key={subId} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                 <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subColor }}></div>
                                    <h4 className="font-bold text-slate-800">{subName}</h4>
                                 </div>
                                 <div className="divide-y divide-slate-100">
                                    {syllabusBySubject[subId].map(item => (
                                       <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                                          <h5 className="font-semibold text-indigo-700 text-sm mb-1">{item.unitTitle}</h5>
                                          <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            </div>
         </div>
      );
   }

   if (activeTab === 'profile') {
      return (
         <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="h-32 bg-indigo-600"></div>
               {isEditingProfile ? (
                  <form onSubmit={handleProfileSave} className="px-6 pb-6 relative">
                     <div className="absolute -top-12 left-6 group">
                        <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden relative">
                           <img src={editFormData.avatarUrl} className="w-full h-full object-cover" alt="" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                           </div>
                        </div>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-24 h-24 -top-12 opacity-0 cursor-pointer" />
                     </div>

                     <div className="pt-14 flex justify-between items-start">
                        <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
                        <div className="flex gap-2">
                           <Button type="button" variant="ghost" size="sm" onClick={() => { setIsEditingProfile(false); setEditFormData(user); }}>
                              <X className="w-4 h-4 mr-1" /> Cancel
                           </Button>
                           <Button type="submit" size="sm">
                              <Save className="w-4 h-4 mr-1" /> Save
                           </Button>
                        </div>
                     </div>

                     <div className="mt-6 space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                           <input className="w-full border p-2 rounded" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                           <input className="w-full border p-2 rounded" value={editFormData.email || ''} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                              <input className="w-full border p-2 rounded" value={editFormData.mobile || ''} onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">TET Category</label>
                              <select disabled className="w-full border p-2 rounded bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.tetCategory}>
                                 <option value="1">Category 1</option>
                                 <option value="2">Category 2</option>
                                 <option value="3">Category 3</option>
                              </select>
                              <p className="text-xs text-slate-400 mt-1">Contact admin to change category.</p>
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Main Subject</label>
                           <select
                              className="w-full border p-2 rounded"
                              value={editFormData.mainSubject || ''}
                              onChange={e => setEditFormData({ ...editFormData, mainSubject: e.target.value })}
                           >
                              <option value="">Select Main Subject...</option>
                              {MAIN_SUBJECTS.map(subj => (
                                 <option key={subj} value={subj}>{subj}</option>
                              ))}
                           </select>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <label className="block text-sm font-medium text-slate-700 mb-3">Selected Subjects</label>
                           <div className="grid grid-cols-2 gap-2">
                              {subjects.map(s => (
                                 <label key={s._id} className="flex items-center space-x-2 cursor-pointer">
                                    <div
                                       className={`w-5 h-5 rounded border flex items-center justify-center ${editFormData.selectedSubjects?.includes(s._id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}
                                       onClick={(e) => { e.preventDefault(); toggleSubjectSelection(s._id); }}
                                    >
                                       {editFormData.selectedSubjects?.includes(s._id) && <CheckSquare className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className="text-sm text-slate-700">{s.name}</span>
                                 </label>
                              ))}
                           </div>
                           <p className="text-xs text-slate-400 mt-2">Questions will be filtered based on these selections.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                              <input className="w-full border p-2 rounded" value={editFormData.district || ''} onChange={e => setEditFormData({ ...editFormData, district: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Sub District</label>
                              <input className="w-full border p-2 rounded" value={editFormData.subDistrict || ''} onChange={e => setEditFormData({ ...editFormData, subDistrict: e.target.value })} />
                           </div>
                        </div>
                     </div>
                  </form>
               ) : (
                  <div className="px-6 pb-6 relative">
                     <div className="absolute -top-12 left-6">
                        <img src={user.avatarUrl} className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover" alt="" />
                     </div>
                     <div className="pt-14 flex justify-between items-start">
                        <div>
                           <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                           <p className="text-slate-500">@{user.username} • TET Category {user.tetCategory}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setEditFormData(user); setIsEditingProfile(true); }}>
                           Edit Profile
                        </Button>
                     </div>

                     <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg">
                           <p className="text-xs text-slate-500 uppercase font-semibold">Contact Info</p>
                           <div className="mt-2 space-y-1">
                              <p className="text-sm"><strong>Mobile:</strong> {user.mobile || 'N/A'}</p>
                              <p className="text-sm"><strong>Email:</strong> {user.email || 'N/A'}</p>
                           </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                           <p className="text-xs text-slate-500 uppercase font-semibold">Academic Info</p>
                           <div className="mt-2 space-y-1">
                              <p className="text-sm"><strong>Main Subject:</strong> {user.mainSubject || 'Not Set'}</p>
                           </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg col-span-1 md:col-span-2">
                           <p className="text-xs text-slate-500 uppercase font-semibold">Selected Subjects</p>
                           {(!user.selectedSubjects || user.selectedSubjects.length === 0) ? (
                              <div className="mt-2 text-amber-600 text-sm font-medium flex items-center gap-2">
                                 <AlertTriangle className="w-4 h-4" /> Please edit profile to select subjects.
                              </div>
                           ) : (
                              <div className="mt-2 flex flex-wrap gap-2">
                                 {user.selectedSubjects?.map(sid => {
                                    const sub = subjects.find(s => s._id === sid);
                                    return sub ? (
                                       <span key={sid} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
                                          {sub.name}
                                       </span>
                                    ) : null;
                                 })}
                              </div>
                           )}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg">
                           <p className="text-xs text-slate-500 uppercase font-semibold">Location</p>
                           <div className="mt-2 space-y-1">
                              <p className="text-sm"><strong>District:</strong> {user.district || 'N/A'}</p>
                              <p className="text-sm"><strong>Sub-District:</strong> {user.subDistrict || 'N/A'}</p>
                           </div>
                        </div>
                     </div>

                     {/* <div className="mt-6 flex flex-wrap gap-4">
                        <Button onClick={() => setActiveTab('messages')} className="flex-1" variant="secondary">
                           <MessageSquare className="w-4 h-4 mr-2" /> Message Admin
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('home')} className="flex-1">Back to Dashboard</Button>
                     </div> */}
                  </div>
               )}
            </div>
         </div>
      );
   }

   if (activeTab === 'messages') {
      return (
         <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-600" /> Support Chat
               </h2>
               {/* <Button variant="secondary" onClick={() => setActiveTab('home')}>Back</Button> */}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-180px)] md:h-[600px]">
               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.length === 0 ? (
                     <div className="text-center text-slate-400 mt-24">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Start a conversation with admin support.</p>
                     </div>
                  ) : (
                     messages.map(msg => (
                        <div key={msg.id || msg._id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                              }`}>
                              <p className={`text-xs font-bold mb-1 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                 {msg.sender === 'user' ? 'You' : 'Admin Support'}
                              </p>
                              <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content }} />
                              <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                 {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 {msg.sender === 'admin' && (
                                    <span>• {msg.isRead ? 'Read' : 'Unread'}</span>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))
                  )}
                  <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
               </div>

               <div className="p-4 bg-white border-t border-slate-200">
                  <form onSubmit={handleSubmitMessage} className="flex gap-2">
                     <input
                        ref={chatInputRef}
                        className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                     />
                     <Button type="submit" className="rounded-lg px-4">
                        <Send className="w-5 h-5" />
                     </Button>
                  </form>
               </div>
            </div>
         </div>
      );
   }

   if (activeTab === 'history') {
      return (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold">Quiz History</h2>
               {/* <Button variant="secondary" onClick={() => setActiveTab('home')}>Back</Button> */}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {history.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No quiz attempts yet.</div>
               ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold">
                           <tr>
                              <th className="p-4">Date</th>
                              <th className="p-4">Subject</th>
                              <th className="p-4">Score</th>
                              <th className="p-4 text-green-600">Correct</th>
                              <th className="p-4 text-red-600">Wrong</th>
                              <th className="p-4 text-slate-500">Skipped</th>
                              <th className="p-4">Accuracy</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {history.map(log => (
                              <tr key={log.id || log._id}>
                                 <td className="p-4 text-slate-600">
                                    <div className="font-semibold text-slate-900">{new Date(log.date).toLocaleDateString()}</div>
                                    <div className="text-xs">{new Date(log.date).toLocaleTimeString()}</div>
                                 </td>
                                 <td className="p-4 font-medium">{log.subjectName}</td>
                                 <td className="p-4">
                                    <span className={`font-bold ${log.score >= 60 ? 'text-green-600' : 'text-amber-600'}`}>{log.score}%</span>
                                 </td>
                                 <td className="p-4 text-green-600 font-medium">{log.correctCount}</td>
                                 <td className="p-4 text-red-500 font-medium">{log.incorrectCount || 0}</td>
                                 <td className="p-4 text-slate-400 font-medium">{log.skippedCount || 0}</td>
                                 <td className="p-4 text-slate-600">{log.accuracy}%</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6 pb-20 relative animate-in fade-in">

         {/* Mobile Install App Banner */}
         {installPromptOpen && (
            <div className="md:hidden bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between animate-slide-up mb-4 border border-slate-700">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                     <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                     <p className="font-bold text-sm">Install App</p>
                     <p className="text-xs text-slate-300">Add to Home Screen for better experience</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => alert("To install, tap Share -> Add to Home Screen in your browser menu.")} className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg">Install</button>
                  <button onClick={onDismissInstall} className="p-1.5 hover:bg-slate-700 rounded-full"><X className="w-4 h-4 text-slate-400" /></button>
               </div>
            </div>
         )}

         {/* Welcome Card */}
         <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="absolute top-0 right-0 p-32 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>

            <button
               onClick={onLogout}
               className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-600 text-red-100 hover:text-white rounded-full transition-all z-20 shadow-lg border border-red-500/30 backdrop-blur-sm md:hidden"
               title="Logout"
            >
               <LogOut className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full border-2 border-slate-700" />
                  <div>
                     <h1 className="text-2xl font-bold mb-1">Hi, {user.name}</h1>
                     <p className="text-indigo-200 text-sm">Category {user.tetCategory} Student • You are doing great!</p>
                  </div>
               </div>
            </div>
         </div>

         {/* SCROLLING TICKER NOTIFICATION */}
         {activeTicker && (
            <div className="bg-slate-800 text-white overflow-hidden py-2 rounded-lg shadow-sm border border-slate-700 mt-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
               <div className="animate-marquee whitespace-nowrap inline-block" style={{ color: activeTicker.color }}>
                  <span
                     className={`inline-block ${activeTicker.fontSize || 'text-base'} font-medium`}
                     dangerouslySetInnerHTML={{ __html: activeTicker.content }}
                  />
                  <span
                     className={`inline-block ml-16 ${activeTicker.fontSize || 'text-base'} font-medium opacity-50`}
                     dangerouslySetInnerHTML={{ __html: activeTicker.content }}
                  />
               </div>
            </div>
         )}

         {/* POPUP NOTIFICATION MODAL (Portal not needed for simple overlay, z-index suffices usually, but can use portal if sidebar z-index issue persists) */}
         {popupNotif && (
            <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-6 animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                  {popupNotif.imageUrl && (
                     <div className="h-40 w-full bg-slate-100">
                        <img src={popupNotif.imageUrl} alt="Notification" className="w-full h-full object-cover" />
                     </div>
                  )}
                  <div className="p-6 relative">
                     <button
                        onClick={() => setPopupNotif(null)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
                     >
                        <X className="w-4 h-4" />
                     </button>
                     <div className={`space-y-4 text-${popupNotif.alignment || 'center'}`}>
                        <h3 className="font-bold text-lg">Message from Admin</h3>
                        <div
                           className={`${popupNotif.fontSize || 'text-base'}`}
                           style={{ color: popupNotif.color }}
                           dangerouslySetInnerHTML={{ __html: popupNotif.content }}
                        />
                        <Button fullWidth onClick={() => setPopupNotif(null)}>Got it</Button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* SYLLABUS MODAL REMOVED (Converted to Tab) */}

         {user.canManageContent && onManageQuestions && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
               <div>
                  <h3 className="text-indigo-900 font-bold text-lg flex items-center gap-2">
                     <Settings className="w-5 h-5" /> Question Management
                  </h3>
                  <p className="text-indigo-700 text-sm mt-1">
                     You have permission to add and edit questions for Category {user.tetCategory}.
                  </p>
               </div>
               <Button onClick={onManageQuestions} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full sm:w-auto">
                  Manage Questions
               </Button>
            </div>
         )}

         {quizSetup.step === 'none' && (
            <div className="grid grid-cols-1 gap-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
               {/* Action Card with Syllabus Button */}
               <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                     <h3 className="text-lg font-bold text-slate-900">Ready to practice?</h3>
                     <p className="text-slate-500 text-sm">Start a new quiz based on your TET Category {user.tetCategory} syllabus.</p>
                     {user.selectedSubjects && user.selectedSubjects.length > 0 && (
                        <p className="text-xs text-indigo-600 mt-1">Filtered by your {user.selectedSubjects.length} selected subjects.</p>
                     )}
                  </div>
                  <div className="flex gap-3">
                     <Button size="lg" onClick={handleStartSetup} className="shadow-lg shadow-indigo-200 animate-pulse-slow">
                        <Play className="w-5 h-5 mr-2" /> Start Quiz
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {quizSetup.step === 'subject' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center"><BookOpen className="w-5 h-5 mr-2 text-indigo-500" /> Select Subject</h3>
                  <Button size="sm" variant="ghost" onClick={() => setQuizSetup({ step: 'none', subjectId: null })}>Cancel</Button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <button onClick={() => selectSubject('mixed')} className="p-4 rounded-lg border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left">
                     <div className="font-bold text-indigo-700">Mixed Practice</div>
                     <div className="text-xs text-slate-500">
                        {user.selectedSubjects?.length
                           ? `Based on ${user.selectedSubjects.length} subjects`
                           : 'All Subjects combined'}
                     </div>
                  </button>
                  {displaySubjects.map(s => (
                     <button key={s._id} onClick={() => selectSubject(s._id)} className="p-4 rounded-lg border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                           <div className="font-bold text-slate-800">{s.name}</div>
                        </div>
                        <div className="text-xs text-slate-500 pl-5">TET Cat {s.tetCategory}</div>
                     </button>
                  ))}
               </div>
               {displaySubjects.length === 0 && (
                  <div className="text-center p-4 text-slate-500">
                     No subjects found. Please check your profile selection.
                  </div>
               )}
            </div>
         )}

         {quizSetup.step === 'count' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold flex items-center"><Hash className="w-5 h-5 mr-2 text-indigo-500" /> Number of Questions</h3>
                  <Button size="sm" variant="ghost" onClick={() => setQuizSetup({ step: 'subject', subjectId: null })}>Back</Button>
               </div>
               <div className="grid grid-cols-3 gap-4 mb-6">
                  {[10, 20, 30].map(count => (
                     <button key={count} onClick={() => confirmStart(count)} className="py-6 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md transition-all">
                        <span className="text-3xl font-bold text-slate-700 block">{count}</span>
                        <span className="text-xs text-slate-500 uppercase font-semibold">Questions</span>
                     </button>
                  ))}
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {/* ... (Stats Grid) ... */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">

               <div className="col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>

                  <div className="relative flex items-center justify-between">
                     <div>
                        <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">
                           <Clock className="w-3.5 h-3.5" /> Total Usage
                        </div>
                        <div className="text-4xl font-mono font-bold tracking-tight text-white drop-shadow-sm">
                           {formattedTime}
                        </div>
                     </div>

                     <div className="h-12 w-px bg-white/20 mx-4 hidden sm:block"></div>

                     <div className="text-right">
                        <div className="text-3xl font-bold leading-none mb-1 font-mono">
                           {timeString}
                        </div>
                        <div className="text-indigo-200 text-xs font-bold uppercase tracking-wide flex items-center justify-end gap-1">
                           <Calendar className="w-3 h-3" /> {dateString}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-1">Global Accuracy</div>
                  <div className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                     {stats.globalAccuracy}% <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-2">Weak Zones</div>
                  {stats.weakZones && stats.weakZones.length > 0 ? (
                     <div className="space-y-2">
                        {stats.weakZones.map((zone, idx) => (
                           <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="font-medium text-slate-700 truncate max-w-[100px]" title={zone.name}>{zone.name}</span>
                              <span className="font-bold text-amber-600">{zone.accuracy}%</span>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-sm text-slate-400 italic">No weak zones identified yet. Keep practicing!</div>
                  )}
               </div>

               <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                     <Target className="w-3 h-3" /> Exam Prediction
                  </div>

                  <div className="mb-3">
                     <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{prediction.score}</span>
                     <span className="text-lg text-slate-400 font-medium"> / 150</span>
                  </div>

                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${prediction.color.replace('text-', 'border-').replace('600', '200')} bg-slate-50 mb-2`}>
                     <span className={prediction.color}>{prediction.probability} Probability</span>
                  </div>
                  <p className="text-xs text-slate-400">Based on your overall accuracy history.</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-full relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60 pointer-events-none"></div>

               <div className="relative z-10">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-8 flex items-center gap-2">
                     <Award className="w-4 h-4 text-indigo-500" /> Syllabus Progress
                  </h4>

                  <div className="h-56 w-full relative flex items-center justify-center min-w-0">
                     <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                           <Pie
                              data={[{ value: 100 }]}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={80}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              stroke="none"
                              fill="#f1f5f9"
                           />
                           <Pie
                              data={completionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={80}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              cornerRadius={12}
                              stroke="none"
                              paddingAngle={0}
                              animationDuration={400} // Increased speed
                           >
                              {completionData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : 'transparent'} />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>

                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.completionRate}%</span>
                        <span className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wide">Complete</span>
                     </div>
                  </div>
               </div>

               <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                  <div className="bg-indigo-50 p-3 rounded-xl text-center border border-indigo-100">
                     <div className="text-lg font-bold text-indigo-600">{stats.pendingQuestions}</div>
                     <div className="text-[10px] uppercase font-bold text-indigo-400">Pending</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                     <div className="text-lg font-bold text-slate-700">{history.length}</div>
                     <div className="text-[10px] uppercase font-bold text-slate-400">Attempts</div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};