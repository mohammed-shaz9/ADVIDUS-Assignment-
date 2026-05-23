import Agent from '../models/Agent.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitEvent } from '../utils/realtime.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';

export const createAgent = async (
  name: string,
  role: string,
  systemPrompt: string,
  modelName: string | undefined,
  creatorId: string
) => {
  const existing = await Agent.findOne({ name: name.trim() });
  if (existing) {
    throw new ConflictError('An agent with this name already exists');
  }

  const agent = await Agent.create({
    name: name.trim(),
    role: role.trim(),
    systemPrompt: systemPrompt.trim(),
    modelName: modelName ? modelName.trim() : 'gpt-4o',
    creator: creatorId,
  });

  await logActivity(creatorId, 'AGENT_CREATED', `Registered AI Agent: "${agent.name}" (${agent.role})`);
  emitEvent('agent.created', { agentId: agent._id.toString(), status: agent.status });

  return agent;
};

export const getAgents = async (userRole: string) => {
  const query = userRole !== 'admin' ? { status: 'active' } : {};
  return Agent.find(query)
    .populate('creator', 'name email')
    .sort({ createdAt: -1 });
};

export const toggleAgentStatus = async (agentId: string, userId: string) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new NotFoundError('AI Agent');
  }

  agent.status = agent.status === 'active' ? 'inactive' : 'active';
  await agent.save();

  await logActivity(
    userId,
    'AGENT_STATUS_UPDATED',
    `Toggled AI Agent "${agent.name}" state to: ${agent.status}`
  );

  emitEvent('agent.status_changed', { agentId: agent._id.toString(), status: agent.status });

  return agent;
};

export const deleteAgent = async (agentId: string, userId: string) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new NotFoundError('AI Agent');
  }

  await Agent.findByIdAndDelete(agentId);

  await logActivity(userId, 'AGENT_DELETED', `Removed AI Agent: "${agent.name}"`);
  emitEvent('agent.deleted', { agentId: agent._id.toString() });

  return { message: 'AI Agent removed successfully' };
};
