import { Response, NextFunction } from 'express';
import * as orgService from '../services/orgService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getDepartments = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.getDepartments(), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const getDepartmentTree = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.getDepartmentTree(), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const createDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await orgService.createDepartment(req.body), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const updateDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.updateDepartment(req.params.id as string, req.body), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const deleteDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.deleteDepartment(req.params.id as string), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const getDesignations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.getDesignations(req.query.department as string), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const createDesignation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await orgService.createDesignation(req.body), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const updateDesignation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.updateDesignation(req.params.id as string, req.body), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const deleteDesignation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.deleteDesignation(req.params.id as string), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};

export const getOrgChart = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await orgService.getOrgChart(), serverTime: new Date().toISOString() }); }
  catch (e) { next(e); }
};
