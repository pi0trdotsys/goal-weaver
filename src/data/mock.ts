import type { AppData } from "@/types/goals";
import { todayISO } from "@/lib/goals";

/**
 * Dane przykładowe dla makiet. Podmiana na prawdziwe źródło = jedna warstwa
 * (patrz docs/kontrakty.md).
 */

function shift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

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
      startDate: shift(-318),
      targetDate: shift(47),
      progress: 74,
      isPrimary: true,
      milestones: [
        { id: "ms_1", goalId: "goal_pracownia", title: "Znaleźć lokal", done: true, dueDate: shift(-60) },
        { id: "ms_2", goalId: "goal_pracownia", title: "Podpisać umowę najmu", done: true, dueDate: shift(-30) },
        { id: "ms_3", goalId: "goal_pracownia", title: "Wyposażyć warsztat", done: false, dueDate: shift(20) },
        { id: "ms_4", goalId: "goal_pracownia", title: "Dzień otwarty", done: false, dueDate: shift(47) },
      ],
    },
    {
      id: "goal_ksiazka",
      title: 'Zakończyć książkę "Pracownia"',
      why: "Chcę zamknąć temat, nad którym siedzę od dwóch lat.",
      horizon: "3m",
      startDate: shift(-40),
      targetDate: shift(52),
      progress: 62,
      isPrimary: false,
      milestones: [
        { id: "ms_5", goalId: "goal_ksiazka", title: "Rozdział 7", done: true, dueDate: shift(-10) },
        { id: "ms_6", goalId: "goal_ksiazka", title: "Redakcja całości", done: false, dueDate: shift(40) },
      ],
    },
    {
      id: "goal_kaucja",
      title: "Oszczędności na kaucję",
      why: "Bufor, dzięki któremu nie będę podejmował decyzji ze strachu.",
      horizon: "6m",
      startDate: shift(-70),
      targetDate: shift(110),
      progress: 41,
      isPrimary: false,
      milestones: [
        { id: "ms_7", goalId: "goal_kaucja", title: "Pierwsze 10 tys.", done: true, dueDate: shift(-20) },
        { id: "ms_8", goalId: "goal_kaucja", title: "Drugie 10 tys.", done: false, dueDate: shift(90) },
      ],
    },
    {
      id: "goal_zdrowie",
      title: "Forma na całe życie",
      why: "Chcę mieć siłę na pracownię i na to, co po niej.",
      horizon: "2y",
      startDate: shift(-120),
      targetDate: shift(610),
      progress: 15,
      isPrimary: false,
      milestones: [
        { id: "ms_9", goalId: "goal_zdrowie", title: "Bieg 10 km bez pauz", done: false, dueDate: shift(120) },
      ],
    },
  ],
  entries: [
    { id: "e_1", date: shift(-1), goalId: "goal_pracownia", answer: "yes", note: "Zamówiłem stół roboczy." },
    { id: "e_2", date: shift(-2), goalId: "goal_pracownia", answer: "partly", note: "Tylko telefon w sprawie prądu." },
    { id: "e_3", date: shift(-3), goalId: "goal_pracownia", answer: "yes", note: "Pomiary pomieszczenia." },
    { id: "e_4", date: shift(-4), goalId: "goal_ksiazka", answer: "yes", note: "Dwie strony rozdziału ósmego." },
    { id: "e_5", date: shift(-5), goalId: "goal_pracownia", answer: "no", note: "Dzień zjadły sprawy urzędowe." },
    { id: "e_6", date: shift(-6), goalId: "goal_pracownia", answer: "yes", note: "Rozmowa z elektrykiem." },
    { id: "e_7", date: shift(-7), goalId: "goal_kaucja", answer: "yes", note: "Przelew na konto oszczędnościowe." },
  ],
};
