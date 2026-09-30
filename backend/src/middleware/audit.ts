import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/connection';

export function auditLog(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (req.user && res.statusCode < 400) {
        const prisma = getDb();
        prisma.auditLog.create({
          data: {
            userId: req.user!.id,
            action,
            resourceType,
            resourceId: body?.id || req.params?.id || null,
            facilityId: req.user!.facility_id,
            details: JSON.stringify({ body: req.body }),
            ipAddress: req.ip,
          }
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}
