import CourseDashboardLoader from "./CourseDashboardLoader";

export default async function CourseDashboardPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <CourseDashboardLoader courseId={courseId} />;
}
