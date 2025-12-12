
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Calendar, TrendingUp, Zap, BookOpen, ChevronRight, 
  MoreHorizontal, Star, Award, Target, Settings, Shield, LogOut,
  Bell, Layout, CheckCircle, Circle, ArrowRight, Lightbulb, PlayCircle, User, Key, Save,
  ArrowUp, X, Lock, Mail, Globe, AlertTriangle, Loader2, Edit2, Plus, Check, Send, Sparkles
} from 'lucide-react';
import { ProfileTab, View } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { auth, db } from '../firebaseConfig';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  deleteUser,
  User as FirebaseUser,
  verifyBeforeUpdateEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Activity } from '../App';

// --- Shared Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[24px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">{title}</h2>
    {subtitle && <p className="text-gray-500 mt-1 font-light">{subtitle}</p>}
  </div>
);

const Badge: React.FC<{ text: string; color?: string; onDelete?: () => void }> = ({ text, color = "bg-mint-100 text-mint-500", onDelete }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${color} flex items-center gap-1`}>
    {text}
    {onDelete && (
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="hover:text-red-500 transition-colors ml-1">
        <X size={12} />
      </button>
    )}
  </span>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const base = "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-mint-300 hover:bg-mint-400 text-white shadow-sm shadow-mint-200 disabled:opacity-50",
    secondary: "bg-cream-100 hover:bg-cream-200 text-gray-700 disabled:opacity-50",
    outline: "border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50",
    danger: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 disabled:opacity-50",
    ghost: "bg-transparent hover:bg-gray-50 text-gray-500 disabled:opacity-50"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Dashboard View ---

interface DashboardProps {
  onNavigate: (view: View) => void;
  onLaunchSession: (topic: string) => void;
  recentActivity: Activity[];
  onAddActivity: (topic: string) => void;
  focusTopic: string;
  setFocusTopic: (topic: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ 
  onNavigate, 
  onLaunchSession, 
  recentActivity,
  onAddActivity,
  focusTopic,
  setFocusTopic
}) => {
  const [focusTime, setFocusTime] = useState('15 minutes');

  // Task 1: Focus Time Options
  const focusTimeOptions = [15, 30, 45, 60, 90, 120, 150, 180];

  const handleFocusSubmit = () => {
    if (!focusTopic.trim()) return;
    // Task 2: Log activity
    onAddActivity(focusTopic);
    
    // Launch Session
    onLaunchSession(`Create a focused study plan for the topic: ${focusTopic} based on a duration of ${focusTime}. Provide a step-by-step micro-learning schedule that fits within the selected study time.`);
  };

  const handleRecommendedClick = (topic: string) => {
    onAddActivity(topic);
    onLaunchSession(`Explain the topic: "${topic}" in a clear, concise way for a student.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionTitle title="AI Student Dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Focus Time */}
        <Card className="p-6 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Today's Focus Time</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="relative mb-3">
            <select 
              value={focusTime}
              onChange={(e) => setFocusTime(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none outline-none focus:border-mint-300 text-gray-700"
            >
              {focusTimeOptions.map(min => (
                <option key={min} value={`${min} minutes`}>{min} minutes</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>
          
          <div className="relative">
             <input 
               type="text" 
               value={focusTopic}
               onChange={(e) => setFocusTopic(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleFocusSubmit()}
               placeholder="Enter a topic to focus on..."
               className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-mint-300 text-gray-700 placeholder-gray-400"
             />
             <button 
               onClick={handleFocusSubmit}
               className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-mint-400 hover:text-mint-600 transition-colors"
             >
               <Send size={18} />
             </button>
          </div>

          <p className="mt-4 text-gray-500 text-sm">A quick focused session to boost your productivity.</p>
        </Card>

        {/* Recommendations */}
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-gray-800">Recommended for You</h3>
              <Target className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { icon: '𝑓x', color: 'bg-yellow-100 text-yellow-700', title: 'Advanced Calculus', sub: 'Priority Topic' },
              { icon: '🧬', color: 'bg-green-100 text-green-700', title: 'Biology: Cell Structure', sub: 'Priority Topic' },
              { icon: '📜', color: 'bg-blue-100 text-blue-700', title: 'History: Post-War Era', sub: 'Priority Topic' },
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => handleRecommendedClick(item.title)}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-serif ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{item.title}</h4>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Learning */}
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Your Recent Learning</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((item, i) => (
              <div key={i} className="py-4 flex justify-between items-center animate-in fade-in slide-in-from-right-2">
                <span className="text-gray-700">{item.title}</span>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="py-4 text-center text-gray-400 text-sm">No recent activity yet.</div>
            )}
          </div>
        </Card>

        {/* Start Session CTA */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h3 className="font-semibold text-xl text-gray-800 mb-2">Start a Smart Session</h3>
          <p className="text-gray-500 text-sm mb-6">AI-tailored to your current needs.</p>
          <Button className="w-full" onClick={() => onNavigate(View.LUMA_LEARN)}>Start Learning</Button>
        </Card>
      </div>
    </div>
  );
};

// --- Smart Study View ---

interface SmartStudyProps {
  focusTopic: string;
  onLaunchSession: (prompt: string) => void;
}

export const SmartStudyView: React.FC<SmartStudyProps> = ({ focusTopic, onLaunchSession }) => {
  const [selectedTime, setSelectedTime] = useState('15m');
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [localTopic, setLocalTopic] = useState(focusTopic);
  const [selectedPlanStep, setSelectedPlanStep] = useState<number | null>(null);

  useEffect(() => {
    setLocalTopic(focusTopic);
  }, [focusTopic]);
  
  const timeOptions = ['15m', '30m', '45m', '60m', '90m', '120m', '150m', '180m'];
  const styleOptions = ['Step-by-step', 'Example way', 'Story way'];

  const planSteps = [
    { 
      id: 1, 
      title: "1. Quick Concept Recap 💡", 
      subtitle: "Review key formulas for calculus",
      icon: Lightbulb,
      defaultIconBg: "bg-yellow-50",
      defaultIconColor: "text-yellow-600"
    },
    { 
      id: 2, 
      title: "2. Focus on Weak Topic 🎯", 
      subtitle: "Deep dive into cellular respiration",
      icon: Target,
      defaultIconBg: "bg-mint-50",
      defaultIconColor: "text-mint-500"
    },
    { 
      id: 3, 
      title: "3. Short Practice Set ✏️", 
      subtitle: "Attempt 5 practice questions",
      icon: BookOpen,
      defaultIconBg: "bg-blue-50",
      defaultIconColor: "text-blue-500"
    }
  ];

  const handleStartSession = () => {
    // Validation: Ensure all fields are filled
    if (!selectedLearningStyle || !selectedTime || !localTopic.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);

    // AI Prompt Construction
    const prompt = `Create a focused study session for the topic: ${localTopic} based on a duration of ${selectedTime}.
Use the user's preferred learning style: ${selectedLearningStyle}.
${selectedPlanStep ? `Focus particularly on step ${selectedPlanStep} of the plan.` : ''}

Follow this fixed structure:

1. Quick Concept Recap 💡 — Review key formulas for calculus  
2. Focus on Weak Topic 🎯 — Deep dive into cellular respiration  
3. Short Practice Set ✏️ — Attempt 5 practice questions  

Make the explanation follow the selected learning style format exactly.`;
    
    onLaunchSession(prompt);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <SectionTitle title="Selected Focus Time" subtitle="Optimized for your available time." />
      
      <Card className="p-8">
        <div className="flex justify-center mb-12">
          <div className="bg-gray-50 p-1 rounded-2xl flex gap-1 shadow-inner overflow-x-auto max-w-full">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedTime === time 
                    ? 'bg-mint-300 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-10">
           <div className="flex flex-col items-center text-center w-full">
             <h3 className="text-xl font-bold text-gray-800 mb-6">
               Your Personalized Study Plan
             </h3>

             {/* Topic Input Box */}
             <div className="w-full max-w-md mb-8">
               <input
                 type="text"
                 value={localTopic}
                 onChange={(e) => setLocalTopic(e.target.value)}
                 placeholder="Enter the topic you want to focus on..."
                 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-mint-300 focus:ring-1 focus:ring-mint-300 text-gray-700 placeholder-gray-400 text-center transition-all"
               />
             </div>

             <div className="space-y-4 w-full">
                {planSteps.map((step) => {
                  const isSelected = selectedPlanStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setSelectedPlanStep(step.id)}
                      className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border-2 ${
                        isSelected 
                          ? 'bg-mint-300 border-mint-300 shadow-md scale-[1.02]' 
                          : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors ${
                         isSelected 
                           ? 'bg-white text-mint-500' 
                           : `${step.defaultIconBg} ${step.defaultIconColor}`
                      }`}>
                        <step.icon size={24} />
                      </div>
                      <div className="text-center">
                        <h4 className={`font-semibold text-lg transition-colors ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {step.title}
                        </h4>
                        <p className={`text-sm transition-colors ${isSelected ? 'text-mint-50' : 'text-gray-500'}`}>
                          {step.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
             </div>
           </div>

           {/* Learning Style Buttons - Selectable */}
           <div className="w-full border-t border-gray-100 pt-8 text-center">
               <h4 className="font-semibold text-gray-800 mb-4">Learning Style: Choose your preferred method</h4>
               <div className="flex flex-wrap justify-center gap-3">
                 {styleOptions.map(style => (
                    <button
                        key={style}
                        onClick={() => { 
                            setSelectedLearningStyle(style); 
                            setShowError(false); 
                        }}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                            selectedLearningStyle === style
                            ? 'bg-mint-300 text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                        {style}
                    </button>
                 ))}
               </div>
           </div>

           <div className="w-full flex flex-col items-center">
              {/* Validation Placeholder */}
              <p className={`text-sm transition-colors duration-300 mb-4 ${showError ? 'text-red-500 font-medium animate-pulse' : 'text-gray-400 opacity-60'}`}>
                 Please select a Topic, Focus Time, and Learning Style before starting.
              </p>

              <Button className="w-full py-4 text-lg" onClick={handleStartSession}>
                Start Session <ArrowRight className="w-5 h-5" />
              </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

// --- Practice View ---

interface PracticeViewProps {
  onLaunchSession: (prompt: string) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ onLaunchSession }) => {
  const [selectedPracticeTime, setSelectedPracticeTime] = useState('15-minute');
  const [selectedLearningMode, setSelectedLearningMode] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Mock checking user activity for dynamic text
  // In a real app, this would come from a database or context
  useEffect(() => {
    // Logic: Default to 15-minute as per requirements
    setSelectedPracticeTime('15-minute');
  }, []);

  const handleStartSession = () => {
    if (!selectedLearningMode || !selectedPracticeTime) {
      setShowError(true);
      return;
    }
    setShowError(false);
    
    const prompt = `Start a practice session for the topic: General Adaptive Review, using the duration: ${selectedPracticeTime} and learning mode: ${selectedLearningMode}. \nProvide explanation + guided practice + 3-5 interactive questions.`;
    onLaunchSession(prompt);
  };

  const handleCardClick = (title: string) => {
    onLaunchSession(`Explain and practice questions for: ${title}`);
  };

  const practiceItems = [
    { level: 'Hard', color: 'bg-red-100 text-red-600', title: 'Cellular Respiration Pathways', desc: 'Analyze the net ATP yield from one molecule of glucose...', icon: '⏱️ Based on recent mistakes' },
    { level: 'Medium', color: 'bg-yellow-100 text-yellow-600', title: 'Calculus: Derivatives of Trig Functions', desc: 'Find the derivative of f(x) = sin(x)cos(x)...', icon: '↻ Review needed' },
    { level: 'Easy', color: 'bg-green-100 text-green-600', title: 'Historical Context: The Renaissance', desc: 'Identify the key figures in the Italian Renaissance...', icon: '📈 Warm up' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <SectionTitle title="Adaptive Practice" subtitle="Questions tailored to your level and weak areas." />
        
        <Card className="p-6 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint-100 rounded-full text-mint-500">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Selected Focus Time</p>
                <h3 className="text-xl font-bold text-gray-800">{selectedPracticeTime} practice session</h3>
              </div>
            </div>
            <span className="px-3 py-1 bg-mint-100 text-mint-600 text-xs font-bold rounded-full">Optimized for you</span>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              Your Practice Set <span className="text-xs font-normal text-mint-500 bg-mint-50 px-2 py-0.5 rounded">AI Generated</span>
            </h3>
          </div>

          {practiceItems.map((item, i) => (
            <Card 
              key={i} 
              className="p-5 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div onClick={() => handleCardClick(item.title)}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.color}`}>{item.level}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">{item.icon}</span>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-mint-400 transition-colors" size={20} />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                <p className="text-gray-500 text-sm line-clamp-1">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 lg:mt-20">
        <Card className="p-6 bg-pastel-blue/30 border-blue-100">
          <div className="flex gap-4">
             <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm h-fit">
               <Lightbulb size={20} />
             </div>
             <div>
               <h4 className="font-bold text-blue-900">Smart Hints</h4>
               <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">Hints and explanations adapt as you practice to match your understanding.</p>
             </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-semibold text-gray-800">Learning Mode</h4>
          </div>
          <div className="space-y-2">
            {['Step-by-step', 'Example way', 'Story way'].map(mode => (
              <button
                key={mode}
                onClick={() => { setSelectedLearningMode(mode); setShowError(false); }}
                className={`w-full p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-3 ${
                  selectedLearningMode === mode 
                    ? 'bg-mint-300 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                   selectedLearningMode === mode ? 'border-white' : 'border-gray-400'
                 }`}>
                    {selectedLearningMode === mode && <div className="w-2 h-2 bg-white rounded-full" />}
                 </div>
                 {mode}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-8 text-center flex flex-col items-center gap-4">
           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-mint-500 mb-2">
             <PlayCircle size={32} />
           </div>
           <div>
             <h3 className="font-bold text-gray-800 text-lg">Ready to start?</h3>
             <p className="text-gray-500 text-sm">Take a deep breath. You've got this!</p>
           </div>
           
           {showError && (
             <p className="text-red-500 text-xs animate-pulse">Please select a learning mode first.</p>
           )}

           <Button className="w-full" onClick={handleStartSession}>
             Start Practice Session <ArrowRight size={18} />
           </Button>
        </Card>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3">
           <div className="text-yellow-600 mt-0.5"><Lightbulb size={16} /></div>
           <p className="text-xs text-yellow-800 leading-relaxed">
             <span className="font-semibold">Tip:</span> Consistent short sessions are more effective than long cramming sessions.
           </p>
        </div>
      </div>
    </div>
  );
};

// --- Progress View ---

interface ProgressViewProps {
  onNavigate: (view: View) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigate }) => {
  const data = [
    { name: 'Mon', score: 60 },
    { name: 'Tue', score: 75 },
    { name: 'Wed', score: 40 },
    { name: 'Thu', score: 85 },
    { name: 'Fri', score: 65 },
    { name: 'Sat', score: 30 },
    { name: 'Sun', score: 90 },
  ];

  const trendData = [
    { name: 'Mon', v: 1 },
    { name: 'Tue', v: 2 },
    { name: 'Wed', v: 1 },
    { name: 'Thu', v: 3 },
    { name: 'Fri', v: 4 },
    { name: 'Sat', v: 5 },
    { name: 'Sun', v: 6 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <div className="space-y-6">
        <SectionTitle title="Learning Consistency" subtitle='"Consistency is what transforms average into excellence."' />
        
        <Card className="p-6 bg-gray-50 border-none">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-2xl shadow-sm">
              🔥
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">Study streak: 4 days</h3>
              <p className="text-gray-500 text-sm">Keep it up to earn a badge!</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 bg-mint-50/50 border-mint-100">
             <div className="flex items-start gap-3 mb-4">
               <div className="p-2 bg-white rounded-lg text-mint-500 shadow-sm"><Calendar size={20} /></div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-800">8</h2>
                 <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Sessions This Week</p>
               </div>
             </div>
             <div className="space-y-1 pt-2 border-t border-mint-200/50">
               <div className="flex justify-between text-xs text-gray-600">
                 <span>Total Time</span>
                 <span className="font-semibold">120m</span>
               </div>
               <div className="flex justify-between text-xs text-gray-600">
                 <span>Best Day</span>
                 <span className="font-semibold">Thu</span>
               </div>
               <div className="flex justify-between text-xs text-gray-600">
                 <span>Daily Avg</span>
                 <span className="font-semibold">17m</span>
               </div>
             </div>
          </Card>
          <Card className="p-6 bg-blue-50/50 border-blue-100 overflow-hidden relative">
             <div className="flex items-start gap-3 mb-2 relative z-10">
               <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm"><TrendingUp size={20} /></div>
               <div>
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1">Growing 🌱</h2>
                 <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">You're building a habit</p>
               </div>
             </div>
             <div className="h-24 w-full mt-2 -mb-2">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={trendData}>
                    <Bar dataKey="v" fill="#bfdbfe" radius={[2,2,0,0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </Card>
        </div>

        <div className="h-64 mt-8">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data}>
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
               <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
               <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#A9CEA2' : '#E5E7EB'} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-xl text-gray-800">What's Improving</h3>
        </div>

        <Card className="p-6 space-y-6">
           {[
             { title: 'Faster problem-solving', sub: 'Solving questions 15% faster on average.', icon: <Zap size={20} />, color: 'bg-yellow-100 text-yellow-600' },
             { title: 'Better accuracy in weak topics', sub: 'Calculus accuracy up by 20%.', icon: <Target size={20} />, color: 'bg-mint-100 text-mint-600' },
             { title: 'Improved focus', sub: 'Maintained focus in short sessions.', icon: <Clock size={20} />, color: 'bg-blue-100 text-blue-600' },
           ].map((item, i) => (
             <div key={i} className="flex gap-4">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                 {item.icon}
               </div>
               <div>
                 <h4 className="font-semibold text-gray-800">{item.title}</h4>
                 <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
               </div>
             </div>
           ))}
           <div className="pt-4 mt-2">
             <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex items-center gap-2">
               Insight: You learn best in the morning ☀️
             </div>
           </div>
        </Card>

        <div className="mt-8">
          <h3 className="font-semibold text-xl text-gray-800 mb-4">Recent Progress</h3>
          <div className="grid grid-cols-3 gap-4">
             {[
               { day: 'Yesterday', title: 'Practice accuracy improved', bg: 'bg-gray-50' },
               { day: '2 days ago', title: 'Weak topic revised', bg: 'bg-gray-50' },
               { day: '3 days ago', title: 'Short session completed', bg: 'bg-gray-50' }
             ].map((item, i) => (
               <div key={i} className={`${item.bg} p-4 rounded-2xl`}>
                 <p className="text-[10px] text-gray-400 mb-1">{item.day}</p>
                 <p className="text-sm font-semibold text-gray-800 leading-snug">{item.title}</p>
               </div>
             ))}
          </div>
        </div>

        <Button 
          className="w-full py-4 text-lg mt-4" 
          onClick={() => onNavigate(View.DASHBOARD)}
        >
          Continue Learning
        </Button>
      </div>
    </div>
  );
};

// --- Preferences View ---

export const PreferencesView: React.FC = () => {
  const [focusTime, setFocusTime] = useState(15);
  const [autoAdjust, setAutoAdjust] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-8">
        <SectionTitle title="Learning Preferences" />

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Preferred Explanation Style</h4>
            <div className="bg-gray-50 p-1 rounded-2xl flex">
              <button className="flex-1 py-3 bg-mint-300 text-white rounded-xl shadow-sm font-medium text-sm">Step-by-step</button>
              <button className="flex-1 py-3 text-gray-600 font-medium text-sm hover:text-gray-900">Examples</button>
              <button className="flex-1 py-3 text-gray-600 font-medium text-sm hover:text-gray-900">Summaries</button>
            </div>
            <p className="mt-2 text-xs text-gray-400">We'll break down complex topics into bite-sized pieces.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Comfortable Difficulty Level</h4>
            <div className="bg-gray-50 p-1 rounded-2xl flex border border-gray-200">
               <button className="flex-1 py-3 text-gray-600 font-medium text-sm">Easy</button>
               <div className="w-[1px] bg-gray-200 my-2"></div>
               <button className="flex-1 py-3 text-mint-600 font-bold text-sm bg-white shadow-sm rounded-xl m-1">Balanced</button>
               <div className="w-[1px] bg-gray-200 my-2"></div>
               <button className="flex-1 py-3 text-gray-600 font-medium text-sm">Challenging</button>
            </div>
            <p className="mt-2 text-xs text-gray-400">Optimized for a steady learning curve without burnout.</p>
          </div>
          
          <div className="pt-20">
             <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="text-mint-500">✨</span> AI will adapt future content based on these choices.
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-8 h-fit">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-semibold text-xl text-gray-800">Time & Focus Settings</h3>
             <MoreHorizontal className="text-gray-400" />
           </div>

           <div className="mb-8">
              <label className="block text-sm font-medium text-gray-600 mb-4">Default Daily Focus Time</label>
              <div className="flex gap-3">
                 {[5, 10, 15, 30].map(t => (
                   <button 
                    key={t}
                    onClick={() => setFocusTime(t)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all ${
                      focusTime === t ? 'bg-mint-300 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                   >
                     {t}
                   </button>
                 ))}
                 <span className="self-center text-gray-400 text-sm ml-2">min</span>
              </div>
           </div>

           <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
             <div>
               <h4 className="font-semibold text-gray-800 text-sm">Auto-adjust session length</h4>
               <p className="text-xs text-gray-400 mt-0.5">Based on availability</p>
             </div>
             <div 
               className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${autoAdjust ? 'bg-mint-300' : 'bg-gray-300'}`}
               onClick={() => setAutoAdjust(!autoAdjust)}
             >
               <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoAdjust ? 'translate-x-5' : 'translate-x-0'}`} />
             </div>
           </div>
        </Card>

        <Card className="p-8">
           <h3 className="font-semibold text-lg text-gray-800 mb-4">Personalization Summary</h3>
           <div className="flex gap-4 items-start">
             <div className="p-2 bg-mint-50 rounded-full text-mint-500 mt-1">
               <Settings size={18} />
             </div>
             <p className="text-sm text-gray-600 leading-relaxed">
               Your learning sessions will be adapted based on your <strong className="text-mint-600">15 min</strong> focus time, focus on weak areas, and <strong className="text-mint-600">step-by-step</strong> explanation style.
             </p>
           </div>
        </Card>

        <Button className="w-full text-lg">Save Preferences</Button>
      </div>
    </div>
  );
};

// --- Profile View ---

interface ProfileViewProps {
  onLogout: () => void;
}

type ModalType = 'NONE' | 'REGION' | 'EMAIL' | 'PASSWORD' | 'DELETE' | 'NAME' | 'EDUCATION' | 'SUBJECTS';

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  const [region, setRegion] = useState('English (US)');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // Temp states for modals
  const [tempName, setTempName] = useState('');
  const [tempEducationLevel, setTempEducationLevel] = useState('');
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [tempSubjectInput, setTempSubjectInput] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Email verification state
  const [verificationSent, setVerificationSent] = useState(false);

  // Loading state for initial data fetch
  const [dataLoaded, setDataLoaded] = useState(false);

  const currentUser = auth.currentUser;

  // Initialize data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        // Set basic auth data first
        setEmail(currentUser.email || '');
        setNewEmail(currentUser.email || '');
        // Optimistic default from Auth profile, will be overwritten by DB if exists
        setDisplayName(currentUser.displayName || '');
        
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.region) setRegion(data.region);
            
            const profile = data.profile || {};
            if (profile.displayName) setDisplayName(profile.displayName);
            
            // Nested profile structure for learning context
            if (profile.learningContext) {
               setEducationLevel(profile.learningContext.educationLevel || '');
               setSubjects(profile.learningContext.primarySubjects || []);
            } else if (data.learningContext) {
               // Fallback to legacy path if present
               setEducationLevel(data.learningContext.educationLevel || '');
               setSubjects(data.learningContext.subjects || []);
            }
            
            // Nested profile structure for study goals
            if (profile.studyGoals && Array.isArray(profile.studyGoals.goals)) {
               setSelectedGoals(profile.studyGoals.goals);
            } else if (data.preferences?.studyGoals) {
                // Fallback map legacy preferences object to array if needed, or leave blank if mismatch
                // Current requirement is specific path: users/{uid}/profile/studyGoals
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        } finally {
          setDataLoaded(true);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  // Handlers

  const handleUpdateRegion = async (r: string) => {
    setRegion(r); // Optimistic UI update
    setActiveModal('NONE');
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await setDoc(userRef, { region: r }, { merge: true });
      } catch (err) {
        console.error("Failed to save region", err);
      }
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail.includes('@')) {
      setError("Invalid email address.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (currentUser && newEmail !== email) {
        await verifyBeforeUpdateEmail(currentUser, newEmail);
        setVerificationSent(true);
      } else {
        setActiveModal('NONE');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError("For security, please log out and log in again to update your email.");
      } else if (err.code === 'auth/operation-not-allowed') {
         setError("Email updates are currently disabled.");
      } else {
        setError(err.message || "Failed to send verification email.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleGoal = async (goalText: string) => {
    let newGoals = [...selectedGoals];
    if (newGoals.includes(goalText)) {
      newGoals = newGoals.filter(g => g !== goalText);
    } else {
      newGoals.push(goalText);
    }
    
    setSelectedGoals(newGoals); // Optimistic update
    
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await setDoc(userRef, {
           profile: { studyGoals: { goals: newGoals } }
        }, { merge: true });
      } catch (err) {
        console.error("Error saving goal:", err);
      }
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { passwordLastChanged: new Date().toISOString() }, { merge: true });
        
        setActiveModal('NONE');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Current password is incorrect.");
      } else {
        setError(err.message || "Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentUser) {
        // Delete data first (best effort)
        const userRef = doc(db, 'users', currentUser.uid);
        await deleteDoc(userRef);
        // Delete auth
        await deleteUser(currentUser);
        onLogout(); 
      }
    } catch (err: any) {
      console.error(err);
      setLoading(false); // Ensure loading stops on error
      if (err.code === 'auth/requires-recent-login') {
        setError("Please log in again to confirm account deletion.");
      } else {
        setError("Failed to delete account. Try again.");
      }
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    
    setLoading(true);
    
    try {
      if (currentUser) {
        // Update Auth Profile
        await updateProfile(currentUser, { displayName: tempName });
        // Update Firestore Document
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { profile: { displayName: tempName } }, { merge: true });
        
        setDisplayName(tempName);
        setActiveModal('NONE');
      }
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to save name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEducation = async () => {
    const level = tempEducationLevel || 'Undergraduate University Student';
    
    setLoading(true);
    setEducationLevel(level); // Optimistic Update
    
    try {
      if (currentUser) {
         const userRef = doc(db, 'users', currentUser.uid);
         await setDoc(userRef, { profile: { learningContext: { educationLevel: level } } }, { merge: true });
         setActiveModal('NONE');
      }
    } catch (err) {
        console.error("Background save failed:", err);
        setError("Failed to save. Try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleSaveSubjects = async () => {
    const subs = tempSubjects || [];
    
    setLoading(true);
    setSubjects(subs); // Optimistic Update
    
    try {
      if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, { profile: { learningContext: { primarySubjects: subs } } }, { merge: true });
          setActiveModal('NONE');
      }
    } catch (err) {
        console.error("Background save failed:", err);
        setError("Failed to save. Try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (tempSubjectInput.trim() && !tempSubjects.includes(tempSubjectInput.trim())) {
      setTempSubjects([...tempSubjects, tempSubjectInput.trim()]);
      setTempSubjectInput('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setTempSubjects(tempSubjects.filter(s => s !== subject));
  };

  const closeModal = () => {
    setActiveModal('NONE');
    setError(null);
    setLoading(false);
    setVerificationSent(false); // Reset verification state
    // Reset inputs on close
    setNewEmail(email);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTempName('');
    setTempEducationLevel('');
    setTempSubjects([]);
    setTempSubjectInput('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionTitle title="Profile & Settings" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <img src="https://picsum.photos/100/100" alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {dataLoaded ? (displayName || (email ? email.split('@')[0] : 'Student')) : 'Loading...'}
            </h2>
            <button 
              onClick={() => { setTempName(displayName); setActiveModal('NAME'); }}
              className="text-gray-400 hover:text-mint-500 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <p className="text-gray-500 text-sm">University Student</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Learning Context</h3>
                    <BookOpen className="text-gray-400" size={18} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wide mb-1">
                        <span>Education Level</span>
                        <button 
                          onClick={() => { setTempEducationLevel(educationLevel || 'Undergraduate University Student'); setActiveModal('EDUCATION'); }}
                          className="text-mint-500 text-xs font-semibold hover:text-mint-600 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl text-gray-700 text-sm font-medium">
                        {dataLoaded ? (educationLevel || "Not set") : "Loading..."}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wide mb-2">
                        <span>Primary Subjects</span>
                        <button 
                          onClick={() => { setTempSubjects(subjects || []); setActiveModal('SUBJECTS'); }}
                          className="text-mint-500 text-xs font-semibold hover:text-mint-600 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {!dataLoaded ? (
                          <span className="text-sm text-gray-400">Loading...</span>
                        ) : subjects.length > 0 ? (
                            subjects.map((subj, i) => (
                              <Badge 
                                key={i} 
                                text={subj} 
                                color={i % 3 === 0 ? "bg-purple-100 text-purple-600" : i % 3 === 1 ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"} 
                              />
                            ))
                        ) : (
                          <span className="text-sm text-gray-400">No subjects selected</span>
                        )}
                      </div>
                    </div>
                  </div>
              </Card>

              <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Study Goals</h3>
                    <Target className="text-gray-400" size={18} />
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Select goals to help our AI tailor your daily lesson plans.</p>
                  <div className="space-y-3">
                    {[
                      'Improve understanding',
                      'Stay consistent',
                      'Learn in short sessions'
                    ].map((goalText, i) => {
                      const isSelected = selectedGoals.includes(goalText);
                      return (
                        <div 
                          key={i} 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => handleToggleGoal(goalText)}
                        >
                          <div className={`transition-colors ${isSelected ? 'text-mint-400' : 'text-gray-300 group-hover:text-gray-400'}`}>
                            {isSelected 
                              ? <CheckCircle size={20} /> 
                              : <Circle size={20} />
                            }
                          </div>
                          <span className={`text-sm transition-colors ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                            {goalText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
              </Card>
            </div>

            <Card className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Language & Region</h3>
                  <p className="text-gray-500 text-sm mt-1">Current setting: <span className="text-gray-800 font-medium">{region}</span></p>
                </div>
                <button 
                  onClick={() => setActiveModal('REGION')}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Change Region
                </button>
            </Card>

            {/* Account Section Content */}
            <Card className="p-8">
              <h3 className="font-bold text-gray-800 mb-6">Account Information</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Email Address</p>
                      <p className="text-gray-800 font-medium">{email}</p>
                    </div>
                    <button 
                      onClick={() => setActiveModal('EMAIL')}
                      className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold"
                    >
                      Edit
                    </button>
                </div>
              </div>
            </Card>

            <Card className="p-8">
                <h3 className="font-bold text-gray-800 mb-4">Security Settings</h3>
                <div className="divide-y divide-gray-100">
                  <div 
                    onClick={() => setActiveModal('PASSWORD')}
                    className="py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 rounded-lg -mx-2"
                  >
                    <span className="text-gray-700 font-medium">Change password</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
                  <Shield size={14} /> Account security is up to date
                </div>
            </Card>

            <Card className="p-8">
                <h3 className="font-bold text-gray-800 mb-2">Account Actions</h3>
                <p className="text-gray-500 text-sm mb-6">Need to take a break? You can log out of your session.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={onLogout}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                  <button 
                    onClick={() => setActiveModal('DELETE')}
                    className="px-6 py-2.5 bg-yellow-100 text-yellow-800 rounded-xl font-medium flex items-center gap-2 hover:bg-yellow-200 transition-colors"
                  >
                    Delete account
                  </button>
                </div>
            </Card>
      </div>

      {/* --- Modals --- */}
      
      {/* Name Modal */}
      <Modal isOpen={activeModal === 'NAME'} onClose={closeModal} title="Edit Name">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 focus:ring-1 focus:ring-mint-300 outline-none transition-all text-gray-700 placeholder-gray-400"
              placeholder="Enter your name"
            />
          </div>
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1" disabled={loading}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveName} className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Education Modal */}
      <Modal isOpen={activeModal === 'EDUCATION'} onClose={closeModal} title="Education Level">
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Select Level</label>
             <select 
               value={tempEducationLevel} 
               onChange={(e) => setTempEducationLevel(e.target.value)}
               className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 focus:ring-1 focus:ring-mint-300 outline-none text-gray-700 appearance-none bg-white"
             >
                <option value="High School">High School</option>
                <option value="Undergraduate University Student">Undergraduate University Student</option>
                <option value="Graduate Student">Graduate Student</option>
                <option value="Self-Learner">Self-Learner</option>
             </select>
          </div>
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1" disabled={loading}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEducation} className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subjects Modal */}
      <Modal isOpen={activeModal === 'SUBJECTS'} onClose={closeModal} title="Primary Subjects">
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Add Subject</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={tempSubjectInput}
                 onChange={(e) => setTempSubjectInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                 className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 focus:ring-1 focus:ring-mint-300 outline-none transition-all text-gray-700 placeholder-gray-400"
                 placeholder="E.g., Psychology"
               />
               <button 
                 onClick={handleAddSubject}
                 className="px-4 py-2 bg-mint-300 text-white rounded-xl hover:bg-mint-400 transition-colors"
               >
                 <Plus size={20} />
               </button>
             </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
             {tempSubjects.length === 0 ? (
               <p className="text-sm text-gray-400 text-center mt-6">No subjects added yet.</p>
             ) : (
               <div className="flex gap-2 flex-wrap">
                 {tempSubjects.map((subj, i) => (
                    <Badge 
                      key={i} 
                      text={subj} 
                      color="bg-white border border-gray-200 text-gray-700" 
                      onDelete={() => handleRemoveSubject(subj)}
                    />
                 ))}
               </div>
             )}
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1" disabled={loading}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSubjects} className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Region Modal */}
      <Modal isOpen={activeModal === 'REGION'} onClose={closeModal} title="Select Region">
        <div className="space-y-3">
          {['English (US)', 'English (India)'].map((r) => (
             <button
                key={r}
                onClick={() => handleUpdateRegion(r)}
                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                  region === r 
                    ? 'border-mint-300 bg-mint-50 text-mint-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-white'
                }`}
             >
               <span className="font-medium">{r}</span>
               {region === r && <CheckCircle size={18} className="text-mint-500" />}
             </button>
          ))}
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={activeModal === 'EMAIL'} onClose={closeModal} title="Update Email Address">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">New Email Address</label>
            <input 
              type="email" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={verificationSent}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 focus:ring-1 focus:ring-mint-300 outline-none transition-all text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:bg-gray-100"
              placeholder="Enter new email"
            />
            <p className="text-[11px] text-gray-400 mt-2 ml-1">
               You’ll need to verify this email before it becomes active.
            </p>
          </div>

          {verificationSent ? (
               <div className="p-4 bg-mint-50 rounded-xl border border-mint-100 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="mt-0.5 text-mint-500"><Check size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-mint-800">Verification Link Sent</p>
                    <p className="text-xs text-mint-600 mt-1 leading-relaxed">
                      We’ve sent a verification link to <strong>{newEmail}</strong>. Please verify it to complete the update.
                    </p>
                  </div>
               </div>
          ) : error && (
               <p className="text-red-500 text-xs px-1">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1">
               {verificationSent ? "Close" : "Cancel"}
            </Button>
            <Button 
               variant="primary" 
               onClick={verificationSent ? undefined : handleSaveEmail} 
               className="flex-1" 
               disabled={loading || verificationSent}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : verificationSent ? (
                  <>Verification Sent <Check size={16} /></>
              ) : 'Save Changes'}
            </Button>
          </div>

          {verificationSent && (
               <div className="text-center pt-2">
                  <button 
                    onClick={handleSaveEmail}
                    disabled={loading}
                    className="text-xs text-gray-400 hover:text-mint-500 font-medium transition-colors disabled:opacity-50"
                  >
                     Resend verification email
                  </button>
               </div>
          )}
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={activeModal === 'PASSWORD'} onClose={closeModal} title="Change Password">
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Current Password</label>
             <input 
               type="password" 
               value={currentPassword}
               onChange={(e) => setCurrentPassword(e.target.value)}
               className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 outline-none" 
             />
          </div>
          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
             <input 
               type="password" 
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 outline-none" 
             />
          </div>
          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Confirm Password</label>
             <input 
               type="password" 
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-mint-300 outline-none" 
             />
          </div>
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <div className="flex gap-3 pt-2">
             <Button variant="outline" onClick={closeModal} className="flex-1" disabled={loading}>Cancel</Button>
             <Button variant="primary" onClick={handleChangePassword} className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
             </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={activeModal === 'DELETE'} onClose={closeModal} title="Delete Account">
         <div className="text-center space-y-4 mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
               <AlertTriangle size={32} />
            </div>
            <p className="text-gray-600">Are you sure you want to permanently delete your account? This action cannot be undone.</p>
            {error && <p className="text-red-500 text-xs px-1">{error}</p>}
         </div>
         <div className="flex gap-3">
            <Button variant="outline" onClick={closeModal} className="flex-1" disabled={loading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} className="flex-1" disabled={loading}>
               {loading ? <Loader2 className="animate-spin" size={18} /> : 'Delete Permanently'}
            </Button>
         </div>
      </Modal>

    </div>
  );
};

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface LumaLearnProps {
  initialPrompt: string;
  onClearPrompt: () => void;
  onAddActivity: (topic: string) => void;
}

export const LumaLearnView: React.FC<LumaLearnProps> = ({ initialPrompt, onClearPrompt, onAddActivity }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
        try {
            let systemInstruction = "You are Luma, an intelligent, encouraging, and helpful AI tutor for students. Your goal is to help students learn complex topics by breaking them down into simple, understandable chunks. You should adapt to the student's learning style. Be concise but thorough.";

            if (auth.currentUser) {
              try {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  // Check new profile path first
                  let goals = data.profile?.studyGoals;
                  // If array (new format)
                  if (goals && Array.isArray(goals.goals)) {
                     const goalList = goals.goals;
                     if (goalList.length > 0) {
                        systemInstruction += "\n\nAdapt your teaching style based on these goals:";
                        if (goalList.includes('Improve understanding')) systemInstruction += "\n- Provide deeper explanations, step-by-step guidance.";
                        if (goalList.includes('Stay consistent')) systemInstruction += "\n- Be encouraging, motivate daily consistency.";
                        if (goalList.includes('Learn in short sessions')) systemInstruction += "\n- Give brief, to-the-point answers.";
                     }
                  } else {
                     // Check legacy format
                     goals = data.preferences?.studyGoals;
                     if (goals) {
                        if (goals.improveUnderstanding) systemInstruction += "\n- Provide deeper explanations.";
                        if (goals.stayConsistent) systemInstruction += "\n- Be encouraging.";
                        if (goals.shortSessions) systemInstruction += "\n- Give brief answers.";
                     }
                  }
                }
              } catch (e) {
                console.error("Error fetching user prefs for chat", e);
              }
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            if (initialPrompt) {
                await handleSendMessage(initialPrompt);
                onClearPrompt(); 
            } else if (messages.length === 0) {
                 setMessages([{
                     id: 'welcome',
                     role: 'model',
                     text: "Hi! I'm Luma. I'm here to help you study, practice, or learn something new. What's on your mind today?",
                     timestamp: new Date()
                 }]);
            }
        } catch (e) {
            console.error("Failed to initialize chat", e);
        }
    };

    initChat();
  }, [initialPrompt]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    if (text.length > 10) {
        onAddActivity(text.substring(0, 30));
    }

    try {
        const result = await chatSessionRef.current.sendMessageStream({ message: text });
        
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: botMsgId,
            role: 'model',
            text: "",
            timestamp: new Date()
        }]);

        let fullResponse = "";
        for await (const chunk of result) {
            const chunkText = (chunk as GenerateContentResponse).text;
            if (chunkText) {
                fullResponse += chunkText;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId ? { ...msg, text: fullResponse } : msg
                ));
            }
        }

    } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "I'm having trouble connecting right now. Please check your internet or try again later.",
            timestamp: new Date()
        }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in duration-500">
        <SectionTitle title="Luma AI Tutor" subtitle="Chat with your personal learning assistant." />
        
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-mint-100/50">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-gray-50/50">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[80%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-mint-300 text-white rounded-tr-sm' 
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}
                        `}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <span className={`text-[10px] mt-2 block opacity-70 ${msg.role === 'user' ? 'text-mint-50' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative flex items-center gap-2">
                    <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
                        <Plus size={20} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                        placeholder="Ask away… I don’t judge 👀"
                        className="flex-1 p-3.5 bg-gray-50 border-transparent focus:bg-white focus:border-mint-300 border rounded-xl outline-none transition-all text-gray-700 placeholder-gray-400"
                    />
                    <button 
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || isTyping}
                        className="p-3.5 bg-mint-300 hover:bg-mint-400 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors shadow-sm shadow-mint-200"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3 font-medium opacity-80 flex items-center justify-center gap-1">
                  Your brain + me = power combo ⚡️
                </p>
            </div>
        </Card>
    </div>
  );
};
