import React, { useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderGit2, 
  BookOpen, 
  CalendarDays, 
  Timer, 
  BarChart3, 
  LogOut, 
  CloudCheck, 
  CloudOff, 
  CloudLightning,
  User,
  Sun,
  Moon,
  Bell,
  GraduationCap
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isOffline, isSyncing, setSession, signOut, examDate, theme, toggleTheme } = useAppStore();

  // Apply theme class to HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => subscription.unsubscribe();
    }
  }, [setSession]);

  const getDaysRemaining = () => {
    if (!examDate) return 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    if (isNaN(exam.getTime())) return 14;
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  const isDark = theme === 'dark';

  // Navigation groupée par sections (UUPM: clear hierarchy)
  const navSections = [
    {
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: 'RÉVISION',
      items: [
        { path: '/subjects', label: 'Matières', icon: FolderGit2 },
        { path: '/chapters', label: 'Chapitres', icon: BookOpen },
        { path: '/planner', label: 'Planning', icon: CalendarDays },
      ]
    },
    {
      label: 'OUTILS',
      items: [
        { path: '/focus', label: 'Focus', icon: Timer },
        { path: '/stats', label: 'Statistiques', icon: BarChart3 },
      ]
    },
  ];

  const allMenuItems = navSections.flatMap(s => s.items);

  // Shared styles
  const navItemBase = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200`;
  const navItemActive = isDark
    ? 'bg-indigo-500/12 text-indigo-400 font-semibold'
    : 'bg-indigo-50 text-indigo-600 font-semibold';
  const navItemInactive = isDark
    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-250 ${
      isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-[#F8F9FC] text-slate-800'
    }`}>
      
      {/* ===== SIDEBAR DESKTOP ===== */}
      <aside className={`hidden md:flex flex-col w-[256px] shrink-0 border-r transition-colors duration-250 ${
        isDark ? 'bg-[#0c0c0e] border-zinc-800/50' : 'bg-white border-slate-200/80'
      }`}>
        
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <span className={`text-[16px] font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                ExamFlow
              </span>
              <p className={`text-[10px] font-medium tracking-wider uppercase ${
                isDark ? 'text-zinc-600' : 'text-slate-400'
              }`}>
                Planificateur
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {section.label && (
                <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] px-3 mb-1.5 ${
                  isDark ? 'text-zinc-600' : 'text-slate-400'
                }`}>
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className={`px-3 pb-4 pt-3 space-y-0.5 border-t transition-colors ${
          isDark ? 'border-zinc-800/50' : 'border-slate-200/80'
        }`}>
          <button
            onClick={toggleTheme}
            className={`${navItemBase} w-full ${navItemInactive}`}
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {isDark ? 'Mode Clair' : 'Mode Sombre'}
          </button>

          {user ? (
            <button
              onClick={() => { signOut(); navigate('/auth'); }}
              className={`${navItemBase} w-full ${isDark ? 'text-zinc-400 hover:text-rose-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-50'}`}
            >
              <LogOut className="w-[18px] h-[18px]" />
              Déconnexion
            </button>
          ) : (
            <Link
              to="/auth"
              className={`${navItemBase} ${navItemInactive}`}
            >
              <User className="w-[18px] h-[18px]" />
              Se connecter
            </Link>
          )}
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* Top Header */}
        <header className={`flex items-center justify-between px-5 md:px-8 h-[60px] shrink-0 border-b transition-colors duration-250 ${
          isDark ? 'bg-[#0c0c0e]/80 border-zinc-800/50 backdrop-blur-xl' : 'bg-white/80 border-slate-200/80 backdrop-blur-xl'
        }`}>
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>ExamFlow</span>
            </div>
            <p className={`hidden md:block text-[14px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Bonjour 👋 — <span className="font-medium" style={{ color: isDark ? '#e4e4e7' : '#334155' }}>voici l'avancement de tes révisions</span>
            </p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            {/* Days badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              daysRemaining <= 3
                ? 'bg-red-500/10 text-red-500'
                : daysRemaining <= 7
                ? 'bg-amber-500/10 text-amber-500'
                : isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <CalendarDays className="w-3.5 h-3.5" />
              J-{daysRemaining}
            </div>

            {/* Cloud */}
            <button className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'
            }`}>
              {isSyncing ? (
                <CloudLightning className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : isOffline ? (
                <CloudOff className={`w-4 h-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
              ) : (
                <CloudCheck className="w-4 h-4 text-emerald-500" />
              )}
            </button>

            {/* Theme (mobile) */}
            <button
              onClick={toggleTheme}
              className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
                isDark ? 'hover:bg-white/[0.04] text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification */}
            <button className={`p-2 rounded-lg transition-colors duration-200 relative ${
              isDark ? 'hover:bg-white/[0.04] text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
            }`}>
              <Bell className="w-4 h-4" />
              {daysRemaining <= 3 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900"></span>
              )}
            </button>

            {/* Avatar */}
            {user ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ml-1 ${
                isDark ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20' : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'
              }`}>
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <Link to="/auth" className={`w-8 h-8 rounded-full flex items-center justify-center ml-1 ${
                isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-slate-100 text-slate-400'
              }`}>
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-2 py-1.5 flex justify-around items-center z-50 transition-colors duration-250 ${
        isDark ? 'bg-[#0c0c0e]/90 border-zinc-800/50' : 'bg-white/90 border-slate-200/80'
      }`}>
        {allMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-xl transition-colors duration-200 ${
                isActive
                  ? 'text-indigo-500'
                  : isDark ? 'text-zinc-500' : 'text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-count-up' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
