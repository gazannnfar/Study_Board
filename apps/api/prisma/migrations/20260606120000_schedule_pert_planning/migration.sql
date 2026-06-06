-- EduKanban iteration: schedule, PERT estimates, and local planning.
CREATE TYPE "LessonType" AS ENUM ('LECTURE', 'PRACTICE', 'LAB', 'SEMINAR', 'CONSULTATION', 'EXAM', 'OTHER');

CREATE TABLE "ScheduleLesson" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "teacherName" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "lessonType" "LessonType" NOT NULL DEFAULT 'PRACTICE',
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleLesson_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task" ADD COLUMN "pertOptimisticHours" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN "pertMostLikelyHours" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN "pertPessimisticHours" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN "pertExpectedHours" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN "scheduledStart" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "scheduledEnd" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "scheduleLessonId" TEXT;

CREATE INDEX "ScheduleLesson_groupId_startsAt_idx" ON "ScheduleLesson"("groupId", "startsAt");
CREATE INDEX "ScheduleLesson_dayOfWeek_idx" ON "ScheduleLesson"("dayOfWeek");

ALTER TABLE "ScheduleLesson" ADD CONSTRAINT "ScheduleLesson_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_scheduleLessonId_fkey" FOREIGN KEY ("scheduleLessonId") REFERENCES "ScheduleLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
