import { NextResponse } from "next/server";
import { getClassroomDb } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

type ClassroomDocument = {
  _id: string;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  try {
    const db = await getClassroomDb();
    const collection = db.collection<ClassroomDocument>("classroom");

    await collection.deleteMany({
      _id: {
        $in: [
          `course:${courseId}:students`,
          `course:${courseId}:scores`,
          `course:${courseId}:questions`,
        ],
      },
    });

    return NextResponse.json({ ok: true, mongoConnected: true });
  } catch {
    return NextResponse.json({ ok: false, mongoConnected: false }, { status: 503 });
  }
}
