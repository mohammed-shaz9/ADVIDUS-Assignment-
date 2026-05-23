import { Response, NextFunction } from 'express';
import * as agentService from '../services/agentService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const createAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, role, systemPrompt, modelName } = req.body;
    const agent = await agentService.createAgent(name, role, systemPrompt, modelName, req.user!._id.toString());
    res.status(201).json({ success: true, data: agent, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getAgents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const agents = await agentService.getAgents(req.user!.role);
    res.json({ success: true, data: agents, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const toggleAgentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const agent = await agentService.toggleAgentStatus(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, data: agent, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const deleteAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await agentService.deleteAgent(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, ...result, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};
