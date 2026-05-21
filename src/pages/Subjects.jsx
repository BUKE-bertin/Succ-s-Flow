import React, { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const PRESETS_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#0ea5e9", // Sky
  "#f43f5e", // Rose
];

export const Subjects = () => {
  const {
    subjects,
    chapters,
    addSubject,
    updateSubject,
    deleteSubject,
    theme,
  } = useAppStore();
  const isDark = theme === "dark";

  // Form State
  const [isEditing, setIsEditing] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESETS_COLORS[0]);
  const [priority, setPriority] = useState("medium");

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Veuillez entrer un nom de matière.");
      return;
    }

    try {
      if (isEditing) {
        await updateSubject(isEditing, { name, color, priority });
        toast.success("Matière mise à jour !");
        setIsEditing(null);
      } else {
        await addSubject({ name, color, priority });
        toast.success("Matière ajoutée avec succès !");
      }

      // Reset form
      setName("");
      setColor(PRESETS_COLORS[0]);
      setPriority("medium");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  // Start editing a subject
  const startEdit = (sub) => {
    setIsEditing(sub.id);
    setName(sub.name);
    setColor(sub.color);
    setPriority(sub.priority);
  };

  // Cancel edit
  const cancelEdit = () => {
    setIsEditing(null);
    setName("");
    setColor(PRESETS_COLORS[0]);
    setPriority("medium");
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `Voulez-vous vraiment supprimer "${name}" ? Cela supprimera également tous ses chapitres liés.`,
      )
    ) {
      await deleteSubject(id);
      toast.success("Matière supprimée.");
    }
  };

  // Shared Styles
  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] mb-1.5 block ${
    isDark ? "text-zinc-500" : "text-slate-500"
  }`;

  const inputClass = `w-full rounded-xl px-4 py-3 text-[13px] outline-none transition-colors duration-250 ${
    isDark
      ? "bg-white/[0.03] border border-zinc-800 text-zinc-200 focus:border-indigo-500 placeholder:text-zinc-600"
      : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400"
  }`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1
          className={`text-[24px] md:text-[28px] font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Gestion des Matières
        </h1>
        <p
          className={`text-[13px] mt-1 ${isDark ? "text-zinc-400" : "text-slate-500"}`}
        >
          Ajoutez et configurez vos matières d'examens.
        </p>
      </div>

      {/* Main Grid: Form and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Card */}
        <div className="card p-6 h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <h2
              className={`text-[15px] font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <FolderPlus className="w-[18px] h-[18px] text-indigo-500" />
              {isEditing ? "Modifier la matière" : "Nouvelle matière"}
            </h2>

            {/* Input Name */}
            <div>
              <label className={labelClass}>Nom de la matière</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mathématiques, Algorithmique..."
                className={inputClass}
                maxLength={40}
              />
            </div>

            {/* Priority Selector */}
            <div>
              <label className={labelClass}>Priorité de révision</label>
              <div className="grid grid-cols-3 gap-2">
                {["low", "medium", "high"].map((p) => {
                  const isActive = priority === p;
                  let activeClass = "";
                  if (isActive) {
                    activeClass =
                      p === "high"
                        ? "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 shadow-[0_2px_8px_rgba(239,68,68,0.15)]"
                        : p === "medium"
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                          : isDark
                            ? "bg-white/[0.08] border-zinc-600 text-zinc-200"
                            : "bg-slate-100 border-slate-300 text-slate-700";
                  } else {
                    activeClass = isDark
                      ? "bg-transparent border-zinc-800 text-zinc-500 hover:bg-white/[0.02]"
                      : "bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50";
                  }

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2.5 rounded-xl text-[12px] font-semibold border capitalize transition-all duration-200 cursor-pointer ${activeClass}`}
                    >
                      {p === "low"
                        ? "Basse"
                        : p === "medium"
                          ? "Moyenne"
                          : "Haute"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette Selector */}
            <div>
              <label className={labelClass}>Couleur associée</label>
              <div className="flex flex-wrap gap-2.5">
                {PRESETS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all duration-250 relative shrink-0 cursor-pointer ${
                      color === c
                        ? "scale-110 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </span>
                    )}
                  </button>
                ))}
                {/* Advanced Color Picker */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed ${isDark ? "border-zinc-700 hover:border-zinc-500" : "border-slate-300 hover:border-slate-400"} transition-colors relative overflow-hidden`}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
                    title="Couleur personnalisée"
                  />

                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex gap-2 pt-3">
              <button
                type="submit"
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl text-[13px] transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)]"
              >
                {isEditing ? "Mettre à jour" : "Ajouter"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className={`p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
                    isDark
                      ? "bg-white/[0.04] hover:bg-white/[0.08] border-zinc-800 text-zinc-300"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                  title="Annuler"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Subjects List Grid */}
        <div className="lg:col-span-2 space-y-4">
          {subjects.length === 0 ? (
            <div
              className={`h-[300px] flex flex-col items-center justify-center border border-dashed rounded-3xl gap-3 ${
                isDark
                  ? "text-zinc-500 border-zinc-800/60 bg-white/[0.01]"
                  : "text-slate-400 border-slate-200 bg-slate-50/50"
              }`}
            >
              <AlertTriangle
                className={`w-8 h-8 ${isDark ? "text-zinc-700" : "text-slate-300"}`}
              />
              <p className="text-[14px] font-medium">
                Aucune matière enregistrée.
              </p>
              <p className="text-[12px]">
                Remplissez le formulaire à gauche pour commencer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub) => {
                // Calculate stats
                const subChapters = chapters.filter(
                  (c) => c.subject_id === sub.id,
                );
                const totalChaptersCount = subChapters.length;
                const completedChaptersCount = subChapters.filter(
                  (c) => c.completed,
                ).length;
                const progress =
                  totalChaptersCount > 0
                    ? Math.round(
                        (completedChaptersCount / totalChaptersCount) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={sub.id}
                    className="card p-5 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: sub.color }}
                          ></div>
                          <h3
                            className={`font-bold text-[15px] truncate ${isDark ? "text-white" : "text-slate-900"}`}
                            title={sub.name}
                          >
                            {sub.name}
                          </h3>
                        </div>
                        <div
                          className={`flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                        >
                          <button
                            onClick={() => startEdit(sub)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-white/[0.08]" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"}`}
                            title="Modifier"
                          >
                            <Edit2 className="w-[14px] h-[14px]" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-red-400 hover:bg-white/[0.08]" : "text-slate-400 hover:text-red-500 hover:bg-slate-100"}`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-[14px] h-[14px]" />
                          </button>
                        </div>
                      </div>

                      {/* Priority Info */}
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.priority === "high"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : sub.priority === "medium"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : isDark
                                  ? "bg-white/[0.06] text-zinc-400"
                                  : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          Priorité{" "}
                          {sub.priority === "low"
                            ? "Basse"
                            : sub.priority === "medium"
                              ? "Moyenne"
                              : "Haute"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Chapters Info */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-zinc-500" : "text-slate-500"}`}
                        >
                          Chapitres
                        </span>
                        <span
                          className={`text-[12px] font-bold tabular-nums ${isDark ? "text-zinc-300" : "text-slate-700"}`}
                        >
                          {completedChaptersCount} / {totalChaptersCount}{" "}
                          <span
                            className={
                              isDark
                                ? "text-zinc-500"
                                : "text-slate-400 font-normal"
                            }
                          >
                            ({progress}%)
                          </span>
                        </span>
                      </div>
                      <div
                        className={`w-full h-[6px] rounded-full overflow-hidden ${isDark ? "bg-zinc-800/60" : "bg-slate-100"}`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            backgroundColor: sub.color,
                            width: `${progress}%`,
                          }}
                        ></div>
                      </div>
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
};
