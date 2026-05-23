import React from 'react';

interface AIInsightCardProps {
  completionRate: number;
  pendingTasks: number;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ completionRate, pendingTasks }) => {
  const getInsight = () => {
    if (!completionRate && !pendingTasks) return 'Generating workload insights...';
    if (completionRate < 50) {
      return `Critical workload backlog detected. Task completion rate is low at ${completionRate}%. Active queue holds ${pendingTasks} pending tasks. Recommend provisioning an AI Autopilot agent.`;
    }
    if (pendingTasks > 4) {
      return `${pendingTasks} high-priority tasks are currently pending. Workload is high. Consider redistributing tasks across active agents.`;
    }
    return `Workspace operations are completely nominal. Task completion rate is steady at ${completionRate}% with stable database connections.`;
  };

  return (
    <div className="ai-card animate-slide-up">
      <div className="ai-icon"><i className="ti ti-sparkles" aria-hidden="true"></i></div>
      <div>
        <div className="ai-label">AI Operation Insight</div>
        <div className="ai-text">{getInsight()}</div>
      </div>
    </div>
  );
};
