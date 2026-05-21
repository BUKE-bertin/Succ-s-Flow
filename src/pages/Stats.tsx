import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BarChart3, PieChart as PieIcon, History, Trash2, Clock, CheckCircle2, LayoutGrid, Timer } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'react-hot-toast';

export const Stats: React.FC = () => {
  const { subjects, chapters, studySessions, deleteStudySession, theme } = useAppStore();
  const isDark = theme === 'dark';

  // 1. Calculations for top row
  const totalStudyMinutes = useMemo(() => {
    return studySessions.reduce((acc, s) => acc + s.duration, 0);
  }, [studySessions]);

  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const completedChaptersCount = useMemo(() => {
    return chapters.filter(c => c.completed).length;
  }, [chapters]);

  const totalChaptersCount = chapters.length;
  const globalProgress = totalChaptersCount > 0 
    ? Math.round((completedChaptersCount / totalChaptersCount) * 100) 
    : 0;

  const averageSessionLength = useMemo(() => {
    if (studySessions.length === 0) return 0;
    return Math.round(totalStudyMinutes / studySessions.length);
  }, [studySessions, totalStudyMinutes]);

  // 2. Chart 1: Time distribution per subject (Pie Chart)
  const pieChartData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    
    subjects.forEach(sub => {
      // Find study sessions linked directly to this subject, or indirectly via chapter
      const subSessions = studySessions.filter(s => {
        if (s.subject_id === sub.id) return true;
        if (s.chapter_id) {
          const chap = chapters.find(c => c.id === s.chapter_id);
          return chap?.subject_id === sub.id;
        }
        return false;
      });

      const totalMinutes = subSessions.reduce((acc, s) => acc + s.duration, 0);
      
      if (totalMinutes > 0) {
        data.push({
          name: sub.name,
          value: totalMinutes,
          color: sub.color
        });
      }
    });

    return data;
  }, [subjects, studySessions, chapters]);

  // 3. Chart 2: Chapter Completion per Subject (Bar Chart)
  const barChartData = useMemo(() => {
    return subjects.map(sub => {
      const subChapters = chapters.filter(c => c.subject_id === sub.id);
      const completed = subChapters.filter(c => c.completed).length;
      const total = subChapters.length;
      return {
        name: sub.name,
        "Complétés": completed,
        "Total": total,
        color: sub.color
      };
    });
  }, [subjects, chapters]);

  // 4. Log of recent sessions
  const recentSessionsList = useMemo(() => {
    return [...studySessions].sort((a, b) => {
      const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    }).slice(0, 10); // last 10
  }, [studySessions]);

  const handleDeleteSession = async (id: string) => {
    if (window.confirm("Voulez-vous supprimer cette session d'étude des statistiques ?")) {
      await deleteStudySession(id);
      toast.success("Session d'étude supprimée.");
    }
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold drop-shadow-md">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] block ${
    isDark ? 'text-zinc-500' : 'text-slate-400'
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className={`text-[24px] md:text-[28px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Statistiques & Bilans
        </h1>
        <p className={`text-[13px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Analysez vos performances, votre répartition horaire et votre progression.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total studied hours */}
        <div className="card p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className={labelClass}>Heures Étudiées</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className={`text-[28px] font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalStudyHours}
            </h3>
            <span className={`text-[13px] font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>h</span>
          </div>
          <p className={`text-[11px] font-medium mt-3 flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            <span>Total : {totalStudyMinutes} min</span>
          </p>
        </div>

        {/* Global Progress */}
        <div className="card p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className={labelClass}>Progression</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className={`text-[28px] font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {globalProgress}
            </h3>
            <span className={`text-[13px] font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>%</span>
          </div>
          <p className={`text-[11px] font-medium mt-3 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            {completedChaptersCount} / {totalChaptersCount} chapitres
          </p>
        </div>

        {/* Sessions Logged */}
        <div className="card p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className={labelClass}>Sessions</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
            }`}>
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className={`text-[28px] font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {studySessions.length}
            </h3>
            <span className={`text-[13px] font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>focus</span>
          </div>
          <p className={`text-[11px] font-medium mt-3 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            Sessions d'étude complétées
          </p>
        </div>

        {/* Average Session Length */}
        <div className="card p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className={labelClass}>Durée Moy.</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
            }`}>
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className={`text-[28px] font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {averageSessionLength}
            </h3>
            <span className={`text-[13px] font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>min/sess</span>
          </div>
          <p className={`text-[11px] font-medium mt-3 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            Par session en moyenne
          </p>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Time per subject (Pie Chart) */}
        <div className="card p-6 flex flex-col">
          <h2 className={`text-[15px] font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <PieIcon className="w-[18px] h-[18px] text-indigo-500" />
            Répartition du temps étudié
          </h2>
          
          <div className="flex-1 min-h-[260px] flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <p className={`text-[13px] italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Aucune donnée disponible. Lancez des sessions Focus.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke={isDark ? '#111113' : '#ffffff'}
                    strokeWidth={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#18181b' : '#ffffff', 
                      borderColor: isDark ? '#27272a' : '#e2e8f0', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                    labelStyle={{ color: isDark ? '#e4e4e7' : '#1e293b', fontWeight: 700 }}
                    itemStyle={{ color: isDark ? '#e4e4e7' : '#1e293b' }}
                    formatter={(value: any) => [`${value} minutes`, 'Temps étudié']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className={`text-[12px] font-medium ml-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Chapter Progress per Subject (Bar Chart) */}
        <div className="card p-6 flex flex-col">
          <h2 className={`text-[15px] font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <BarChart3 className="w-[18px] h-[18px] text-emerald-500" />
            Chapitres révisés par matière
          </h2>

          <div className="flex-1 min-h-[260px] w-full">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className={`text-[13px] italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Aucune donnée disponible. Créez des matières et des chapitres.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={32} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e1e23' : '#f1f5f9'} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: isDark ? '#71717a' : '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: isDark ? '#71717a' : '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: isDark ? '#18181b' : '#ffffff', 
                      borderColor: isDark ? '#27272a' : '#e2e8f0', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                    labelStyle={{ color: isDark ? '#e4e4e7' : '#1e293b', fontWeight: 700 }}
                    cursor={{fill: isDark ? '#1f1f23' : '#f8fafc'}}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    iconType="rect"
                    formatter={(value) => <span className={`text-[12px] font-medium ml-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{value}</span>}
                  />
                  <Bar dataKey="Complétés" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total" fill={isDark ? '#3f3f46' : '#cbd5e1'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* History Log Section */}
      <div className="card p-6">
        <h2 className={`text-[15px] font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <History className={`w-[18px] h-[18px] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
          Sessions d'études récentes
        </h2>

        {recentSessionsList.length === 0 ? (
          <div className="py-10 text-center">
            <p className={`text-[13px] italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Aucune session d'étude enregistrée dans l'historique.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-400 border-slate-200'}`}>
                <tr>
                  <th className="pb-3 pr-4 font-semibold">Date / Heure</th>
                  <th className="pb-3 pr-4 font-semibold">Chapitre / Matière</th>
                  <th className="pb-3 px-4 font-semibold text-center">Durée</th>
                  <th className="pb-3 pl-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                {recentSessionsList.map((session) => {
                  const chap = chapters.find(c => c.id === session.chapter_id);
                  const sub = session.subject_id 
                    ? subjects.find(s => s.id === session.subject_id) 
                    : chap 
                    ? subjects.find(s => s.id === chap.subject_id) 
                    : null;

                  const formattedDate = (() => {
                    if (!session.completed_at) return 'Inconnu';
                    const d = new Date(session.completed_at);
                    return isNaN(d.getTime()) ? 'Inconnu' : d.toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  })();

                  return (
                    <tr key={session.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/30' : 'hover:bg-slate-50/50'}`}>
                      <td className={`py-3.5 pr-4 whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {formattedDate}
                      </td>
                      <td className="py-3.5 pr-4 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className={`font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                            {chap ? chap.name : 'Session libre'}
                          </span>
                          {sub && (
                            <span className="text-[10px] font-bold mt-0.5" style={{ color: sub.color }}>
                              {sub.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold ${
                          isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          ⏱️ {session.duration} min
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer inline-flex ${
                            isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-white/[0.08]' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                          }`}
                          title="Supprimer la session"
                        >
                          <Trash2 className="w-[14px] h-[14px]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
