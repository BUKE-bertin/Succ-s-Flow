import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Target,
  Sparkles,
  BellRing,
} from "lucide-react";
import { toast } from "react-hot-toast";

const PRESETS = [
  { label: "Pomodoro Classique", focusMinutes: 25, breakMinutes: 5 },
  { label: "Focus Intense", focusMinutes: 45, breakMinutes: 10 },
  { label: "Grande Session", focusMinutes: 60, breakMinutes: 15 },
];

export const Focus = () => {
  const { chapters, subjects, addStudySession, theme } = useAppStore();
  const isDark = theme === "dark";

  // Active uncompleted chapters
  const uncompletedChapters = chapters.filter((c) => !c.completed);

  // States
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [mode, setMode] = useState("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].focusMinutes * 60);

  // Timer Ref
  const intervalRef = useRef(null);
  // Track total time for progress ring
  const totalDuration =
    mode === "focus"
      ? PRESETS[selectedPresetIndex].focusMinutes * 60
      : PRESETS[selectedPresetIndex].breakMinutes * 60;

  // Sound generator using Web Audio API
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playSingleBeep = (timeOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880; // pitch
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(
          0.3,
          ctx.currentTime + timeOffset + 0.05,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + timeOffset + 0.3,
        );
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.3);
      };

      playSingleBeep(0);
      playSingleBeep(0.4);
    } catch (err) {
      console.warn("Web Audio Context not allowed or supported yet.", err);
    }
  };

  // Browser Notification Request
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }
  };

  // Set default chapter if list changes
  useEffect(() => {
    if (uncompletedChapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(uncompletedChapters[0].id);
    }
  }, [uncompletedChapters, selectedChapterId]);

  // Handle Preset Change
  const selectPreset = (index) => {
    setIsRunning(false);
    setSelectedPresetIndex(index);
    setMode("focus");
    setTimeLeft(PRESETS[index].focusMinutes * 60);
    toast.success(`Preset "${PRESETS[index].label}" sélectionné.`);
  };

  // Start / Pause
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(
      mode === "focus"
        ? PRESETS[selectedPresetIndex].focusMinutes * 60
        : PRESETS[selectedPresetIndex].breakMinutes * 60,
    );
  };

  // Timer Core logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, selectedPresetIndex, selectedChapterId]);

  // Handler for timer ending
  async function handleTimerComplete() {
    playBeep();

    if (mode === "focus") {
      const activePreset = PRESETS[selectedPresetIndex];
      const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
      // Log session
      await addStudySession({
        chapter_id: selectedChapterId || undefined,
        subject_id: selectedChapter?.subject_id || undefined,
        duration: activePreset.focusMinutes,
      });

      sendBrowserNotification(
        "Session Focus Terminée ! 🎯",
        `Félicitations pour vos ${activePreset.focusMinutes} minutes de révision.`,
      );

      toast.success(
        `Félicitations ! Session de focus de ${activePreset.focusMinutes} min enregistrée. Place à la pause !`,
        { duration: 6000 },
      );

      // Switch to break
      setMode("break");
      setTimeLeft(activePreset.breakMinutes * 60);
    } else {
      // Break Finished
      sendBrowserNotification(
        "Pause terminée ! 📚",
        "C est le moment de reprendre les révisions.",
      );

      toast.success(
        "La pause est finie. C'est parti pour une nouvelle session !",
      );
      // Switch back to focus
      setMode("focus");
      setTimeLeft(PRESETS[selectedPresetIndex].focusMinutes * 60);
    }
  }

  // Helpers for formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Circular progress calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (timeLeft / totalDuration) * circumference;

  // Find active chapter information
  const currentChapter = chapters.find((c) => c.id === selectedChapterId);
  const currentSubject = currentChapter
    ? subjects.find((s) => s.id === currentChapter.subject_id)
    : null;

  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] block ${
    isDark ? "text-zinc-500" : "text-slate-400"
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1
          className={`text-[24px] md:text-[28px] font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Mode Focus / Pomodoro
        </h1>
        <p
          className={`text-[13px] mt-1 ${isDark ? "text-zinc-400" : "text-slate-500"}`}
        >
          Éliminez les distractions et révisez par blocs de temps optimisés.
        </p>
      </div>

      {/* Preset Selection & Chapter Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selector Widgets */}
        <div className="space-y-6 lg:col-span-1">
          {/* Presets Card */}
          <div className="card p-6 space-y-4">
            <h3 className={labelClass}>Choix du rythme</h3>
            <div className="flex flex-col gap-2.5">
              {PRESETS.map((preset, index) => {
                const isActive = selectedPresetIndex === index;
                const activeClasses = isActive
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_4px_12px_rgba(99,102,241,0.25)] scale-[1.02]"
                  : isDark
                    ? "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    : "bg-transparent border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300";
                return (
                  <button
                    key={preset.label}
                    onClick={() => selectPreset(index)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-250 cursor-pointer ${activeClasses}`}
                  >
                    <p
                      className={`text-[14px] font-bold ${isActive ? "text-white" : isDark ? "text-zinc-300" : "text-slate-700"}`}
                    >
                      {preset.label}
                    </p>
                    <p
                      className={`text-[12px] mt-1 font-medium ${isActive ? "text-indigo-100" : isDark ? "text-zinc-500" : "text-slate-500"}`}
                    >
                      💻 Focus: {preset.focusMinutes} min | ☕ Pause:{" "}
                      {preset.breakMinutes} min
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chapter Selector Card */}
          <div className="card p-6 space-y-4">
            <h3 className={`${labelClass} flex items-center gap-2`}>
              <Target className="w-4 h-4 text-indigo-500" />
              Sujet de travail
            </h3>

            {uncompletedChapters.length === 0 ? (
              <p
                className={`text-[12px] italic ${isDark ? "text-zinc-500" : "text-slate-500"}`}
              >
                Aucun chapitre à réviser disponible. Créez-en un dans l'onglet
                "Chapitres".
              </p>
            ) : (
              <div className="space-y-3">
                <label
                  className={`text-[12px] font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}
                >
                  Sélectionnez le chapitre sur lequel vous allez travailler :
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-[13px] outline-none transition-colors duration-250 cursor-pointer appearance-none ${
                    isDark
                      ? "bg-white/[0.03] border border-zinc-800 text-zinc-200 focus:border-indigo-500"
                      : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDark ? "%2371717a" : "%2394a3b8"}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  {uncompletedChapters.map((chap) => {
                    const sub = subjects.find((s) => s.id === chap.subject_id);
                    return (
                      <option key={chap.id} value={chap.id}>
                        {sub ? `[${sub.name}] ` : ""}
                        {chap.name}
                      </option>
                    );
                  })}
                </select>

                {currentChapter && (
                  <div
                    className={`p-3 rounded-xl border space-y-1 transition-colors ${
                      isDark
                        ? "bg-white/[0.02] border-zinc-800"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                    >
                      Chapitre actif
                    </p>
                    <div className="flex items-center gap-2">
                      {currentSubject && (
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: currentSubject.color }}
                        ></div>
                      )}
                      <span
                        className={`text-[13px] font-bold truncate ${isDark ? "text-zinc-200" : "text-slate-800"}`}
                      >
                        {currentChapter.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Column: Giant Pomodoro Timer */}
        <div className="lg:col-span-2 card p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[450px]">
          {/* Animated Glow in Background */}
          <div
            className={`absolute w-80 h-80 rounded-full blur-3xl opacity-[0.15] transition-colors duration-1000 pointer-events-none ${
              mode === "focus" ? "bg-indigo-500" : "bg-emerald-500"
            }`}
          ></div>

          <div className="relative z-10 flex flex-col items-center space-y-8">
            {/* Mode Indicator */}
            <div
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold transition-colors duration-300 ${
                mode === "focus"
                  ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              {mode === "focus" ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Session de Focus</span>
                </>
              ) : (
                <>
                  <Coffee className="w-4 h-4" />
                  <span>Pause Relaxation</span>
                </>
              )}
            </div>

            {/* Circular Timer Display */}
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="144"
                  cy="144"
                  r={radius}
                  className={isDark ? "stroke-zinc-800/80" : "stroke-slate-200"}
                  strokeWidth="10"
                  fill="transparent"
                />

                {/* Foreground Active Ring */}
                <circle
                  cx="144"
                  cy="144"
                  r={radius}
                  className={`transition-all duration-300 ease-linear ${
                    mode === "focus"
                      ? "stroke-indigo-500"
                      : "stroke-emerald-500"
                  }`}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Time Numbers in Middle */}
              <div className="absolute text-center space-y-1 flex flex-col items-center">
                <span
                  className={`text-[56px] font-extrabold tracking-tighter tabular-nums leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {formatTime(timeLeft)}
                </span>
                <p
                  className={`text-[12px] uppercase tracking-[0.2em] font-bold ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                >
                  {isRunning ? "En Cours" : "Pause"}
                </p>
              </div>
            </div>

            {/* Timer Buttons */}
            <div className="flex gap-5">
              {/* Play/Pause */}
              <button
                onClick={toggleTimer}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-250 hover:scale-105 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${
                  isRunning
                    ? isDark
                      ? "bg-zinc-800 hover:bg-zinc-700"
                      : "bg-slate-800 hover:bg-slate-700"
                    : mode === "focus"
                      ? "bg-indigo-500 hover:bg-indigo-600 shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
                }`}
              >
                {isRunning ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </button>

              {/* Reset */}
              <button
                onClick={resetTimer}
                className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all duration-250 hover:scale-105 cursor-pointer ${
                  isDark
                    ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                }`}
                title="Réinitialiser"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>

            {/* Audio Alert Trigger Help */}
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold pt-2 ${isDark ? "text-zinc-500" : "text-slate-500"}`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Notifications et alertes sonores activées.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
