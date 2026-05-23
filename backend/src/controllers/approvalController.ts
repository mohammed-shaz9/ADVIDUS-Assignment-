import { Response, NextFunction } from 'express';
import * as approvalService from '../services/approvalService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getMyApprovals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const approvals = await approvalService.getApprovalsForUser(req.user!._id.toString());
    res.json({ success: true, data: approvals, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const getTaskApprovals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const approvals = await approvalService.getApprovalsForTask(req.params.taskId as string);
    res.json({ success: true, data: approvals, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const createApprovalChain = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const approvals = await approvalService.createApprovalChain(req.params.taskId as string, req.body.approvers);
    res.status(201).json({ success: true, data: approvals, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};

export const decideApproval = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const approval = await approvalService.decideApproval(
      req.params.approvalId as string,
      req.user!._id.toString(),
      req.body.decision,
      req.body.comment,
    );
    res.json({ success: true, data: approval, serverTime: new Date().toISOString() });
  } catch (e) { next(e); }
};
