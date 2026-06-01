import { PrismaClient, Priority, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const password = "password123";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function color(seed: number) {
  const palette = ["#2563eb", "#0f766e", "#c2410c", "#7c3aed", "#be123c", "#4d7c0f", "#0891b2"];
  return palette[seed % palette.length];
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.satisfactionVote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@edukanban.local",
      passwordHash,
      name: "Администратор EduKanban",
      role: Role.ADMIN,
      avatarColor: color(0),
      lastLoginAt: daysFromNow(-1)
    }
  });

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@edukanban.local",
      passwordHash,
      name: "Ирина Сергеевна",
      role: Role.TEACHER,
      avatarColor: color(1),
      lastLoginAt: daysFromNow(-1)
    }
  });

  const webGroup = await prisma.group.create({
    data: {
      name: "Учебная группа ВР-22",
      code: "WEB-22",
      description: "Команда учебного проекта по веб-разработке и защите MVP.",
      teacherId: teacher.id
    }
  });

  const dataGroup = await prisma.group.create({
    data: {
      name: "Учебная группа ДА-21",
      code: "DATA-21",
      description: "Команда по аналитике данных, визуализациям и исследовательским задачам.",
      teacherId: teacher.id
    }
  });

  const pm = await prisma.user.create({
    data: {
      email: "pm@edukanban.local",
      passwordHash,
      name: "Максим Орлов",
      role: Role.PROJECT_MANAGER,
      groupId: webGroup.id,
      avatarColor: color(2),
      lastLoginAt: daysFromNow(-2)
    }
  });

  const lead = await prisma.user.create({
    data: {
      email: "lead@edukanban.local",
      passwordHash,
      name: "Алина Кузнецова",
      role: Role.TEAM_LEAD,
      groupId: webGroup.id,
      avatarColor: color(3),
      lastLoginAt: daysFromNow(-1)
    }
  });

  const starosta = await prisma.user.create({
    data: {
      email: "starosta@edukanban.local",
      passwordHash,
      name: "Никита Соколов",
      role: Role.STAROSTA,
      groupId: webGroup.id,
      avatarColor: color(4),
      lastLoginAt: daysFromNow(-1)
    }
  });

  const student = await prisma.user.create({
    data: {
      email: "student@edukanban.local",
      passwordHash,
      name: "Мария Белова",
      role: Role.STUDENT,
      groupId: webGroup.id,
      avatarColor: color(5),
      lastLoginAt: daysFromNow(-3)
    }
  });

  const student2 = await prisma.user.create({
    data: {
      email: "student2@edukanban.local",
      passwordHash,
      name: "Даниил Волков",
      role: Role.STUDENT,
      groupId: webGroup.id,
      avatarColor: color(6),
      lastLoginAt: daysFromNow(-4)
    }
  });

  const dataStarosta = await prisma.user.create({
    data: {
      email: "data-starosta@edukanban.local",
      passwordHash,
      name: "Софья Андреева",
      role: Role.STAROSTA,
      groupId: dataGroup.id,
      avatarColor: color(7),
      lastLoginAt: daysFromNow(-2)
    }
  });

  const dataStudent = await prisma.user.create({
    data: {
      email: "data-student@edukanban.local",
      passwordHash,
      name: "Кирилл Егоров",
      role: Role.STUDENT,
      groupId: dataGroup.id,
      avatarColor: color(8)
    }
  });

  const webProject = await prisma.project.create({
    data: {
      name: "EduKanban MVP",
      description: "Учебный продукт для прозрачного управления задачами группы.",
      groupId: webGroup.id,
      managerId: pm.id,
      teamLeadId: lead.id
    }
  });

  const dataProject = await prisma.project.create({
    data: {
      name: "Learning Analytics Dashboard",
      description: "Исследование активности студентов и визуализация образовательных KPI.",
      groupId: dataGroup.id,
      managerId: pm.id
    }
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Спроектировать REST API и роли доступа",
        description: "Описать контракты API, JWT-auth и матрицу RBAC для студентов, старосты и преподавателя.",
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        deadline: daysFromNow(-6),
        completedAt: daysFromNow(-7),
        tags: ["backend", "rbac"],
        estimatedHours: 8,
        grade: 92,
        groupId: webGroup.id,
        projectId: webProject.id,
        creatorId: pm.id,
        assigneeId: lead.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Собрать Kanban UI с drag-and-drop",
        description: "Реализовать колонки, карточки задач, перетаскивание и понятные статусы выполнения.",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        deadline: daysFromNow(3),
        tags: ["frontend", "kanban"],
        estimatedHours: 12,
        groupId: webGroup.id,
        projectId: webProject.id,
        creatorId: lead.id,
        assigneeId: student.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Подготовить демонстрационный сценарий защиты",
        description: "Составить сценарий показа: студент, староста, преподаватель, руководитель проекта и администратор.",
        status: TaskStatus.REVIEW,
        priority: Priority.URGENT,
        deadline: daysFromNow(1),
        tags: ["presentation", "demo"],
        estimatedHours: 5,
        groupId: webGroup.id,
        projectId: webProject.id,
        creatorId: teacher.id,
        assigneeId: starosta.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Описать README и запуск проекта",
        description: "Добавить архитектуру, env, команды запуска, тестовые аккаунты и деплойные рекомендации.",
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        deadline: daysFromNow(5),
        tags: ["docs"],
        estimatedHours: 4,
        groupId: webGroup.id,
        projectId: webProject.id,
        creatorId: starosta.id,
        assigneeId: student2.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Проверить форму создания задач",
        description: "Проверить обязательные поля, дедлайн, приоритет и назначение исполнителя.",
        status: TaskStatus.BACKLOG,
        priority: Priority.MEDIUM,
        deadline: daysFromNow(8),
        tags: ["qa", "frontend"],
        estimatedHours: 3,
        groupId: webGroup.id,
        projectId: webProject.id,
        creatorId: student.id,
        assigneeId: student.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Собрать датасет активности студентов",
        description: "Подготовить CSV с учебными событиями и описать поля для анализа.",
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        deadline: daysFromNow(-4),
        completedAt: daysFromNow(-3),
        tags: ["analytics", "dataset"],
        estimatedHours: 6,
        groupId: dataGroup.id,
        projectId: dataProject.id,
        creatorId: teacher.id,
        assigneeId: dataStarosta.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Визуализировать KPI по учебной группе",
        description: "Сделать графики распределения задач, просрочек, активности и удовлетворенности.",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        deadline: daysFromNow(-1),
        tags: ["analytics", "dashboard"],
        estimatedHours: 10,
        groupId: dataGroup.id,
        projectId: dataProject.id,
        creatorId: dataStarosta.id,
        assigneeId: dataStudent.id
      }
    }),
    prisma.task.create({
      data: {
        title: "Оформить выводы исследования",
        description: "Сформулировать выводы по данным и подготовить короткий блок для преподавателя.",
        status: TaskStatus.TODO,
        priority: Priority.LOW,
        deadline: daysFromNow(9),
        tags: ["presentation", "research"],
        estimatedHours: 4,
        groupId: dataGroup.id,
        projectId: dataProject.id,
        creatorId: dataStudent.id,
        assigneeId: dataStudent.id
      }
    })
  ]);

  await prisma.comment.createMany({
    data: [
      {
        taskId: tasks[0].id,
        authorId: teacher.id,
        body: "Хорошо, что роли вынесены отдельно. На защите обязательно покажите ограничения для студента.",
        grade: 92
      },
      {
        taskId: tasks[1].id,
        authorId: lead.id,
        body: "Мария, проверь mobile layout после drag-and-drop. Это заметно на демо."
      },
      {
        taskId: tasks[2].id,
        authorId: teacher.id,
        body: "Добавьте в сценарий переход задачи в Review и комментарий преподавателя."
      },
      {
        taskId: tasks[6].id,
        authorId: dataStarosta.id,
        body: "Дедлайн уже прошел, нужно сегодня закрыть хотя бы первую версию графиков."
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        taskId: tasks[1].id,
        type: "DEADLINE_SOON",
        title: "Скоро дедлайн",
        body: "До дедлайна Kanban UI осталось 3 дня."
      },
      {
        userId: starosta.id,
        taskId: tasks[2].id,
        type: "REVIEW_REQUESTED",
        title: "Нужна проверка сценария",
        body: "Преподаватель оставил комментарий к демо-сценарию."
      },
      {
        userId: dataStudent.id,
        taskId: tasks[6].id,
        type: "TASK_OVERDUE",
        title: "Задача просрочена",
        body: "Визуализация KPI требует внимания."
      }
    ]
  });

  await prisma.satisfactionVote.createMany({
    data: [
      { userId: student.id, score: 8, comment: "Стало проще понимать, что делать дальше." },
      { userId: student2.id, score: 7, comment: "Не хватает интеграции с календарем, но доска удобная." },
      { userId: starosta.id, score: 9, comment: "Видно просрочки и распределение по людям." },
      { userId: dataStarosta.id, score: 8, comment: "Полезно для контроля задач перед защитой." }
    ]
  });

  console.table([
    { role: "Admin", email: admin.email, password },
    { role: "Teacher", email: teacher.email, password },
    { role: "Project Manager", email: pm.email, password },
    { role: "Team Lead", email: lead.email, password },
    { role: "Starosta", email: starosta.email, password },
    { role: "Student", email: student.email, password }
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
