import type { AppData } from "@/types/goals";

/**
 * Dane przykładowe dla makiet. Podmiana na prawdziwe źródło = jedna warstwa
 * (patrz docs/kontrakty.md).
 */

export const mockData: AppData = {
  settings: {
    morningTime: "07:00",
    eveningTime: "21:00",
    notificationsEnabled: true,
    primaryGoalId: "goal_pracownia",
  },
  goals: [
    {
      id: "goal_pracownia",
      title: "Otwarcie własnej pracowni",
      why: "Chcę pracować na swoich warunkach, w miejscu, które sam urządziłem.",
      horizon: "1y",
      startDate: "2025-11-11",
      targetDate: "2026-11-11",
      progress: 74,
      isPrimary: true,
      milestones: [
        { id: "ms_1", goalId: "goal_pracownia", title: "Znaleźć lokal", done: true, dueDate: "2026-07-27" },
        { id: "ms_2", goalId: "goal_pracownia", title: "Podpisać umowę najmu", done: true, dueDate: "2026-08-26" },
        { id: "ms_3", goalId: "goal_pracownia", title: "Wyposażyć warsztat", done: false, dueDate: "2026-10-15" },
        { id: "ms_4", goalId: "goal_pracownia", title: "Dzień otwarty", done: false, dueDate: "2026-11-11" },
      ],
    },
    {
      id: "goal_ksiazka",
      title: 'Zakończyć książkę "Pracownia"',
      why: "Chcę zamknąć temat, nad którym siedzę od dwóch lat.",
      horizon: "3m",
      startDate: "2026-08-16",
      targetDate: "2026-11-16",
      progress: 62,
      isPrimary: false,
      milestones: [
        { id: "ms_5", goalId: "goal_ksiazka", title: "Rozdział 7", done: true, dueDate: "2026-09-15" },
        { id: "ms_6", goalId: "goal_ksiazka", title: "Redakcja całości", done: false, dueDate: "2026-11-04" },
      ],
    },
    {
      id: "goal_kaucja",
      title: "Oszczędności na kaucję",
      why: "Bufor, dzięki któremu nie będę podejmował decyzji ze strachu.",
      horizon: "6m",
      startDate: "2026-07-17",
      targetDate: "2027-01-13",
      progress: 41,
      isPrimary: false,
      milestones: [
        { id: "ms_7", goalId: "goal_kaucja", title: "Pierwsze 10 tys.", done: true, dueDate: "2026-09-05" },
        { id: "ms_8", goalId: "goal_kaucja", title: "Drugie 10 tys.", done: false, dueDate: "2026-12-24" },
      ],
    },
    {
      id: "goal_zdrowie",
      title: "Forma na całe życie",
      why: "Chcę mieć siłę na pracownię i na to, co po niej.",
      horizon: "2y",
      startDate: "2026-05-28",
      targetDate: "2028-05-27",
      progress: 15,
      isPrimary: false,
      milestones: [
        { id: "ms_9", goalId: "goal_zdrowie", title: "Bieg 10 km bez pauz", done: false, dueDate: "2027-01-23" },
      ],
    },
  ],
  entries: [
    { id: "e_1", date: "2026-09-24", goalId: "goal_pracownia", answer: "yes", note: "Zamówiłem stół roboczy." },
    { id: "e_2", date: "2026-09-23", goalId: "goal_pracownia", answer: "partly", note: "Tylko telefon w sprawie prądu." },
    { id: "e_3", date: "2026-09-22", goalId: "goal_pracownia", answer: "yes", note: "Pomiary pomieszczenia." },
    { id: "e_4", date: "2026-09-21", goalId: "goal_ksiazka", answer: "yes", note: "Dwie strony rozdziału ósmego." },
    { id: "e_5", date: "2026-09-20", goalId: "goal_pracownia", answer: "no", note: "Dzień zjadły sprawy urzędowe." },
    { id: "e_6", date: "2026-09-19", goalId: "goal_pracownia", answer: "yes", note: "Rozmowa z elektrykiem." },
    { id: "e_7", date: "2026-09-18", goalId: "goal_kaucja", answer: "yes", note: "Przelew na konto oszczędnościowe." },
  ],
};
