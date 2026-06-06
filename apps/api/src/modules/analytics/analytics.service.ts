import { Prisma, Role, TaskStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { AuthUser } from "../../types/auth.js";
import { canSeeAllGroups } from "../rbac/permissions.js";
import { visibleGroupWhere } from "../rbac/group-scope.js";
import { visibleTaskWhere } from "../tasks/tasks.service.js";

function scopedUserWhere(user: AuthUser, groupId?: string): Prisma.UserWhereInput {
  if (canSeeAllGroups(user.role)) {
    return groupId ? { groupId } : {};
  }

  if (user.role === Role.TEACHER) {
    return groupId ? { groupId, group: { is: { teacherId: user.id } } } : { group: { is: { teacherId: user.id } } };
  }

  return { groupId: user.groupId ?? "__none" };
}

export async function getOverviewAnalytics(user: AuthUser, groupId?: string) {
  const taskWhere: Prisma.TaskWhereInput = {
    AND: [visibleTaskWhere(user), groupId ? { groupId } : {}]
  };

  const [tasks, activeUsers, votes, groups, scheduleLessons] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        status: true,
        deadline: true,
        completedAt: true,
        createdAt: true,
        groupId: true,
        pertExpectedHours: true,
        scheduledStart: true,
        scheduledEnd: true
      }
    }),
    prisma.user.count({
      where: { ...scopedUserWhere(user, groupId), active: true, lastLoginAt: { not: null } }
    }),
    prisma.satisfactionVote.findMany({
      where: { user: { is: scopedUserWhere(user, groupId) } },
      select: { score: true }
    }),
    prisma.group.findMany({
      where: canSeeAllGroups(user.role)
        ? groupId
          ? { id: groupId }
          : {}
        : user.role === Role.TEACHER
          ? groupId
            ? { id: groupId, teacherId: user.id }
            : { teacherId: user.id }
          : { id: user.groupId ?? "__none" },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { users: true, tasks: true } }
      },
      orderBy: { code: "asc" }
    }),
    prisma.scheduleLesson.findMany({
      where: { group: visibleGroupWhere(user, groupId) },
      select: { startsAt: true, endsAt: true, groupId: true, lessonType: true }
    })
  ]);

  const now = new Date();
  const doneTasks = tasks.filter((task) => task.status === TaskStatus.DONE);
  const doneWithDeadline = doneTasks.filter((task) => task.deadline && task.completedAt);
  const doneOnTime = doneWithDeadline.filter(
    (task) => task.completedAt && task.deadline && task.completedAt.getTime() <= task.deadline.getTime()
  );
  const overdue = tasks.filter(
    (task) => task.deadline && task.deadline.getTime() < now.getTime() && task.status !== TaskStatus.DONE
  );
  const avgCloseTimeMs =
    doneTasks.reduce((acc, task) => {
      if (!task.completedAt) return acc;
      return acc + (task.completedAt.getTime() - task.createdAt.getTime());
    }, 0) / (doneTasks.length || 1);

  const statusDistribution = Object.values(TaskStatus).map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
    share: tasks.length ? Math.round((tasks.filter((task) => task.status === status).length / tasks.length) * 100) : 0
  }));

  const satisfaction =
    votes.length > 0 ? Number((votes.reduce((acc, vote) => acc + vote.score, 0) / votes.length).toFixed(1)) : null;
  const tasksWithPert = tasks.filter((task) => task.pertExpectedHours !== null);
  const scheduledTasks = tasks.filter((task) => task.scheduledStart && task.scheduledEnd);
  const scheduleMinutes = scheduleLessons.reduce(
    (acc, lesson) => acc + Math.max(0, (lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000),
    0
  );
  const scheduledTaskMinutes = scheduledTasks.reduce((acc, task) => {
    if (!task.scheduledStart || !task.scheduledEnd) return acc;
    return acc + Math.max(0, (task.scheduledEnd.getTime() - task.scheduledStart.getTime()) / 60_000);
  }, 0);

  return {
    totalTasks: tasks.length,
    doneTasks: doneTasks.length,
    activeUsers,
    overdueTasks: overdue.length,
    onTimeCompletionPercent: doneWithDeadline.length
      ? Math.round((doneOnTime.length / doneWithDeadline.length) * 100)
      : 0,
    averageCloseTimeDays: doneTasks.length ? Number((avgCloseTimeMs / 86_400_000).toFixed(1)) : 0,
    statusDistribution,
    satisfaction,
    scheduleLoad: {
      lessons: scheduleLessons.length,
      lessonHours: Number((scheduleMinutes / 60).toFixed(1)),
      plannedTaskHours: Number((scheduledTaskMinutes / 60).toFixed(1))
    },
    pertSummary: {
      tasksWithPert: tasksWithPert.length,
      averageExpectedHours: tasksWithPert.length
        ? Number((tasksWithPert.reduce((acc, task) => acc + (task.pertExpectedHours ?? 0), 0) / tasksWithPert.length).toFixed(1))
        : 0
    },
    groupSummaries: groups
  };
}
