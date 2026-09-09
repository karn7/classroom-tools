import { NextResponse } from "next/server";
import { normalizeQuestions } from "@/lib/classroom-data";
import { getClassroomDb } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

type ClassroomDocument = {
  _id: string;
  questions?: unknown;
  updatedAt?: Date;
};

function documentId(courseId: string) {
  return `course:${courseId}:questions`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  try {
    const db = await getClassroomDb();
    const document = await db
      .collection<ClassroomDocument>("classroom")
      .findOne({ _id: documentId(courseId) });

    return NextResponse.json({
      questions: normalizeQuestions(document?.questions),
      mongoConnected: true,
    });
  } catch {
    return NextResponse.json({ questions: [], mongoConnected: false });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  const body = (await request.json()) as { questions?: unknown };
  const questions = normalizeQuestions(body.questions);
  try {
    const db = await getClassroomDb();

    await db.collection<ClassroomDocument>("classroom").updateOne(
      { _id: documentId(courseId) },
      {
        $set: {
          questions,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ questions, mongoConnected: true });
  } catch {
    return NextResponse.json(
      { questions, mongoConnected: false },
      { status: 503 },
    );
  }
}
