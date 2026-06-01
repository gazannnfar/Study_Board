import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/error.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  createCommentSchema,
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema
} from "./tasks.schemas.js";
import { addComment, createTask, deleteTask, getTask, listTasks, updateTask } from "./tasks.service.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validateQuery(taskQuerySchema),
  asyncHandler(async (req, res) => {
    const tasks = await listTasks(req.user!, req.query);
    res.json({ tasks });
  })
);

router.post(
  "/",
  validateBody(createTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await createTask(req.user!, req.body);
    res.status(201).json({ task });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await getTask(req.user!, req.params.id);
    res.json({ task });
  })
);

router.patch(
  "/:id",
  validateBody(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await updateTask(req.user!, req.params.id, req.body);
    res.json({ task });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteTask(req.user!, req.params.id);
    res.status(204).send();
  })
);

router.post(
  "/:id/comments",
  validateBody(createCommentSchema),
  asyncHandler(async (req, res) => {
    const comment = await addComment(req.user!, req.params.id, req.body);
    res.status(201).json({ comment });
  })
);

export default router;
