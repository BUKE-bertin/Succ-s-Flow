import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "../services/supabase";

// Helper to generate UUIDs locally when offline
const generateUUID = () => {
  return (
    "local_" +
    Math.random().toString(36).substr(2, 9) +
    "_" +
    Date.now().toString(36)
  );
};

export const useAppStore = create()(
  persist(
    (set, get) => ({
      // Initial state
      subjects: [],
      chapters: [],
      studySessions: [],
      examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 14 jours d'ici
      dailyStudyGoal: 120, // 2 heures par jour
      theme: "light", // light | dark

      user: null,
      isSyncing: false,
      isOffline: !isSupabaseConfigured,

      // Handle user session changes
      setSession: async (session) => {
        const user = session?.user || null;
        set({ user, isOffline: !isSupabaseConfigured || !navigator.onLine });
        if (user) {
          await get().syncData();
        }
      },

      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({
          user: null,
          // We keep local data as fallback
        });
      },

      // Sync local data with Supabase (merge)
      syncData: async () => {
        const { user, subjects, examDate, dailyStudyGoal } = get();
        if (!user || !supabase) return;

        set({ isSyncing: true });

        try {
          // 1. Sync User Profile (exam date & goal)
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileErr && profileErr.code === "PGRST116") {
            // Profile doesn't exist, create it with local data
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email,
              exam_date: examDate,
              daily_study_goal: dailyStudyGoal,
            });
          } else if (profile) {
            // Profile exists, load from cloud, or update if local is newer
            set({
              examDate: profile.exam_date,
              dailyStudyGoal: profile.daily_study_goal,
            });
          }

          // 2. Fetch and merge Subjects
          const localSubjects = [...subjects];

          // Push local subjects that aren't on the cloud (id starts with 'local_')
          const localOnlySubjects = localSubjects.filter((s) =>
            s.id.startsWith("local_"),
          );
          for (const sub of localOnlySubjects) {
            const cleanSub = {
              name: sub.name,
              color: sub.color,
              priority: sub.priority,
              user_id: user.id,
            };
            const { data: insertedSub } = await supabase
              .from("subjects")
              .insert(cleanSub)
              .select()
              .single();
            if (insertedSub) {
              // Update local chapters that referenced this local subject ID
              const updatedChapters = get().chapters.map((c) =>
                c.subject_id === sub.id
                  ? { ...c, subject_id: insertedSub.id }
                  : c,
              );
              // Update local sessions
              const updatedSessions = get().studySessions.map((s) =>
                s.subject_id === sub.id
                  ? { ...s, subject_id: insertedSub.id }
                  : s,
              );
              set({
                chapters: updatedChapters,
                studySessions: updatedSessions,
              });
              // Replace local subject ID with the new cloud ID
              sub.id = insertedSub.id;
            }
          }

          // Pull all subjects after inserts
          const { data: finalCloudSubjects } = await supabase
            .from("subjects")
            .select("*")
            .eq("user_id", user.id);

          if (finalCloudSubjects) {
            set({ subjects: finalCloudSubjects });
          }

          // 3. Fetch and merge Chapters
          const localChapters = [...get().chapters];
          const localOnlyChapters = localChapters.filter((c) =>
            c.id.startsWith("local_"),
          );
          for (const chap of localOnlyChapters) {
            // Find its possibly updated subject id (if it was local)
            const cleanChap = {
              subject_id: chap.subject_id,
              user_id: user.id,
              name: chap.name,
              difficulty: chap.difficulty,
              estimated_duration: chap.estimated_duration,
              completed: chap.completed,
            };
            const { data: insertedChap } = await supabase
              .from("chapters")
              .insert(cleanChap)
              .select()
              .single();
            if (insertedChap) {
              // Update local sessions referencing this chapter
              const updatedSessions = get().studySessions.map((s) =>
                s.chapter_id === chap.id
                  ? { ...s, chapter_id: insertedChap.id }
                  : s,
              );
              set({ studySessions: updatedSessions });
              chap.id = insertedChap.id;
            }
          }

          const { data: finalCloudChapters } = await supabase
            .from("chapters")
            .select("*")
            .eq("user_id", user.id);

          if (finalCloudChapters) {
            set({ chapters: finalCloudChapters });
          }

          // 4. Fetch and merge Study Sessions
          const localSessions = [...get().studySessions];
          const localOnlySessions = localSessions.filter((s) =>
            s.id.startsWith("local_"),
          );

          for (const sess of localOnlySessions) {
            const cleanSess = {
              user_id: user.id,
              chapter_id: sess.chapter_id?.startsWith("local_")
                ? null
                : sess.chapter_id,
              subject_id: sess.subject_id?.startsWith("local_")
                ? null
                : sess.subject_id,
              duration: sess.duration,
              completed_at: sess.completed_at,
            };
            await supabase.from("study_sessions").insert(cleanSess);
          }

          const { data: finalCloudSessions } = await supabase
            .from("study_sessions")
            .select("*")
            .eq("user_id", user.id);

          if (finalCloudSessions) {
            set({
              studySessions: finalCloudSessions.map((s) => ({
                id: s.id,
                chapter_id: s.chapter_id,
                subject_id: s.subject_id,
                duration: s.duration,
                completed_at: s.completed_at,
              })),
            });
          }

          set({ isOffline: false });
        } catch (error) {
          console.error("Error synchronizing data with Supabase:", error);
          set({ isOffline: true });
        } finally {
          set({ isSyncing: false });
        }
      },

      // Subject Actions
      addSubject: async (subjectData) => {
        const { user, subjects } = get();
        const localId = generateUUID();
        const newSubject = { id: localId, ...subjectData };

        // Optimistic UI update
        set({ subjects: [...subjects, newSubject] });

        if (user && supabase) {
          try {
            const { data, error } = await supabase
              .from("subjects")
              .insert({ ...subjectData, user_id: user.id })
              .select()
              .single();
            if (error) throw error;
            if (data) {
              // Update local state with the actual database ID
              set({
                subjects: get().subjects.map((s) =>
                  s.id === localId ? data : s,
                ),
              });
            }
          } catch (e) {
            console.error("Supabase insert failed. Kept locally.", e);
          }
        }
      },

      updateSubject: async (id, updatedFields) => {
        const { user, subjects } = get();
        // Local update
        set({
          subjects: subjects.map((s) =>
            s.id === id ? { ...s, ...updatedFields } : s,
          ),
        });

        if (user && supabase && !id.startsWith("local_")) {
          try {
            const { error } = await supabase
              .from("subjects")
              .update(updatedFields)
              .eq("id", id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase update failed.", e);
          }
        }
      },

      deleteSubject: async (id) => {
        const { user, subjects, chapters, studySessions } = get();

        // Local deletion + cascade logic
        set({
          subjects: subjects.filter((s) => s.id !== id),
          chapters: chapters.filter((c) => c.subject_id !== id),
          studySessions: studySessions.filter((s) => s.subject_id !== id),
        });

        if (user && supabase && !id.startsWith("local_")) {
          try {
            const { error } = await supabase
              .from("subjects")
              .delete()
              .eq("id", id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase deletion failed.", e);
          }
        }
      },

      // Chapter Actions
      addChapter: async (chapterData) => {
        const { user, chapters } = get();
        const localId = generateUUID();
        const newChapter = { id: localId, completed: false, ...chapterData };

        set({ chapters: [...chapters, newChapter] });

        if (user && supabase) {
          try {
            const { data, error } = await supabase
              .from("chapters")
              .insert({ ...chapterData, completed: false, user_id: user.id })
              .select()
              .single();
            if (error) throw error;
            if (data) {
              set({
                chapters: get().chapters.map((c) =>
                  c.id === localId ? data : c,
                ),
              });
            }
          } catch (e) {
            console.error("Supabase insert failed. Kept locally.", e);
          }
        }
      },

      updateChapter: async (id, updatedFields) => {
        const { user, chapters } = get();
        set({
          chapters: chapters.map((c) =>
            c.id === id ? { ...c, ...updatedFields } : c,
          ),
        });

        if (user && supabase && !id.startsWith("local_")) {
          try {
            const { error } = await supabase
              .from("chapters")
              .update(updatedFields)
              .eq("id", id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase update failed.", e);
          }
        }
      },

      toggleChapterCompleted: async (id) => {
        const { user, chapters } = get();
        const chapter = chapters.find((c) => c.id === id);
        if (!chapter) return;

        const nextCompleted = !chapter.completed;
        // Update local state
        set({
          chapters: chapters.map((c) =>
            c.id === id ? { ...c, completed: nextCompleted } : c,
          ),
        });

        // Add to study sessions if completed (as a quick log)
        if (nextCompleted) {
          await get().addStudySession({
            chapter_id: id,
            subject_id: chapter.subject_id,
            duration: chapter.estimated_duration, // Auto-log the estimated time
          });
        }

        if (user && supabase && !id.startsWith("local_")) {
          try {
            const { error } = await supabase
              .from("chapters")
              .update({ completed: nextCompleted })
              .eq("id", id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase update failed.", e);
          }
        }
      },

      deleteChapter: async (id) => {
        const { user, chapters, studySessions } = get();

        set({
          chapters: chapters.filter((c) => c.id !== id),
          studySessions: studySessions.filter((s) => s.chapter_id !== id),
        });

        if (user && supabase && !id.startsWith("local_")) {
          try {
            const { error } = await supabase
              .from("chapters")
              .delete()
              .eq("id", id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase deletion failed.", e);
          }
        }
      },

      // Study Session Actions
      addStudySession: async (sessionData) => {
        const { user, studySessions } = get();
        const localId = generateUUID();
        const completedAt = new Date().toISOString();
        const newSession = {
          id: localId,
          completed_at: completedAt,
          ...sessionData,
        };

        set({ studySessions: [newSession, ...studySessions] });

        if (user && supabase) {
          try {
            const { data, error } = await supabase
              .from("study_sessions")
              .insert({
                user_id: user.id,
                chapter_id: sessionData.chapter_id?.startsWith("local_")
                  ? null
                  : sessionData.chapter_id,
                subject_id: sessionData.subject_id?.startsWith("local_")
                  ? null
                  : sessionData.subject_id,
                duration: sessionData.duration,
                completed_at: completedAt,
              })
              .select()
              .single();
            if (error) throw error;
            if (data) {
              set({
                studySessions: get().studySessions.map((s) =>
                  s.id === localId
                    ? {
                        id: data.id,
                        chapter_id: data.chapter_id,
                        subject_id: data.subject_id,
                        duration: data.duration,
                        completed_at: data.completed_at,
                      }
                    : s,
                ),
              });
            }
          } catch (e) {
            console.error("Supabase insert failed. Kept locally.", e);
          }
        }
      },

      deleteStudySession: async (id) => {
        const { user, studySessions } = get();

        set({
          studySessions: studySessions.filter((s) => s.id !== id),
        });

        if (user && supabase && !id.startsWith("local_")) {
          try {
            const { error } = await supabase
              .from("study_sessions")
              .delete()
              .eq("id", id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase deletion failed.", e);
          }
        }
      },

      // Settings Actions
      updateSettings: async (settings) => {
        const { user } = get();
        set((state) => ({
          examDate:
            settings.examDate !== undefined
              ? settings.examDate
              : state.examDate,
          dailyStudyGoal:
            settings.dailyStudyGoal !== undefined
              ? settings.dailyStudyGoal
              : state.dailyStudyGoal,
        }));

        if (user && supabase) {
          try {
            const updates = {};
            if (settings.examDate !== undefined)
              updates.exam_date = settings.examDate;
            if (settings.dailyStudyGoal !== undefined)
              updates.daily_study_goal = settings.dailyStudyGoal;

            const { error } = await supabase
              .from("profiles")
              .update(updates)
              .eq("id", user.id);
            if (error) throw error;
          } catch (e) {
            console.error("Supabase profile update failed.", e);
          }
        }
      },

      // Theme toggle action
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        }));
      },
    }),
    {
      name: "exam-revision-storage",
      partialize: (state) => ({
        subjects: state.subjects,
        chapters: state.chapters,
        studySessions: state.studySessions,
        examDate: state.examDate,
        dailyStudyGoal: state.dailyStudyGoal,
        theme: state.theme,
      }), // only persist main user data locally
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          subjects: Array.isArray(persistedState.subjects)
            ? persistedState.subjects
            : [],
          chapters: Array.isArray(persistedState.chapters)
            ? persistedState.chapters
            : [],
          studySessions: Array.isArray(persistedState.studySessions)
            ? persistedState.studySessions
            : [],
          examDate:
            persistedState.examDate &&
            !isNaN(new Date(persistedState.examDate).getTime())
              ? persistedState.examDate
              : currentState.examDate,
          dailyStudyGoal:
            typeof persistedState.dailyStudyGoal === "number" &&
            persistedState.dailyStudyGoal > 0
              ? persistedState.dailyStudyGoal
              : currentState.dailyStudyGoal,
          theme: ["light", "dark"].includes(persistedState.theme)
            ? persistedState.theme
            : currentState.theme,
        };
      },
    },
  ),
);
