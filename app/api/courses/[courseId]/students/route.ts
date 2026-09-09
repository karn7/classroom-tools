import { NextResponse } from "next/server";
import { normalizeStudents } from "@/lib/classroom-data";
import { getClassroomDb } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

type ClassroomDocument = {
  _id: string;
  students?: unknown;
  updatedAt?: Date;
};

function documentId(courseId: string) {
  return `course:${courseId}:students`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  try {
    const db = await getClassroomDb();
    const document = await db
      .collection<ClassroomDocument>("classroom")
      .findOne({ _id: documentId(courseId) });

    return NextResponse.json({
      students: normalizeStudents(document?.students),
      mongoConnected: true,
    });
  } catch {
    return NextResponse.json({ students: [], mongoConnected: false });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  const body = (await request.json()) as { students?: unknown };
  const students = normalizeStudents(body.students);
  try {
    const db = await getClassroomDb();

    await db.collection<ClassroomDocument>("classroom").updateOne(
      { _id: documentId(courseId) },
      {
        $set: {
          students,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ students, mongoConnected: true });
  } catch {
    return NextResponse.json(
      { students, mongoConnected: false },
      { status: 503 },
    );
  }
}
