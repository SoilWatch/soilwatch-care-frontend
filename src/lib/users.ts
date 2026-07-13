/**
 * JSON-file user store. Mirrors the users table from db.py.
 * File is created on first access; seed admin via ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "users.json");

export interface User {
  email: string;
  name: string;
  password_hash: string;
  role: "admin" | "user";
  is_active: boolean;
}

function readUsers(): User[] {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as User[];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function seedAdmin() {
  const users = readUsers();
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (users.some(u => u.email === email)) return;
  users.push({
    email,
    name: process.env.ADMIN_NAME ?? "Admin",
    password_hash: bcrypt.hashSync(password, 10),
    role: "admin",
    is_active: true,
  });
  writeUsers(users);
}

export function getUserByEmail(email: string): User | null {
  seedAdmin();
  return readUsers().find(u => u.email === email.toLowerCase().trim()) ?? null;
}

export function createUser(email: string, name: string, password: string, role: "admin" | "user" = "user"): User {
  const users = readUsers();
  const user: User = {
    email: email.toLowerCase().trim(),
    name: name.trim(),
    password_hash: bcrypt.hashSync(password, 10),
    role,
    is_active: true,
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export function listUsers(): User[] {
  return readUsers();
}

export function setUserActive(email: string, active: boolean): void {
  const users = readUsers();
  const user = users.find(u => u.email === email.toLowerCase().trim());
  if (user) { user.is_active = active; writeUsers(users); }
}
