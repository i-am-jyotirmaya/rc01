import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import {
  createBattle,
  getBattleById,
  getBattles,
  joinBattle,
  startBattle,
  updateBattle,
  type BattleStartMode,
} from '../services/battleService.js';

const startModeSchema = z.enum(['manual', 'scheduled']);

const battleStatusSchema = z.enum(['draft', 'configuring', 'ready', 'scheduled', 'lobby']);

const participantRoleSchema = z.enum(['owner', 'admin', 'editor', 'player']);

const battleIdParamSchema = z.object({
  battleId: z.string().min(1, 'battleId is required'),
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
    const battles = await getBattles();
    res.json({ battles });
  } catch (error) {
    next(error);
  }
};

export const getBattleHandler = async (req: Request<{ battleId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { battleId } = battleIdParamSchema.parse(req.params);
    const battle = await getBattleById(battleId);
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
      createdByUserId: req.user.id,
    });

    res.status(201).json({ battle });
  } catch (error) {
    next(error);
  }
};

export const updateBattleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = updateBattleSchema.parse(req.body);
    const startDate = parseStartDate(payload.scheduledStartAt ?? undefined);

    const battle = await updateBattle(req.params.battleId, {
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
    const battle = await startBattle(req.params.battleId);
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
    const result = await joinBattle({
      battleId: req.params.battleId,
      userId: req.user.id,
      role: payload.role,
    });

    const statusCode = result.wasCreated ? 201 : 200;
    res.status(statusCode).json({ participant: result.participant, wasCreated: result.wasCreated });
  } catch (error) {
    next(error);
  }
};
