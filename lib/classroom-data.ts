export type Student = {
  id: string;
  name: string;
};

export type ScoreEntry = {
  studentId: string;
  score: number;
};

export type Question = {
  id: string;
  prompt: string;
  answer: string;
  points: number;
};

export const STUDENTS_STORAGE_KEY = "classroom-tools:students";
export const SCORES_STORAGE_KEY = "classroom-tools:scores";
export const QUESTIONS_STORAGE_KEY = "classroom-tools:questions";

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeStudents(value: unknown): Student[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((student) => {
      if (typeof student === "string") {
        return {
          id: createId(),
          name: student.trim(),
        };
      }

      if (
        student &&
        typeof student === "object" &&
        "name" in student &&
        typeof student.name === "string"
      ) {
        return {
          id:
            "id" in student && typeof student.id === "string"
              ? student.id
              : createId(),
          name: student.name.trim(),
        };
      }

      return null;
    })
    .filter((student): student is Student => Boolean(student?.name));
}

export function loadStudents() {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = window.localStorage.getItem(STUDENTS_STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    return normalizeStudents(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem(STUDENTS_STORAGE_KEY);
    return [];
  }
}

export function saveStudents(students: Student[]) {
  window.localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
}

export function loadScoreMap() {
  if (typeof window === "undefined") {
    return new Map<string, number>();
  }

  const saved = window.localStorage.getItem(SCORES_STORAGE_KEY);
  if (!saved) {
    return new Map<string, number>();
  }

  try {
    const parsed = JSON.parse(saved) as ScoreEntry[];
    if (!Array.isArray(parsed)) {
      return new Map<string, number>();
    }

    return new Map(
      parsed
        .filter(
          (entry) =>
            entry &&
            typeof entry.studentId === "string" &&
            typeof entry.score === "number",
        )
        .map((entry) => [entry.studentId, entry.score]),
    );
  } catch {
    window.localStorage.removeItem(SCORES_STORAGE_KEY);
    return new Map<string, number>();
  }
}

export function saveScoreMap(scoreMap: Map<string, number>) {
  const scores = Array.from(scoreMap, ([studentId, score]) => ({
    studentId,
    score,
  }));

  window.localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(scores));
}

export function normalizeQuestions(value: unknown): Question[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((question) => {
      if (
        question &&
        typeof question === "object" &&
        "prompt" in question &&
        typeof question.prompt === "string"
      ) {
        return {
          id:
            "id" in question && typeof question.id === "string"
              ? question.id
              : createId(),
          prompt: question.prompt.trim(),
          answer:
            "answer" in question && typeof question.answer === "string"
              ? question.answer.trim()
              : "",
          points:
            "points" in question && typeof question.points === "number"
              ? Math.max(0, Math.round(question.points))
              : 1,
        };
      }

      return null;
    })
    .filter((question): question is Question => Boolean(question?.prompt));
}

export function loadQuestions() {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = window.localStorage.getItem(QUESTIONS_STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    return normalizeQuestions(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem(QUESTIONS_STORAGE_KEY);
    return [];
  }
}

export function saveQuestions(questions: Question[]) {
  window.localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
}
