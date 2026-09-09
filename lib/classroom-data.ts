export type Student = {
  id: string;
  name: string;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  password: string;
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
export const COURSES_STORAGE_KEY = "classroom-tools:courses";
export const APP_BACKGROUND_IMAGE = "/classroom.png";

export const DEFAULT_COURSE: Course = {
  id: "bs101",
  code: "BS101",
  title: "Old & New Testament Survey",
  subtitle: "เครื่องมือสำหรับกิจกรรมการเรียนการสอน",
  backgroundImage: "/bs101.png",
  password: "bs101",
};

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createCourseId(code: string) {
  const id = code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return id || createId();
}

function getScopedStorageKey(storageKey: string, courseId?: string) {
  if (!courseId) {
    return storageKey;
  }

  const dataType = storageKey.replace("classroom-tools:", "");
  return `classroom-tools:courses:${courseId}:${dataType}`;
}

function loadStoredValue<T>(
  storageKey: string,
  normalize: (value: unknown) => T,
  fallback: T,
) {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return fallback;
  }

  try {
    return normalize(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

function migrateDefaultCourseValue<T>(
  storageKey: string,
  courseId: string | undefined,
  normalize: (value: unknown) => T,
  isEmpty: (value: T) => boolean,
  serialize: (value: T) => string,
  fallback: T,
) {
  const scopedKey = getScopedStorageKey(storageKey, courseId);
  const scopedValue = loadStoredValue(scopedKey, normalize, fallback);

  if (!courseId || courseId !== DEFAULT_COURSE.id || !isEmpty(scopedValue)) {
    return scopedValue;
  }

  const legacyValue = loadStoredValue(storageKey, normalize, fallback);
  if (isEmpty(legacyValue)) {
    return scopedValue;
  }

  window.localStorage.setItem(scopedKey, serialize(legacyValue));
  return legacyValue;
}

export function normalizeCourses(value: unknown): Course[] {
  if (!Array.isArray(value)) {
    return [DEFAULT_COURSE];
  }

  const courses = value
    .map((course) => {
      if (
        course &&
        typeof course === "object" &&
        "code" in course &&
        typeof course.code === "string"
      ) {
        const code = course.code.trim();
        if (!code) {
          return null;
        }

        return {
          id:
            "id" in course && typeof course.id === "string"
              ? course.id
              : createCourseId(code),
          code,
          title:
            "title" in course && typeof course.title === "string"
              ? course.title.trim() || code
              : code,
          subtitle:
            "subtitle" in course && typeof course.subtitle === "string"
              ? course.subtitle.trim()
              : "เครื่องมือสำหรับกิจกรรมการเรียนการสอน",
          backgroundImage:
            "backgroundImage" in course &&
            typeof course.backgroundImage === "string"
              ? course.backgroundImage.trim() || APP_BACKGROUND_IMAGE
              : APP_BACKGROUND_IMAGE,
          password:
            "password" in course && typeof course.password === "string"
              ? course.password
              : "",
        };
      }

      return null;
    })
    .filter((course): course is Course => Boolean(course));

  return courses.length > 0 ? courses : [DEFAULT_COURSE];
}

export function loadCourses() {
  if (typeof window === "undefined") {
    return [DEFAULT_COURSE];
  }

  const saved = window.localStorage.getItem(COURSES_STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify([DEFAULT_COURSE]),
    );
    return [DEFAULT_COURSE];
  }

  try {
    return normalizeCourses(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem(COURSES_STORAGE_KEY);
    return [DEFAULT_COURSE];
  }
}

export function saveCourses(courses: Course[]) {
  window.localStorage.setItem(
    COURSES_STORAGE_KEY,
    JSON.stringify(normalizeCourses(courses)),
  );
}

export function findCourse(courseId: string) {
  return loadCourses().find((course) => course.id === courseId) ?? null;
}

export function deleteCourseData(courseId: string) {
  window.localStorage.removeItem(getScopedStorageKey(STUDENTS_STORAGE_KEY, courseId));
  window.localStorage.removeItem(getScopedStorageKey(SCORES_STORAGE_KEY, courseId));
  window.localStorage.removeItem(getScopedStorageKey(QUESTIONS_STORAGE_KEY, courseId));
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

export function loadStudents(courseId?: string) {
  if (typeof window === "undefined") {
    return [];
  }

  return migrateDefaultCourseValue(
    STUDENTS_STORAGE_KEY,
    courseId,
    normalizeStudents,
    (students) => students.length === 0,
    (students) => JSON.stringify(students),
    [],
  );
}

export function saveStudents(students: Student[], courseId?: string) {
  window.localStorage.setItem(
    getScopedStorageKey(STUDENTS_STORAGE_KEY, courseId),
    JSON.stringify(students),
  );
}

export function loadScoreMap(courseId?: string) {
  if (typeof window === "undefined") {
    return new Map<string, number>();
  }

  return migrateDefaultCourseValue(
    SCORES_STORAGE_KEY,
    courseId,
    normalizeScoreMap,
    (scoreMap) => scoreMap.size === 0,
    serializeScoreMap,
    new Map<string, number>(),
  );
}

export function saveScoreMap(scoreMap: Map<string, number>, courseId?: string) {
  window.localStorage.setItem(
    getScopedStorageKey(SCORES_STORAGE_KEY, courseId),
    serializeScoreMap(scoreMap),
  );
}

function normalizeScoreMap(value: unknown) {
  if (!Array.isArray(value)) {
    return new Map<string, number>();
  }

  return new Map(
    value
      .filter(
        (entry): entry is ScoreEntry =>
          entry &&
          typeof entry === "object" &&
          "studentId" in entry &&
          typeof entry.studentId === "string" &&
          "score" in entry &&
          typeof entry.score === "number",
      )
      .map((entry) => [entry.studentId, entry.score]),
  );
}

function serializeScoreMap(scoreMap: Map<string, number>) {
  const scores = Array.from(scoreMap, ([studentId, score]) => ({
    studentId,
    score,
  }));

  return JSON.stringify(scores);
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

export function loadQuestions(courseId?: string) {
  if (typeof window === "undefined") {
    return [];
  }

  return migrateDefaultCourseValue(
    QUESTIONS_STORAGE_KEY,
    courseId,
    normalizeQuestions,
    (questions) => questions.length === 0,
    (questions) => JSON.stringify(questions),
    [],
  );
}

export function saveQuestions(questions: Question[], courseId?: string) {
  window.localStorage.setItem(
    getScopedStorageKey(QUESTIONS_STORAGE_KEY, courseId),
    JSON.stringify(questions),
  );
}
