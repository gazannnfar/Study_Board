import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role, User } from "@prisma/client";
import { env } from "../config/env.js";

export type TokenPayload = {
  sub: string;
  role: Role;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ role: user.role } satisfies Omit<TokenPayload, "sub">, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & TokenPayload;
}
