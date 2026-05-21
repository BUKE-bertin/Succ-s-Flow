import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Chapter } from '../store/useAppStore';
import { CalendarRange, Sparkles, CheckCircle2, Circle, AlertCircle, Clock, BarChart4 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ScheduledDay {
  date: Date;
  dateString: string;
  chapters: Chapter[];
  totalDuration: number; // in minutes
}

export const Planner: React.FC = () => {
  const { subjects, chapters, examDate, toggleChapterCompleted, theme } = useAppStore();
  const isDark = theme === 'dark';

  // 1. Calculate days remaining
  const daysRemaining = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 14; // default to 14 days if exam is today or in the past
  }, [examDate]);

  // We plan for the next min(14, daysRemaining) days
  const planningDaysCount = Math.min(14, daysRemaining);

  // 2. Generate the smart schedule
  const schedule: ScheduledDay[] = useMemo(() => {
    // We only plan for uncompleted chapters
    const uncompletedChapters = chapters.filter(c => !c.completed);
    if (uncompletedChapters.length === 0 || subjects.length === 0) return [];

    // Create target days
    const days: ScheduledDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < planningDaysCount; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      days.push({
        date: targetDate,
        dateString: targetDate.toISOString().split('T')[0],
        chapters: [],
        totalDuration: 0
      });
    }

    // Sort chapters by subject priority (high -> medium -> low)
    // then by difficulty (hard -> medium -> easy)
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const difficultyWeights = { hard: 3, medium: 2, easy: 1 };

    const sortedChapters = [...uncompletedChapters].sort((a, b) => {
      const subA = subjects.find(s => s.id === a.subject_id);
      const subB = subjects.find(s => s.id === b.subject_id);

      const pA = subA ? priorityWeights[subA.priority] : 2;
      const pB = subB ? priorityWeights[subB.priority] : 2;

      if (pA !== pB) return pB - pA; // priority desc

      const dA = difficultyWeights[a.difficulty];
      const dB = difficultyWeights[b.difficulty];

      return dB - dA; // difficulty desc
    });

    // Greedy load balancing allocation (Bin Packing)
    for (const chap of sortedChapters) {
      let minDayIndex = 0;
      let minDuration = days[0].totalDuration;

      for (let i = 1; i < days.length; i++) {
        if (days[i].totalDuration < minDuration) {
          minDuration = days[i].totalDuration;
          minDayIndex = i;
        }
      }

      days[minDayIndex].chapters.push(chap);
      days[minDayIndex].totalDuration += chap.estimated_duration;
    }

    return days;
  }, [chapters, subjects, planningDaysCount]);

  // 3. Stats for header
  const totalPlannedMinutes = useMemo(() => {
    return schedule.reduce((acc, day) => acc + day.totalDuration, 0);
  }, [schedule]);

  const averageDailyMinutes = useMemo(() => {
    return schedule.length > 0 ? Math.round(totalPlannedMinutes / schedule.length) : 0;
  }, [totalPlannedMinutes, schedule]);

  const totalPlannedChapters = useMemo(() => {
    return schedule.reduce((acc, day) => acc + day.chapters.length, 0);
  }, [schedule]);

  const handleToggleChapter = async (id: string, completed: boolean) => {
    await toggleChapterCompleted(id);
    if (!completed) {
      toast.success('Chapitre validé depuis le planning !');
    }
  };

  // Shared classes
  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] ${
    isDark ? 'text-zinc-500' : 'text-slate-400'
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-[24px] md:text-[28px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Planning Intelligent
          </h1>
          <p className={`text-[13px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Algorithme de répartition équilibrée de vos révisions pour les {planningDaysCount} prochains jours.
          </p>
        </div>
      </div>

      {/* Conditions alerts */}
      {subjects.length === 0 ? (
        <div className={`card p-8 flex flex-col items-center justify-center text-center gap-3 ${
          isDark ? 'bg-white/[0.01]' : 'bg-slate-50/50'
        }`}>
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucune matière configurée</p>
          <p className={`text-[13px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Allez dans l'onglet "Matières" pour configurer votre programme.</p>
        </div>
      ) : chapters.filter(c => !c.completed).length === 0 ? (
        <div className={`card p-8 flex flex-col items-center justify-center text-center gap-3 ${
          isDark ? 'bg-emerald-500/[0.02]' : 'bg-emerald-50/50'
        }`}>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <p className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tout est révisé ! 🎉</p>
          <p className={`text-[13px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Vous n'avez aucun chapitre en attente. Félicitations !</p>
        </div>
      ) : (
        <>
          {/* Summary Widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Total Time */}
            <div className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Clock className="w-[20px] h-[20px]" />
              </div>
              <div>
                <span className={labelClass}>Temps requis</span>
                <p className={`text-[20px] font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {Math.round(totalPlannedMinutes / 60 * 10) / 10} h
                </p>
              </div>
            </div>

            {/* Daily Average */}
            <div className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <BarChart4 className="w-[20px] h-[20px]" />
              </div>
              <div>
                <span className={labelClass}>Charge moyenne</span>
                <p className={`text-[20px] font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {averageDailyMinutes} min / j
                </p>
              </div>
            </div>

            {/* Chapters Remaining */}
            <div className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                <CalendarRange className="w-[20px] h-[20px]" />
              </div>
              <div>
                <span className={labelClass}>À répartir</span>
                <p className={`text-[20px] font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {totalPlannedChapters} chap.
                </p>
              </div>
            </div>
          </div>

          {/* AI Banner Explainer */}
          <div className={`p-4 rounded-2xl flex items-start gap-3.5 border ${
            isDark ? 'bg-indigo-500/[0.04] border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100'
          }`}>
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h3 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Répartition intelligente</h3>
              <p className={`text-[12px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                L'algorithme trie vos chapitres par priorité puis difficulté. Il les distribue ensuite jour par jour en équilibrant la charge horaire (bin-packing) pour éviter la fatigue.
              </p>
            </div>
          </div>

          {/* Timeline View */}
          <div className="space-y-4 pt-2">
            <h2 className={`text-[18px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Votre Programme Quotidien</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {schedule.map((day, idx) => {
                const dayName = day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                
                return (
                  <div 
                    key={day.dateString}
                    className="card p-5 flex flex-col justify-between"
                  >
                    {/* Day Header */}
                    <div>
                      <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-zinc-800/60' : 'border-slate-200/80'}`}>
                        <h3 className={`font-bold text-[15px] capitalize flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                          }`}>Jour {idx + 1}</span>
                          {dayName}
                        </h3>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          day.totalDuration > 180 ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          day.totalDuration > 90 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          day.totalDuration > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          isDark ? 'bg-white/[0.04] text-zinc-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {day.totalDuration} min
                        </span>
                      </div>

                      {/* Chapters Scheduled for Day */}
                      <div className="mt-4 space-y-2.5">
                        {day.chapters.length === 0 ? (
                          <p className={`text-[12px] italic py-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Journée libre ! Reposez-vous ou avancez sur d'autres matières.</p>
                        ) : (
                          day.chapters.map(chap => {
                            const sub = subjects.find(s => s.id === chap.subject_id);
                            return (
                              <div 
                                key={chap.id}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                                  isDark 
                                    ? 'bg-white/[0.02] border-zinc-800/80 hover:bg-white/[0.04]' 
                                    : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-50'
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleChapter(chap.id, chap.completed)}
                                  className={`shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                    isDark ? 'text-zinc-600 hover:text-indigo-400' : 'text-slate-300 hover:text-indigo-500'
                                  }`}
                                  title="Marquer comme complété"
                                >
                                  <Circle className="w-[18px] h-[18px]" />
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[13px] font-bold truncate ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{chap.name}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {sub && (
                                      <span className="text-[10px] font-bold" style={{ color: sub.color }}>
                                        {sub.name}
                                      </span>
                                    )}
                                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>• {chap.estimated_duration} min</span>
                                    <span className={`text-[10px] font-bold ${
                                      chap.difficulty === 'hard' ? 'text-red-500' :
                                      chap.difficulty === 'medium' ? 'text-amber-500' :
                                      'text-emerald-500'
                                    }`}>
                                      • {chap.difficulty === 'easy' ? 'Facile' : chap.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
