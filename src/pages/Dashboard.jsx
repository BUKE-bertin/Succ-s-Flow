import React, { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  Calendar,
  Hourglass,
  CheckCircle2,
  TrendingUp,
  Settings2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-hot-toast";

export const Dashboard = () => {
  const {
    subjects,
    chapters,
    studySessions,
    examDate,
    dailyStudyGoal,
    updateSettings,
    theme,
  } = useAppStore();

  const isDark = theme === "dark";

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempExamDate, setTempExamDate] = useState(examDate);
  const [tempGoal, setTempGoal] = useState(dailyStudyGoal);

  // === Calculations ===
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.completed).length;
  const globalProgress =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0;
  const totalStudyTime = studySessions.reduce(
    (acc, sess) => acc + sess.duration,
    0,
  );

  const getDaysRemaining = () => {
    if (!examDate) return 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    if (isNaN(exam.getTime())) return 14;
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysRemaining = getDaysRemaining();

  // Chart data
  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      const dailySessions = studySessions.filter(
        (s) => s.completed_at && s.completed_at.startsWith(dateString),
      );
      const dailyMinutes = dailySessions.reduce(
        (acc, s) => acc + s.duration,
        0,
      );
      const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" });
      data.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        minutes: dailyMinutes,
        date: dateString,
      });
    }
    return data;
  };
  const chartData = getLast7DaysData();
  const todayMinutes = chartData[chartData.length - 1]?.minutes || 0;
  const yesterdayMinutes = chartData[chartData.length - 2]?.minutes || 0;
  const dailyTrend = todayMinutes - yesterdayMinutes;

  // Priority subjects
  const prioritySubjects = [...subjects]
    .map((sub) => {
      const subChapters = chapters.filter((c) => c.subject_id === sub.id);
      const subCompleted = subChapters.filter((c) => c.completed).length;
      const progress =
        subChapters.length > 0
          ? Math.round((subCompleted / subChapters.length) * 100)
          : 0;
      return {
        ...sub,
        total: subChapters.length,
        completed: subCompleted,
        progress,
      };
    })
    .sort((a, b) => {
      const pw = { high: 3, medium: 2, low: 1 };
      return pw[b.priority] - pw[a.priority];
    })
    .slice(0, 4);

  // Save settings
  const handleSaveSettings = async () => {
    if (!tempExamDate) {
      toast.error("Date d'examen invalide");
      return;
    }
    if (tempGoal <= 0) {
      toast.error("L'objectif doit être > 0");
      return;
    }
    await updateSettings({
      examDate: tempExamDate,
      dailyStudyGoal: Number(tempGoal),
    });
    setIsEditingSettings(false);
    toast.success("Réglages mis à jour !");
  };

  const getSmartAdvice = () => {
    if (daysRemaining <= 0)
      return "C'est le jour J ! Restez calme et concentré.";
    if (daysRemaining <= 3)
      return "Dernière ligne droite. Relisez vos fiches clés et dormez bien.";
    if (daysRemaining <= 7)
      return "Semaine cruciale. Ciblez les chapitres difficiles en priorité.";
    return "Bon rythme ! Continuez régulièrement pour éviter le stress.";
  };

  // === Shared Styles (UUPM: Soft UI Evolution, 200-300ms transitions) ===
  const cardClass = `rounded-2xl p-5 transition-all duration-250 ${
    isDark
      ? "bg-[#111113] border border-zinc-800/50 hover:border-zinc-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
      : "bg-white border border-slate-200/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-slate-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
  }`;

  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] ${
    isDark ? "text-zinc-500" : "text-slate-400"
  }`;

  const valueClass = `text-[28px] font-extrabold tracking-tight leading-none ${
    isDark ? "text-white" : "text-slate-900"
  }`;

  const subtextClass = `text-[12px] mt-1.5 ${isDark ? "text-zinc-500" : "text-slate-400"}`;

  const iconBoxClass = (color) => {
    const colors = {
      indigo: isDark
        ? "bg-indigo-500/10 text-indigo-400"
        : "bg-indigo-50 text-indigo-600",
      emerald: isDark
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",
      amber: isDark
        ? "bg-amber-500/10 text-amber-400"
        : "bg-amber-50 text-amber-600",
      purple: isDark
        ? "bg-purple-500/10 text-purple-400"
        : "bg-purple-50 text-purple-600",
    };
    return `w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${colors[color] || colors.indigo}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* === KPI STAT CARDS (UUPM Style #30: Executive Dashboard) === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Countdown */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className={labelClass}>Jours Restants</span>
            <div className={iconBoxClass("indigo")}>
              <Calendar className="w-[18px] h-[18px]" />
            </div>
          </div>
          <h3 className={valueClass}>
            {daysRemaining > 0 ? daysRemaining : 0}
          </h3>
          <p className={subtextClass}>
            {(() => {
              if (!examDate) return "Cible non définie";
              const d = new Date(examDate);
              return isNaN(d.getTime())
                ? "Cible non définie"
                : `Examen : ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
            })()}
          </p>
        </div>

        {/* Progress */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className={labelClass}>Progression</span>
            <div className={iconBoxClass("emerald")}>
              <TrendingUp className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className={valueClass}>{globalProgress}%</h3>
            <span
              className={`text-[11px] font-bold flex items-center gap-0.5 ${
                globalProgress >= 50
                  ? "text-emerald-500"
                  : isDark
                    ? "text-zinc-500"
                    : "text-slate-400"
              }`}
            >
              {globalProgress >= 50 && <ArrowUpRight className="w-3 h-3" />}
              {globalProgress >= 80
                ? "Excellent"
                : globalProgress >= 50
                  ? "Bien"
                  : ""}
            </span>
          </div>
          <div
            className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isDark ? "bg-zinc-800" : "bg-slate-100"}`}
          >
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${globalProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Study Time */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className={labelClass}>Temps Étudié</span>
            <div className={iconBoxClass("amber")}>
              <Hourglass className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className={valueClass}>
              {Math.round((totalStudyTime / 60) * 10) / 10}
            </h3>
            <span
              className={`text-sm font-semibold ${isDark ? "text-zinc-500" : "text-slate-400"}`}
            >
              h
            </span>
          </div>
          <div className={`flex items-center gap-1 mt-1.5`}>
            {dailyTrend !== 0 && (
              <span
                className={`text-[11px] font-bold flex items-center gap-0.5 ${
                  dailyTrend > 0 ? "text-emerald-500" : "text-red-400"
                }`}
              >
                {dailyTrend > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(dailyTrend)} min
              </span>
            )}
            <span className={subtextClass}>vs hier</span>
          </div>
        </div>

        {/* Chapters */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className={labelClass}>Chapitres</span>
            <div className={iconBoxClass("purple")}>
              <CheckCircle2 className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className={valueClass}>{completedChapters}</h3>
            <span
              className={`text-sm font-semibold ${isDark ? "text-zinc-500" : "text-slate-400"}`}
            >
              / {totalChapters}
            </span>
          </div>
          <p className={subtextClass}>
            {totalChapters - completedChapters} restant
            {totalChapters - completedChapters !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* === CHART + SETTINGS GRID === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart (UUPM: Soft UI Evolution shadows + clean data viz) */}
        <div className={`lg:col-span-2 ${cardClass} !p-6`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className={`text-[15px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Activité de Révision
              </h2>
              <p
                className={`text-[12px] mt-0.5 ${isDark ? "text-zinc-500" : "text-slate-400"}`}
              >
                Minutes d'étude · 7 derniers jours
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                isDark
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Flame className="w-3 h-3" />7 jours
            </div>
          </div>

          <div className="h-[220px] w-full">
            {totalStudyTime === 0 ? (
              <div
                className={`h-full flex flex-col items-center justify-center border border-dashed rounded-xl gap-2 ${
                  isDark
                    ? "text-zinc-500 border-zinc-800/60"
                    : "text-slate-400 border-slate-200"
                }`}
              >
                <Clock
                  className={`w-8 h-8 ${isDark ? "text-zinc-700" : "text-slate-300"}`}
                />
                <p className="text-[13px]">Aucun temps d'étude cette semaine</p>
                <p
                  className={`text-[11px] ${isDark ? "text-zinc-600" : "text-slate-400"}`}
                >
                  Lancez un Pomodoro depuis "Focus" !
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorMinutesGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6366f1"
                        stopOpacity={isDark ? 0.25 : 0.15}
                      />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? "#1e1e23" : "#f1f5f9"}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: isDark ? "#52525b" : "#94a3b8",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: isDark ? "#52525b" : "#94a3b8",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#18181b" : "#ffffff",
                      borderColor: isDark ? "#27272a" : "#e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                    labelStyle={{
                      color: isDark ? "#e4e4e7" : "#1e293b",
                      fontWeight: 700,
                    }}
                    itemStyle={{ color: "#6366f1" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="minutes"
                    name="Minutes"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMinutesGrad)"
                    dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                    activeDot={{
                      r: 5,
                      fill: "#6366f1",
                      stroke: isDark ? "#111113" : "#ffffff",
                      strokeWidth: 3,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Settings & Advice */}
        <div className={`${cardClass} !p-6 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-[15px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Objectifs
            </h2>
            <button
              onClick={() => {
                setTempExamDate(examDate);
                setTempGoal(dailyStudyGoal);
                setIsEditingSettings(!isEditingSettings);
              }}
              className={`p-1.5 rounded-lg transition-colors duration-200 ${
                isDark
                  ? "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          {isEditingSettings ? (
            <div className="space-y-3 flex-1">
              <div className="space-y-1.5">
                <label className={`${labelClass} block`}>Date d'examen</label>
                <input
                  type="date"
                  value={tempExamDate}
                  onChange={(e) => setTempExamDate(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors duration-200 ${
                    isDark
                      ? "bg-white/[0.04] border border-zinc-800 text-zinc-200 focus:border-indigo-500"
                      : "bg-slate-50 border border-slate-200 text-slate-700 focus:border-indigo-500"
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={`${labelClass} block`}>
                  Objectif (min/jour)
                </label>
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  min="1"
                  className={`w-full rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors duration-200 ${
                    isDark
                      ? "bg-white/[0.04] border border-zinc-800 text-zinc-200 focus:border-indigo-500"
                      : "bg-slate-50 border border-slate-200 text-slate-700 focus:border-indigo-500"
                  }`}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-[12px] transition-colors duration-200"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setIsEditingSettings(false)}
                  className={`flex-1 font-semibold py-2.5 rounded-xl text-[12px] transition-colors duration-200 ${
                    isDark
                      ? "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              <div
                className={`flex justify-between pb-3 border-b ${isDark ? "border-zinc-800/50" : "border-slate-100"}`}
              >
                <span
                  className={`text-[13px] ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                >
                  Date cible
                </span>
                <span
                  className={`font-semibold text-[13px] ${isDark ? "text-zinc-200" : "text-slate-700"}`}
                >
                  {(() => {
                    if (!examDate) return "Non défini";
                    const d = new Date(examDate);
                    return isNaN(d.getTime())
                      ? "Non défini"
                      : d.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        });
                  })()}
                </span>
              </div>
              <div
                className={`flex justify-between pb-3 border-b ${isDark ? "border-zinc-800/50" : "border-slate-100"}`}
              >
                <span
                  className={`text-[13px] ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                >
                  Objectif / jour
                </span>
                <span
                  className={`font-semibold text-[13px] ${isDark ? "text-zinc-200" : "text-slate-700"}`}
                >
                  {dailyStudyGoal} min
                </span>
              </div>

              {/* Daily goal progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[12px] flex items-center gap-1 ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                  >
                    <Target className="w-3 h-3" /> Aujourd'hui
                  </span>
                  <span
                    className={`text-[12px] font-bold tabular-nums ${
                      todayMinutes >= dailyStudyGoal
                        ? "text-emerald-500"
                        : isDark
                          ? "text-zinc-300"
                          : "text-slate-600"
                    }`}
                  >
                    {todayMinutes} / {dailyStudyGoal} min
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-slate-100"}`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      todayMinutes >= dailyStudyGoal
                        ? "bg-emerald-500"
                        : "bg-indigo-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((todayMinutes / dailyStudyGoal) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Smart advice (UUPM: contextual feedback) */}
          <div
            className={`mt-4 p-3 rounded-xl flex items-start gap-2.5 ${
              isDark
                ? "bg-amber-500/[0.06] border border-amber-500/10"
                : "bg-amber-50/80 border border-amber-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p
              className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}
            >
              <span
                className={`font-semibold ${isDark ? "text-zinc-200" : "text-slate-700"}`}
              >
                Conseil :{" "}
              </span>
              {getSmartAdvice()}
            </p>
          </div>
        </div>
      </div>

      {/* === PRIORITY SUBJECTS (UUPM: Data-Dense, horizontal bars) === */}
      {prioritySubjects.length > 0 && (
        <div className={`${cardClass} !p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h2
              className={`text-[15px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Matières prioritaires
            </h2>
            <span
              className={`text-[11px] font-medium ${isDark ? "text-zinc-600" : "text-slate-400"}`}
            >
              Progression
            </span>
          </div>
          <div className="space-y-4">
            {prioritySubjects.map((sub) => (
              <div key={sub.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color }}
                  ></div>
                  <span
                    className={`text-[13px] font-medium truncate ${isDark ? "text-zinc-200" : "text-slate-700"}`}
                  >
                    {sub.name}
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        backgroundColor: sub.color,
                        width: `${sub.progress}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <span
                  className={`text-[13px] font-bold tabular-nums min-w-[50px] text-right ${isDark ? "text-zinc-300" : "text-slate-700"}`}
                >
                  {sub.completed}/{sub.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
