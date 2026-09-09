import { NextResponse } from "next/server";
import { getClassroomDb } from "@/lib/mongodb";
import { normalizeCourses } from "@/lib/classroom-data";

const DOCUMENT_ID = "courses";
type ClassroomDocument = {
  _id: string;
  courses?: unknown;
  updatedAt?: Date;
};

export async function GET() {
  try {
    const db = await getClassroomDb();
    const document = await db
      .collection<ClassroomDocument>("classroom")
      .findOne({ _id: DOCUMENT_ID });

    return NextResponse.json({
      courses: normalizeCourses(document?.courses),
      mongoConnected: true,
    });
  } catch {
    return NextResponse.json({
      courses: normalizeCourses(undefined),
      mongoConnected: false,
    });
  }
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { courses?: unknown };
  const courses = normalizeCourses(body.courses);

  try {
    const db = await getClassroomDb();

    await db.collection<ClassroomDocument>("classroom").updateOne(
      { _id: DOCUMENT_ID },
      {
        $set: {
          courses,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ courses, mongoConnected: true });
  } catch {
    return NextResponse.json(
      { courses, mongoConnected: false },
      { status: 503 },
    );
  }
}
