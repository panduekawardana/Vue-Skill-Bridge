import crypto from "crypto";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { db } from "../config/database.js";
import { supportTickets } from "../db/schema/supportTickets.js";
import { admins } from "../db/schema/admins.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

const TICKET_STATUS_TRANSITIONS = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export const createTicket = asyncHandler(async (req, res) => {
  const { userId, subject, body, priority } = req.body;

  if (!subject || !body) {
    throw new AppError("subject and body are required", 400);
  }

  const id = generateId();

  await db.insert(supportTickets).values({
    id,
    userId: userId || req.user.userId,
    subject,
    body,
    status: "open",
    priority: priority || "medium",
    createdBy: req.user.userId,
  });

  const [created] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  res.status(201).json(created);
});

export const getTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];

  if (status) conditions.push(eq(supportTickets.status, status));

  const [currentAdmin] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, req.user.userId))
    .limit(1);

  if (currentAdmin?.roleLevel === "support") {
    // Support can see tickets assigned to them OR unassigned tickets
    conditions.push(or(
      eq(supportTickets.assignedTo, req.user.userId),
      isNull(supportTickets.assignedTo),
    ));
  }

  const result = await db
    .select()
    .from(supportTickets)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(supportTickets.createdAt));

  res.json(result);
});

export const getTicket = asyncHandler(async (req, res) => {
  const [result] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Ticket not found", 404);

  // Support role: can only view tickets assigned to them or unassigned
  const [currentAdmin] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, req.user.userId))
    .limit(1);

  if (currentAdmin?.roleLevel === "support") {
    if (result.assignedTo && result.assignedTo !== req.user.userId) {
      throw new AppError("Forbidden. You can only view tickets assigned to you.", 403);
    }
  }

  res.json(result);
});

export const updateTicket = asyncHandler(async (req, res) => {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id)).limit(1);
  if (!ticket) throw new AppError("Ticket not found", 404);

  const updateData = {};

  if (req.body.status) {
    // Validate status transition
    const allowed = TICKET_STATUS_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(req.body.status)) {
      throw new AppError(`Cannot transition from ${ticket.status} to ${req.body.status}`, 400);
    }
    if (req.body.status === "resolved" || req.body.status === "closed") {
      updateData.resolvedAt = new Date();
    }
    updateData.status = req.body.status;
  }
  if (req.body.priority) updateData.priority = req.body.priority;
  if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo;

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, req.params.id));

  const [updated] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id)).limit(1);
  res.json(updated);
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id)).limit(1);
  if (!ticket) throw new AppError("Ticket not found", 404);

  await db.delete(supportTickets).where(eq(supportTickets.id, req.params.id));
  res.json({ message: "Ticket deleted" });
});
