import { NextResponse } from "next/server";
import { normalizeScoreMap, scoreMapToEntries } from "@/lib/classroom-data";
import { getClassroomDb } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

type ClassroomDocument = {
  _id: string;
  scores?: unknown;
  updatedAt?: Date;
};

function documentId(courseId: string) {
  return `course:${courseId}:scores`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  try {
    const db = await getClassroomDb();
    const document = await db
      .collection<ClassroomDocument>("classroom")
      .findOne({ _id: documentId(courseId) });

    return NextResponse.json({
      scores: scoreMapToEntries(normalizeScoreMap(document?.scores)),
      mongoConnected: true,
    });
  } catch {
    return NextResponse.json({ scores: [], mongoConnected: false });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  const body = (await request.json()) as { scores?: unknown };
  const scores = scoreMapToEntries(normalizeScoreMap(body.scores));
  try {
    const db = await getClassroomDb();

    await db.collection<ClassroomDocument>("classroom").updateOne(
      { _id: documentId(courseId) },
      {
        $set: {
          scores,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ scores, mongoConnected: true });
  } catch {
    return NextResponse.json(
      { scores, mongoConnected: false },
      { status: 503 },
    );
  }
}
