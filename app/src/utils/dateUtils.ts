const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: "UTC"
});

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC"
});

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function getWeekdayPtBr(date: string) {
  const parsedDate = parseDateOnly(date);

  if (!parsedDate) {
    return "";
  }

  const weekday = WEEKDAY_FORMATTER.format(parsedDate);
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function formatDatePtBr(date: string) {
  const parsedDate = parseDateOnly(date);

  if (!parsedDate) {
    return "Data não informada";
  }

  return DATE_FORMATTER.format(parsedDate);
}

export function calculateDurationInDays(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end || end < start) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 86_400_000) + 1;
}

export function enumerateDateRange(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end || end < start) {
    return [];
  }

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function rangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) {
  return firstStart <= secondEnd && secondStart <= firstEnd;
}

export type EventTemporalStatus = "upcoming" | "ongoing" | "past";

export function getEventTemporalStatus(
  eventStartDate: string,
  eventEndDate: string,
  today = getTodayDateOnly()
): EventTemporalStatus {
  if (eventStartDate > today) {
    return "upcoming";
  }

  if (eventEndDate < today) {
    return "past";
  }

  return "ongoing";
}

export function getTodayDateOnly() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateBeforeToday(date: string, today = getTodayDateOnly()) {
  return date < today;
}

export function canStatusUsePastDate(status: string) {
  return status === "completed" || status === "canceled" || status === "cancelled";
}

export function validateEventDateByStatus(
  status: string,
  eventStartDate: string,
  eventEndDate: string,
  today = getTodayDateOnly()
) {
  if (!eventStartDate || !eventEndDate || eventEndDate < eventStartDate) {
    return null;
  }

  if (isDateBeforeToday(eventEndDate, today)) {
    if (status === "negotiating") {
      return "Um evento em negociação não pode ser cadastrado com data já passada.";
    }

    if (!canStatusUsePastDate(status)) {
      return "Eventos em negociação, rascunho ou confirmados não podem ter data final anterior à data de hoje.";
    }
  }

  if (
    status === "in_progress" &&
    (eventStartDate > today || eventEndDate < today)
  ) {
    return "Eventos em andamento precisam estar dentro do período atual do evento.";
  }

  return null;
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

export function eventOverlapsMonth(
  eventStartDate: string,
  eventEndDate: string,
  year: number,
  month: number
) {
  const monthRange = getMonthRange(year, month);
  return rangesOverlap(
    eventStartDate,
    eventEndDate,
    monthRange.startDate,
    monthRange.endDate
  );
}

export function getMonthLabelPtBr(year: number, month: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatEventPeriod(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return `Data do evento: ${formatDatePtBr(startDate)}`;
  }

  return `Período do evento: ${formatDatePtBr(startDate)} até ${formatDatePtBr(
    endDate
  )}`;
}
