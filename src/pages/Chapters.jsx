import React, { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  BookPlus,
  Trash2,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const Chapters = () => {
  const {
    subjects,
    chapters,
    addChapter,
    toggleChapterCompleted,
    deleteChapter,
    theme,
  } = useAppStore();
  const isDark = theme === "dark";

  // Filter State
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [hideCompleted, setHideCompleted] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(60); // 1 hour default

  // Set default subject if subjects exist
  React.useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Veuillez donner un nom au chapitre.");
      return;
    }
    if (!subjectId) {
      toast.error("Veuillez sélectionner une matière.");
      return;
    }

    try {
      await addChapter({
        name: name.trim(),
        subject_id: subjectId,
        difficulty,
        estimated_duration: Number(duration),
      });
      toast.success("Chapitre ajouté !");
      setName("");
      // Keep other form selections for consecutive adds
    } catch (e) {
      toast.error("Erreur lors de l'ajout.");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Supprimer le chapitre "${name}" ?`)) {
      await deleteChapter(id);
      toast.success("Chapitre supprimé.");
    }
  };

  const handleToggle = async (id, completed) => {
    await toggleChapterCompleted(id);
    if (!completed) {
      toast.success("Chapitre révisé ! Temps d'étude enregistré.");
    } else {
      toast.success("Statut mis à jour.");
    }
  };

  // Filter logic
  const filteredChapters = chapters.filter((c) => {
    const matchesSubject =
      selectedSubjectId === "all" || c.subject_id === selectedSubjectId;
    const matchesCompleted = !hideCompleted || !c.completed;
    return matchesSubject && matchesCompleted;
  });

  // Shared Styles
  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5 block ${
    isDark ? "text-zinc-500" : "text-slate-500"
  }`;

  const inputClass = `w-full rounded-xl px-4 py-3 text-[13px] outline-none transition-colors duration-250 ${
    isDark
      ? "bg-white/[0.03] border border-zinc-800 text-zinc-200 focus:border-indigo-500 placeholder:text-zinc-600 appearance-none"
      : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400 appearance-none"
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1
          className={`text-[24px] md:text-[28px] font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Gestion des Chapitres
        </h1>
        <p
          className={`text-[13px] mt-1 ${isDark ? "text-zinc-400" : "text-slate-500"}`}
        >
          Détaillez vos révisions par matières, estimez leur temps et suivez
          votre progression.
        </p>
      </div>

      {/* Quick Filter Horizontal Bar */}
      <div
        className={`card p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center`}
      >
        {/* Subjects Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider mr-2 ${isDark ? "text-zinc-500" : "text-slate-500"}`}
          >
            Filtrer :
          </span>
          <button
            onClick={() => setSelectedSubjectId("all")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 cursor-pointer border ${
              selectedSubjectId === "all"
                ? isDark
                  ? "bg-zinc-100 border-zinc-100 text-zinc-900"
                  : "bg-slate-800 border-slate-800 text-white"
                : isDark
                  ? "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  : "bg-transparent border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Tous
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                selectedSubjectId === sub.id
                  ? isDark
                    ? "bg-zinc-100 border-zinc-100 text-zinc-900"
                    : "bg-slate-800 border-slate-800 text-white"
                  : isDark
                    ? "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    : "bg-transparent border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: sub.color }}
              ></span>
              {sub.name}
            </button>
          ))}
        </div>

        {/* Toggle Hide Completed */}
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className={`flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-200 cursor-pointer border px-3 py-1.5 rounded-xl ${
            isDark
              ? "text-zinc-400 hover:text-zinc-200 bg-white/[0.02] hover:bg-white/[0.06] border-zinc-800"
              : "text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border-slate-200"
          }`}
        >
          {hideCompleted ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          {hideCompleted ? "Afficher terminés" : "Masquer terminés"}
        </button>
      </div>

      {/* Main Grid: Form and Chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="card p-6 h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {subjects.length === 0 ? (
            <div className="text-center py-6 space-y-3 relative z-10">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p
                className={`text-[13px] ${isDark ? "text-zinc-400" : "text-slate-500"}`}
              >
                Vous devez d'abord créer une matière pour ajouter des chapitres.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <h2
                className={`text-[15px] font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <BookPlus className="w-[18px] h-[18px] text-indigo-500" />
                Nouveau Chapitre
              </h2>

              {/* Name */}
              <div>
                <label className={labelClass}>Titre du chapitre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Intégrales, Listes chaînées..."
                  className={inputClass}
                  required
                />
              </div>

              {/* Subject Selector */}
              <div>
                <label className={labelClass}>Matière associée</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className={inputClass + " cursor-pointer pr-10"}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDark ? "%2371717a" : "%2394a3b8"}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className={labelClass}>Difficulté estimée</label>
                <div className="grid grid-cols-3 gap-2">
                  {["easy", "medium", "hard"].map((d) => {
                    const isActive = difficulty === d;
                    let activeClass = "";
                    if (isActive) {
                      activeClass =
                        d === "hard"
                          ? "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 shadow-[0_2px_8px_rgba(239,68,68,0.15)]"
                          : d === "medium"
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                            : "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.15)]";
                    } else {
                      activeClass = isDark
                        ? "bg-transparent border-zinc-800 text-zinc-500 hover:bg-white/[0.02]"
                        : "bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50";
                    }

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`py-2.5 rounded-xl text-[12px] font-semibold capitalize border transition-all duration-200 cursor-pointer ${activeClass}`}
                      >
                        {d === "easy"
                          ? "Facile"
                          : d === "medium"
                            ? "Moyen"
                            : "Difficile"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Duration */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`${labelClass} !mb-0`}>Durée estimée</label>
                  <span className="text-[12px] text-indigo-500 font-bold">
                    {duration} min ({Math.round((duration / 60) * 10) / 10}h)
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDark ? "bg-zinc-800" : "bg-slate-200"}`}
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((duration - 15) / (240 - 15)) * 100}%, ${isDark ? "#27272a" : "#e2e8f0"} ${((duration - 15) / (240 - 15)) * 100}%, ${isDark ? "#27272a" : "#e2e8f0"} 100%)`,
                  }}
                />

                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #6366f1;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  }
                  input[type=range]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #6366f1;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  }
                `,
                  }}
                />
                <div
                  className={`flex justify-between text-[10px] font-semibold px-0.5 ${isDark ? "text-zinc-600" : "text-slate-400"}`}
                >
                  <span>15 min</span>
                  <span>1h</span>
                  <span>2h</span>
                  <span>3h</span>
                  <span>4h</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl text-[13px] transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)] mt-2"
              >
                Créer le Chapitre
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Chapters List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredChapters.length === 0 ? (
            <div
              className={`h-[300px] flex flex-col items-center justify-center border border-dashed rounded-3xl gap-3 ${
                isDark
                  ? "text-zinc-500 border-zinc-800/60 bg-white/[0.01]"
                  : "text-slate-400 border-slate-200 bg-slate-50/50"
              }`}
            >
              <AlertCircle
                className={`w-8 h-8 ${isDark ? "text-zinc-700" : "text-slate-300"}`}
              />
              <p className="text-[14px] font-medium">Aucun chapitre trouvé.</p>
              <p className="text-[12px] text-center max-w-[250px]">
                {chapters.length === 0
                  ? "Commencez par ajouter un chapitre via le formulaire."
                  : "Modifiez vos filtres ou affichez les chapitres complétés."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChapters.map((chap) => {
                const sub = subjects.find((s) => s.id === chap.subject_id);
                return (
                  <div
                    key={chap.id}
                    className={`card p-4 flex items-center justify-between group ${
                      chap.completed
                        ? isDark
                          ? "opacity-60 bg-zinc-900 border-zinc-800/50"
                          : "opacity-60 bg-slate-50 border-slate-200/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Checkbox Icon */}
                      <button
                        onClick={() => handleToggle(chap.id, chap.completed)}
                        className={`transition-colors shrink-0 cursor-pointer ${
                          chap.completed
                            ? "text-emerald-500 hover:text-emerald-600"
                            : isDark
                              ? "text-zinc-600 hover:text-indigo-400"
                              : "text-slate-300 hover:text-indigo-500"
                        }`}
                        title={
                          chap.completed
                            ? "Marquer comme non révisé"
                            : "Marquer comme révisé"
                        }
                      >
                        {chap.completed ? (
                          <CheckCircle2
                            className={`w-6 h-6 fill-emerald-500/10`}
                          />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      {/* Info Container */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-bold text-[14px] md:text-[15px] truncate ${
                              chap.completed
                                ? isDark
                                  ? "line-through text-zinc-500"
                                  : "line-through text-slate-400"
                                : isDark
                                  ? "text-white"
                                  : "text-slate-900"
                            }`}
                          >
                            {chap.name}
                          </h4>
                          {sub && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                isDark
                                  ? "bg-white/[0.04] border-zinc-800"
                                  : "bg-white border-slate-200"
                              }`}
                              style={{ color: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                        </div>

                        {/* Meta info tags */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span
                            className={`text-[10px] font-bold capitalize ${
                              chap.difficulty === "hard"
                                ? "text-red-600 dark:text-red-400"
                                : chap.difficulty === "medium"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {chap.difficulty === "easy"
                              ? "Facile"
                              : chap.difficulty === "medium"
                                ? "Moyen"
                                : "Difficile"}
                          </span>
                          <span
                            className={`text-[11px] font-semibold flex items-center gap-1 ${
                              isDark ? "text-zinc-500" : "text-slate-500"
                            }`}
                          >
                            <span className="opacity-70">⏱</span>{" "}
                            {chap.estimated_duration} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(chap.id, chap.name)}
                      className={`p-2 rounded-lg transition-colors ml-4 shrink-0 opacity-0 group-hover:opacity-100 ${
                        isDark
                          ? "text-zinc-500 hover:text-red-400 hover:bg-white/[0.08]"
                          : "text-slate-400 hover:text-red-500 hover:bg-slate-100"
                      }`}
                      title="Supprimer le chapitre"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
