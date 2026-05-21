import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { toast } from "react-hot-toast";
import {
  ShieldAlert,
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { syncData, theme } = useAppStore();
  const isDark = theme === "dark";

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      toast.error(
        "Supabase n'est pas configuré. Veuillez utiliser le mode local.",
      );
      return;
    }

    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success(
          "Compte créé avec succès ! Un e-mail de confirmation vous a été envoyé.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Connexion réussie !");
        // Trigger sync
        await syncData();
        navigate("/");
      }
    } catch (error) {
      toast.error(
        error.message || "Une erreur est survenue lors de l authentification.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    toast.success(
      "Bienvenue en Mode Local ! Vos données seront sauvegardées sur cet appareil.",
    );
    navigate("/");
  };

  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.05em] block ${
    isDark ? "text-zinc-500" : "text-slate-400"
  }`;

  const inputClass = `w-full rounded-xl py-3 pl-11 pr-4 text-[13px] outline-none transition-colors duration-250 ${
    isDark
      ? "bg-white/[0.03] border border-zinc-800 text-zinc-200 focus:border-indigo-500 placeholder:text-zinc-600"
      : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400"
  }`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4 animate-fade-in">
      <div className="w-full max-w-md card p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <h2
              className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {isSignUp ? "Créer un compte" : "Se connecter"}
            </h2>
            <p
              className={`text-[13px] ${isDark ? "text-zinc-400" : "text-slate-500"}`}
            >
              {isSignUp
                ? "Rejoignez-nous pour synchroniser vos révisions."
                : "Connectez-vous pour retrouver vos plannings de révision."}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div
              className={`border rounded-2xl p-4 flex gap-3 ${
                isDark
                  ? "bg-amber-500/[0.04] border-amber-500/20 text-zinc-300"
                  : "bg-amber-50/80 border-amber-200 text-slate-700"
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[12px] space-y-1">
                <span className="font-bold text-amber-500 block">
                  Mode Déconnecté Uniquement
                </span>
                <p>
                  Les variables Supabase ne sont pas configurées. L'application
                  enregistre tout sur votre appareil (LocalStorage).
                </p>
              </div>
            </div>
          )}

          {isSupabaseConfigured ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Adresse Email</label>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="etudiant@universite.fr"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Mot de passe</label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? "text-zinc-500" : "text-slate-400"}`}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] transition-all text-[13px] mt-6 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-[18px] h-[18px]" />
                    Créer mon compte
                  </>
                ) : (
                  <>
                    <LogIn className="w-[18px] h-[18px]" />
                    Se connecter
                  </>
                )}
              </button>
            </form>
          ) : null}

          {isSupabaseConfigured && (
            <div className="text-center pt-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className={`text-[12px] transition-colors underline underline-offset-4 ${isDark ? "text-zinc-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
              >
                {isSignUp
                  ? "Déjà un compte ? Connectez-vous"
                  : "Pas de compte ? Inscrivez-vous gratuitement"}
              </button>
            </div>
          )}

          <div className="relative flex items-center justify-center my-4">
            <div
              className={`border-t w-full ${isDark ? "border-zinc-800" : "border-slate-200"}`}
            ></div>
            <span
              className={`px-3 text-[10px] font-bold uppercase tracking-widest absolute ${
                isDark
                  ? "bg-[#111113] text-zinc-600"
                  : "bg-white text-slate-400"
              }`}
            >
              OU
            </span>
          </div>

          <button
            onClick={handleGuestMode}
            className={`w-full font-semibold py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all text-[13px] cursor-pointer ${
              isDark
                ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-800/80"
                : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200"
            }`}
          >
            Continuer en Mode Local
            <ArrowRight
              className={`w-4 h-4 ${isDark ? "text-zinc-500" : "text-slate-400"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
