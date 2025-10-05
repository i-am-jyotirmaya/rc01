import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import {
  assignBattleRole,
  createBattle,
  getBattleById,
  getBattles,
  joinBattle,
  startBattle,
  updateBattle,
  type BattleStartMode,
} from '../services/battleService.js';
import { resolveOptionalUser } from '../utils/authentication.js';

const startModeSchema = z.enum(['manual', 'scheduled']);

const battleStatusSchema = z.enum(['draft', 'published', 'lobby', 'live', 'completed']);

const participantRoleSchema = z.enum(['owner', 'admin', 'editor', 'player', 'spectator']);

const battleIdParamSchema = z.object({
  battleId: z.string().uuid('battleId must be a valid UUID'),
});

const createBattleSchema = z
  .object({
    name: z.string().min(1, 'Battle name is required'),
    shortDescription: z.union([z.string(), z.null()]).optional(),
    configuration: z.record(z.any()).optional(),
    startMode: startModeSchema,
    scheduledStartAt: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startMode === 'scheduled' && !value.scheduledStartAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scheduledStartAt is required when startMode is scheduled',
        path: ['scheduledStartAt'],
      });
    }
  });

const updateBattleSchema = z
  .object({
    name: z.string().min(1).optional(),
    shortDescription: z.union([z.string(), z.null()]).optional(),
    configuration: z.record(z.any()).optional(),
    startMode: startModeSchema.optional(),
    scheduledStartAt: z.union([z.string().datetime(), z.null()]).optional(),
    status: battleStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startMode === 'scheduled' && value.scheduledStartAt === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scheduledStartAt is required when startMode is scheduled',
        path: ['scheduledStartAt'],
      });
    }
  });

const joinBattleSchema = z
  .object({
    role: participantRoleSchema.optional(),
  })
  .strict();

const assignBattleRoleSchema = z
  .object({
    userId: z.string().uuid('userId must be a valid UUID'),
    role: participantRoleSchema.refine((role) => role !== 'owner', 'Cannot assign the owner role'),
  })
  .strict();

const parseStartDate = (value: string | null | undefined): Date | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

export const listBattlesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user ?? (await resolveOptionalUser(req));
    if (user) {
      req.user = user;
    }

    const battles = await getBattles(user?.id);
    res.json({ battles });
  } catch (error) {
    next(error);
  }
};

export const getBattleHandler = async (req: Request<{ battleId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { battleId } = battleIdParamSchema.parse(req.params);
    const user = req.user ?? (await resolveOptionalUser(req));
    if (user) {
      req.user = user;
    }

    const battle = await getBattleById(battleId, user?.id);
    res.json({ battle });
  } catch (error) {
    next(error);
  }
};

export const createBattleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createHttpError(401, 'Authentication required');
    }

    const payload = createBattleSchema.parse(req.body);
    const startDate = parseStartDate(payload.scheduledStartAt ?? undefined);

    const battle = await createBattle({
      name: payload.name,
      shortDescription: payload.shortDescription ?? null,
      configuration: payload.configuration,
      startMode: payload.startMode as BattleStartMode,
      scheduledStartAt: startDate ?? null,
      ownerId: req.user.id,
    });

    res.status(201).json({ battle });
  } catch (error) {
    next(error);
  }
};

export const updateBattleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createHttpError(401, 'Authentication required');
    }

    const { battleId } = battleIdParamSchema.parse(req.params);
    const payload = updateBattleSchema.parse(req.body);
    const startDate = parseStartDate(payload.scheduledStartAt ?? undefined);

    const battle = await updateBattle(battleId, req.user.id, {
      name: payload.name,
      shortDescription: payload.shortDescription ?? undefined,
      configuration: payload.configuration,
      startMode: payload.startMode as BattleStartMode | undefined,
      scheduledStartAt: startDate,
      status: payload.status,
    });

    res.json({ battle });
  } catch (error) {
    next(error);
  }
};

export const startBattleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createHttpError(401, 'Authentication required');
    }

    const { battleId } = battleIdParamSchema.parse(req.params);
    const battle = await startBattle(battleId, req.user.id);
    res.json({ battle });
  } catch (error) {
    next(error);
  }
};

export const joinBattleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createHttpError(401, 'Authentication required');
    }

    const payload = joinBattleSchema.parse(req.body ?? {});
    const { battleId } = battleIdParamSchema.parse(req.params);
    const result = await joinBattle({
      battleId,
      userId: req.user.id,
      role: payload.role,
    });

    const statusCode = result.wasCreated ? 201 : 200;
    res.status(statusCode).json({ participant: result.participant, wasCreated: result.wasCreated });
  } catch (error) {
    next(error);
  }
};

export const assignBattleRoleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createHttpError(401, 'Authentication required');
    }

    const { battleId } = battleIdParamSchema.parse(req.params);
    const payload = assignBattleRoleSchema.parse(req.body ?? {});
    const participant = await assignBattleRole({
      battleId,
      actorUserId: req.user.id,
      targetUserId: payload.userId,
      role: payload.role,
    });

    res.status(200).json({ participant });
  } catch (error) {
    next(error);
  }
};
