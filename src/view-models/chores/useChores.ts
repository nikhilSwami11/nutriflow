"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addChore, isDue, markChore, type Chore, type ChoreDraft, type Repeat } from "@/domain/chores";
import { toDateKey } from "@/domain/nutrition";
import { useChoreDeps } from "./ChoreDeps";

// Presentation cannot import the domain: the type reaches it from here.
export type { Repeat };

const KEY = ["chores"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface ChoreRow {
  id: string;
  title: string;
  /** Plain words for when it repeats, or how late it is. */
  when: string;
  done: boolean;
}

const whenText = (c: Chore, today: string): string => {
  if (c.lastDone === today) return "Done today";
  if (c.repeat === "daily") return "Every day";
  if (c.repeat === "once") return "Once";
  const every = `Every ${DAYS[c.day ?? 0]}`;
  return every;
};

export function useChores() {
  const { repo, newId } = useChoreDeps();
  const qc = useQueryClient();
  // One date per visit, like Home: set on mount in the browser, never at build time.
  const [today] = useState(() => toDateKey(new Date()));
  const chores = useQuery({ queryKey: KEY, queryFn: () => repo.list() });

  const mark = useMutation({
    mutationFn: ({ id, lastDone }: { id: string; lastDone: string | null }) => markChore(repo, id, lastDone),
    onMutate: async ({ id, lastDone }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Chore[]>(KEY);
      qc.setQueryData<Chore[]>(KEY, (xs) => xs?.map((c) => (c.id === id ? { ...c, lastDone } : c)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const add = useMutation({
    mutationFn: (d: ChoreDraft) => addChore({ repo, newId }, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => repo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const all = chores.data ?? [];
  const row = (c: Chore): ChoreRow => ({ id: c.id, title: c.title, when: whenText(c, today), done: !isDue(c, today) });
  const toDo = all.filter((c) => isDue(c, today)).map(row);
  const done = all.filter((c) => !isDue(c, today)).map(row);
  // Today's stories: due, or done today, in list order so a ticked chore keeps its place.
  const todays = all.filter((c) => isDue(c, today) || c.lastDone === today).map(row);

  return {
    isLoading: chores.isLoading,
    toDo,
    done,
    todays,
    /** Set a chore done (or not) for today. */
    setDone: (id: string, done: boolean) => mark.mutate({ id, lastDone: done ? today : null }),
    countText: toDo.length ? `${toDo.length} to do` : all.length ? "All done for now" : "Nothing yet",
    /** Tick a chore for today, or untick it. */
    toggle: (id: string) => mark.mutate({ id, lastDone: toDo.some((c) => c.id === id) ? today : null }),
    /** Weekly chores repeat on the weekday you add them. */
    add: async (title: string, repeat: Repeat) => {
      const chore = await add.mutateAsync({ title, repeat, day: new Date().getDay() });
      return chore !== null;
    },
    remove: (id: string) => remove.mutate(id),
  };
}
