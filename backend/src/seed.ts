import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Task from './models/Task.js';
import TaskComment from './models/TaskComment.js';
import ActivityLog from './models/ActivityLog.js';
import Agent from './models/Agent.js';
import Department from './models/Department.js';
import Designation from './models/Designation.js';
import PerformanceMetric from './models/PerformanceMetric.js';
import Approval from './models/Approval.js';
import { logger } from './config/logger.js';

const firstNames = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Pranav','Dhruv','Krishna','Laksh',
  'Aanya','Diya','Ishita','Jiya','Kavya','Nitya','Riya','Sara','Tara','Anaya',
  'Rohan','Karan','Abhi','Neel','Ravi','Sohan','Mohan','Jay','Virat','Om',
  'Priya','Anjali','Neha','Pooja','Ritu','Shreya','Tanvi','Urvi','Vani','Yashi',
  'Amit','Bharat','Chandan','Deepak','Eshan','Gaurav','Harsh','Ishaan','Jatin','Kunal',
  'Lata','Madhu','Nandini','Parul','Rajni','Sakshi','Tripti','Usha','Vidya','Wamiqa',
  'Akhil','Bikram','Chirag','Dinesh','Girish','Hemant','Indrajit','Jagdish','Kartik','Lalit',
  'Maya','Nayana','Ojaswita','Pallavi','Radhika','Sneha','Trisha','Uma','Varsha','Yogita',
  'Abhishek','Bhuvan','Chetan','Dharmesh','Ganesh','Hitesh','Ishwar','Jitendra','Kedar','Lokesh',
  'Anita','Bhavna','Charvi','Divya','Esha','Gargi','Hema','Indira','Jyoti','Kiran'
];

const lastNames = [
  'Sharma','Verma','Patel','Singh','Kumar','Gupta','Joshi','Reddy','Rao','Nair',
  'Mehta','Shah','Desai','Bose','Sen','Das','Ghosh','Choudhury','Mukherjee','Banerjee',
  'Iyer','Menon','Pillai','Krishnan','Rajan','Nayar','Mathew','Thomas','George','Cherian',
  'Agarwal','Kapoor','Malhotra','Sethi','Khanna','Arora','Chopra','Tandon','Bajaj','Sood',
  'Prasad','Mishra','Tripathi','Dwivedi','Pandey','Tiwari','Upadhyay','Dubey','Chaubey','Shukla',
  'Kadam','Pawar','Salvi','Mhatre','Sawant','Patkar','Gawade','Kulkarni','Deshpande','Jadhav',
  'Vohra','Bhatia','Gill','Sodhi','Dhillon','Saini','Grewal','Toor','Sandhu','Sidhu',
  'Pillai','Naidu','Raju','Swamy','Murthy','Sastry','Sundaram','Rangarajan','Subramaniam','Raman',
  'Mirza','Qureshi','Ansari','Khan','Syed','Hussain','Shah','Sheikh','Akhtar','Hashmi',
  'Nath','Thakur','Chauhan','Solanki','Parmar','Vaghela','Modi','Rathore','Bhargav','Rawat'
];

const departments = [
  { name: 'Engineering', description: 'Core Platform & Product Engineering' },
  { name: 'QA & Testing', description: 'Quality Assurance & Test Automation' },
  { name: 'DevOps', description: 'Infrastructure & Deployment' },
  { name: 'Product', description: 'Product Management & Strategy' },
  { name: 'Design', description: 'UX/UI & Visual Design' },
  { name: 'Marketing', description: 'Brand, Growth & Communications' },
  { name: 'Sales', description: 'Enterprise Sales & Partnerships' },
  { name: 'Customer Success', description: 'Client Support & Onboarding' },
  { name: 'Human Resources', description: 'Talent, Culture & Operations' },
  { name: 'Finance', description: 'Accounting & Financial Planning' },
  { name: 'Data Science', description: 'Analytics, ML & Insights' },
  { name: 'Legal', description: 'Compliance, Contracts & IP' },
];

const designationTemplates: Record<string, { title: string; level: number }[]> = {
  'Engineering': [
    { title: 'Intern', level: 0 }, { title: 'Junior Engineer', level: 1 }, { title: 'Software Engineer', level: 2 },
    { title: 'Senior Engineer', level: 3 }, { title: 'Staff Engineer', level: 4 }, { title: 'Engineering Manager', level: 5 },
    { title: 'Director of Engineering', level: 6 }, { title: 'VP Engineering', level: 7 },
  ],
  'QA & Testing': [
    { title: 'QA Intern', level: 0 }, { title: 'Junior QA', level: 1 }, { title: 'QA Engineer', level: 2 },
    { title: 'Senior QA', level: 3 }, { title: 'QA Lead', level: 4 }, { title: 'QA Manager', level: 5 },
  ],
  'DevOps': [
    { title: 'DevOps Intern', level: 0 }, { title: 'Junior DevOps', level: 1 }, { title: 'DevOps Engineer', level: 2 },
    { title: 'Senior DevOps', level: 3 }, { title: 'DevOps Lead', level: 4 }, { title: 'Infrastructure Manager', level: 5 },
  ],
  'Product': [
    { title: 'Associate PM', level: 1 }, { title: 'Product Manager', level: 2 }, { title: 'Senior PM', level: 3 },
    { title: 'Director of Product', level: 5 }, { title: 'VP Product', level: 6 },
  ],
  'Design': [
    { title: 'Design Intern', level: 0 }, { title: 'Junior Designer', level: 1 }, { title: 'UI/UX Designer', level: 2 },
    { title: 'Senior Designer', level: 3 }, { title: 'Design Lead', level: 4 }, { title: 'Creative Director', level: 6 },
  ],
  'Marketing': [
    { title: 'Marketing Intern', level: 0 }, { title: 'Marketing Associate', level: 1 }, { title: 'Marketing Specialist', level: 2 },
    { title: 'Senior Marketing Manager', level: 3 }, { title: 'Head of Marketing', level: 5 }, { title: 'CMO', level: 7 },
  ],
  'Sales': [
    { title: 'SDR', level: 1 }, { title: 'Account Executive', level: 2 }, { title: 'Senior AE', level: 3 },
    { title: 'Enterprise AE', level: 4 }, { title: 'Sales Manager', level: 5 }, { title: 'VP Sales', level: 6 },
  ],
  'Customer Success': [
    { title: 'CS Associate', level: 1 }, { title: 'CS Manager', level: 2 }, { title: 'Senior CSM', level: 3 },
    { title: 'Head of CS', level: 5 },
  ],
  'Human Resources': [
    { title: 'HR Associate', level: 1 }, { title: 'HR Generalist', level: 2 }, { title: 'HR Manager', level: 3 },
    { title: 'Senior HR Manager', level: 4 }, { title: 'Head of People', level: 6 },
  ],
  'Finance': [
    { title: 'Finance Associate', level: 1 }, { title: 'Accountant', level: 2 }, { title: 'Senior Accountant', level: 3 },
    { title: 'Finance Manager', level: 4 }, { title: 'CFO', level: 7 },
  ],
  'Data Science': [
    { title: 'Data Analyst', level: 1 }, { title: 'Data Scientist', level: 2 }, { title: 'Senior Data Scientist', level: 3 },
    { title: 'ML Engineer', level: 3 }, { title: 'Head of Data', level: 5 },
  ],
  'Legal': [
    { title: 'Paralegal', level: 1 }, { title: 'Corporate Counsel', level: 2 }, { title: 'Senior Counsel', level: 3 },
    { title: 'General Counsel', level: 6 },
  ],
};

const taskTemplates = [
  'Implement {feature} for {module} module',
  'Fix critical {module} issue in production',
  'Update {module} documentation',
  'Code review for {module} pull request',
  'Write unit tests for {module} service',
  'Optimize {module} query performance',
  'Refactor {module} legacy code',
  'Design {module} system architecture',
  'Create deployment pipeline for {module}',
  'Monitor {module} error rates',
  'Prepare {module} monthly report',
  'Conduct {module} stakeholder meeting',
  'Review {module} vendor contract',
  'Migrate {module} to new infrastructure',
  'Setup monitoring alerts for {module}',
  'Create onboarding guide for {module}',
  'Perform security audit on {module}',
  'Build dashboard for {module} metrics',
  'Integrate {module} with third-party API',
];
const features = ['authentication','dashboard','notification','search','reporting','user management','role-based access','real-time sync','data export','file upload','scheduler','pipeline','deployment','monitoring','analytics','alerting','migration','caching','logging','sso integration'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { const s = new Set<T>(); while (s.size < n) s.add(pick(arr)); return [...s]; }
function randomEmail(name: string, domain = 'avidus.ai'): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}${Math.floor(Math.random() * 999)}@${domain}`;
}

export const seed = async (): Promise<void> => {
  try {
    await Promise.all([
      User.deleteMany({}), Task.deleteMany({}), TaskComment.deleteMany({}),
      ActivityLog.deleteMany({}), Agent.deleteMany({}), Department.deleteMany({}),
      Designation.deleteMany({}), PerformanceMetric.deleteMany({}), Approval.deleteMany({}),
    ]);
    logger.info('Database cleared!');

    // ============================================================
    // STEP 1: Create Admin User
    // ============================================================
    const admin = await User.create({
      name: 'Admin User', email: 'admin@example.com', password: 'Admin@123',
      role: 'admin', status: 'active', phoneNumber: '+919999999990',
    });
    logger.info('Admin created');

    // ============================================================
    // STEP 2: Create Departments & Designations
    // ============================================================
    const deptDocs = await Department.insertMany(
      departments.map(d => ({ ...d, organization: 'Avidus Interactive' }))
    );
    const deptMap = new Map<string, typeof deptDocs[0]>();
    departments.forEach((d, i) => deptMap.set(d.name, deptDocs[i]));
    logger.info(`${deptDocs.length} departments created`);

    let allDesignations: any[] = [];
    for (const [deptName, titles] of Object.entries(designationTemplates)) {
      const dept = deptMap.get(deptName);
      if (dept) {
        for (const t of titles) {
          allDesignations.push({ title: t.title, level: t.level, department: dept._id, isActive: true });
        }
      }
    }
    const desigDocs = await Designation.insertMany(allDesignations);
    const desigByDept = new Map<string, any[]>();
    for (const d of desigDocs) {
      const key = String(d.department || '');
      if (!desigByDept.has(key)) desigByDept.set(key, []);
      desigByDept.get(key)!.push(d);
    }
    logger.info(`${desigDocs.length} designations created`);

    // ============================================================
    // STEP 3: Create 100 Employees
    // Each employee gets a department, designation, phone, and status
    // ============================================================
    const usedNames = new Set<string>();
    interface EmployeeRecord {
      user: any; dept: any; desig: any;
    }
    const employees: EmployeeRecord[] = [];

    for (let i = 0; i < 100; i++) {
      let name: string;
      do { name = `${pick(firstNames)} ${pick(lastNames)}`; } while (usedNames.has(name));
      usedNames.add(name);

      const dept = pick(deptDocs);
      const deptDesigs = desigByDept.get(dept._id.toString()) || desigDocs;
      const desig = pick(deptDesigs);
      const isActive = Math.random() < 0.85;
      const phone = `+9199${String(9000000000 + i).slice(0, 10)}`;

      const user = await User.create({
        name, email: randomEmail(name), password: 'User@123',
        role: 'user', status: isActive ? 'active' : 'inactive',
        phoneNumber: phone, department: dept._id, designation: desig.title,
      });
      employees.push({ user, dept, desig });
    }
    logger.info(`${employees.length} employees created`);

    // ============================================================
    // LIFECYCLE PHASE 1: TASK CREATION (All tasks start as 'pending')
    // ============================================================
    // Loop: For each employee, create 3-6 tasks.
    // ALL tasks are initially 'pending' — simulating a manager
    // assigning new work to team members.
    // ============================================================
    const pendingTasks: any[] = [];
    const tasksPerPhase: any[] = [];
    const totalPhases = [] as string[];

    for (const emp of employees) {
      const numTasks = 3 + Math.floor(Math.random() * 4);
      const deptModule = emp.dept.name.replace(/\s+/g, '_').toLowerCase();
      const selectedFeatures = pickN(features, 6);

      for (let t = 0; t < numTasks; t++) {
        const feature = pick(selectedFeatures);
        const title = pick(taskTemplates)
          .replace('{feature}', feature)
          .replace('{module}', emp.dept.name);

        const task: any = {
          title,
          description: `Task assigned to ${emp.user.name} as part of ${emp.dept.name} ${feature} initiative.`,
          status: 'pending',
          owner: emp.user._id,
          assignedTo: { assigneeType: 'human', user: emp.user._id },
          createdAt: new Date(Date.now() - (15 + Math.random() * 20) * 24 * 3600000),
        };
        pendingTasks.push(task);
      }
    }

    // Bulk insert all tasks (Phase 1: all pending)
    const taskDocs = await Task.insertMany(pendingTasks);
    tasksPerPhase.push(...taskDocs.map(t => ({ doc: t, emp: employees.find(e => String(e.user._id) === String(t.owner))! })));
    logger.info(`PHASE 1: ${taskDocs.length} tasks created (all 'pending')`);

    // ============================================================
    // LIFECYCLE PHASE 2: WORK IN PROGRESS (~35% of tasks)
    // ============================================================
    // Loop: Select ~35% of 'pending' tasks and mark them as
    // 'in_progress'. This simulates employees picking up tasks
    // and beginning work. A comment is added at this stage.
    // ============================================================
    const inProgressPhase = tasksPerPhase.filter(() => Math.random() < 0.35);
    const inProgressComments: any[] = [];
    const inProgressLogs: any[] = [];

    for (const { doc, emp } of inProgressPhase) {
      await Task.updateOne({ _id: doc._id }, { $set: { status: 'in_progress' } });
      doc.status = 'in_progress';
      inProgressComments.push({
        task: doc._id, author: emp.user._id,
        content: `Started working on this task. Currently analyzing requirements and setting up the development environment.`,
      });
      inProgressLogs.push({
        userId: emp.user._id, action: 'TASK_STATUS_CHANGE' as const,
        details: `Started working on: "${doc.title}" (status: pending → in_progress)`,
      });
    }
    if (inProgressComments.length > 0) {
      await TaskComment.insertMany(inProgressComments);
    }
    const inProgressIds = new Set(inProgressPhase.map(p => String(p.doc._id)));
    logger.info(`PHASE 2: ${inProgressPhase.length} tasks moved to 'in_progress' (+${inProgressComments.length} comments)`);

    // ============================================================
    // LIFECYCLE PHASE 3: COMPLETION (~40% of tasks)
    // ============================================================
    // Loop: From the 'in_progress' tasks, select ~70% to mark as
    // 'completed'. This simulates tasks being finished successfully.
    // A completion comment and approval request are added.
    // ============================================================
    const completedPhase = inProgressPhase.filter(() => Math.random() < 0.7);
    const completionComments: any[] = [];
    const completionLogs: any[] = [];
    const approvalRequests: any[] = [];

    for (const { doc, emp } of completedPhase) {
      await Task.updateOne({ _id: doc._id }, { $set: { status: 'completed' } });
      doc.status = 'completed';
      const completedDate = new Date(Date.now() - Math.random() * 10 * 24 * 3600000);
      completionComments.push({
        task: doc._id, author: emp.user._id,
        content: `Task completed. All acceptance criteria met, code reviewed, and deployed to staging. Ready for approval.`,
      });
      completionLogs.push({
        userId: emp.user._id, action: 'TASK_STATUS_CHANGE' as const,
        details: `Completed task: "${doc.title}" (status: in_progress → completed)`,
      });
      // Some completed tasks get approval requests
      if (Math.random() < 0.4) {
        approvalRequests.push({
          task: doc._id,
          level: 1,
          approver: admin._id,
          status: 'pending',
        });
      }
    }
    if (completionComments.length > 0) {
      await TaskComment.insertMany(completionComments);
    }
    if (approvalRequests.length > 0) {
      await Approval.insertMany(approvalRequests);
    }
    logger.info(`PHASE 3: ${completedPhase.length} tasks moved to 'completed' (+${completionComments.length} comments, ${approvalRequests.length} approvals)`);

    // ============================================================
    // LIFECYCLE PHASE 4: AUDIT LOGGING
    // ============================================================
    // Loop: For each lifecycle event (create, start, complete),
    // generate an audit log entry. This demonstrates the full
    // audit trail capability.
    // ============================================================
    const auditLogs: any[] = [];

    // 4a: Log task creation for all tasks
    for (const { doc, emp } of tasksPerPhase) {
      auditLogs.push({
        userId: emp.user._id, action: 'TASK_CREATED' as const,
        details: `Created task: "${doc.title}" for ${emp.dept.name} department`,
      });
    }

    // 4b: Log in_progress transitions
    auditLogs.push(...inProgressLogs);

    // 4c: Log completed transitions
    auditLogs.push(...completionLogs);

    // 4d: Log user registrations and logins
    for (const emp of employees) {
      auditLogs.push({
        userId: emp.user._id, action: 'REGISTER' as const,
        details: `${emp.user.name} (${emp.user.email}) registered as ${emp.desig.title} in ${emp.dept.name}`,
      });
      auditLogs.push({
        userId: emp.user._id, action: 'LOGIN' as const,
        details: `${emp.user.name} logged in from IP 10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      });
    }

    // 4e: Log approval actions
    for (const req of approvalRequests) {
      const taskDoc = tasksPerPhase.find(t => String(t.doc._id) === String(req.task));
      auditLogs.push({
        userId: admin._id, action: 'APPROVAL_REQUESTED' as const,
        details: `Approval requested for task: "${taskDoc?.doc.title || 'unknown'}"`,
      });
    }

    // 4f: Admin actions
    auditLogs.push({
      userId: admin._id, action: 'PERFORMANCE_SNAPSHOT' as const,
      details: `Performance snapshot taken for ${employees.length} employees`,
    });
    auditLogs.push({
      userId: admin._id, action: 'USER_CREATED' as const,
      details: `Bulk user creation completed: ${employees.length} employee accounts created`,
    });

    await ActivityLog.insertMany(auditLogs);
    logger.info(`PHASE 4: ${auditLogs.length} activity logs created`);

    // ============================================================
    // PERFORMANCE SCORING (Based on actual lifecycle completion)
    // ============================================================
    // The performance score reflects the REAL completion rate:
    //   score = (completedTasks / totalTasks) × 100
    // This makes the analytics dashboard show meaningful data.
    // ============================================================
    const taskByOwner = new Map<string, any[]>();
    for (const { doc } of tasksPerPhase) {
      const key = String(doc.owner);
      if (!taskByOwner.has(key)) taskByOwner.set(key, []);
      taskByOwner.get(key)!.push(doc);
    }

    const perfDocs = employees.map(emp => {
      const empTasks = taskByOwner.get(String(emp.user._id)) || [];
      const totalTasks = empTasks.length;
      const completedTasks = empTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = empTasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = empTasks.filter(t => t.status === 'pending').length;
      const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        user: emp.user._id, period: 'daily',
        tasksCompleted: completedTasks,
        tasksAssigned: totalTasks,
        onTimeCompletion: completedTasks,
        overdueTasks: pendingTasks,
        avgCompletionHours: Math.round(Math.random() * 48),
        score,
        snapshotDate: new Date(),
      };
    });

    await PerformanceMetric.insertMany(perfDocs);
    logger.info(`Performance scored: ${perfDocs.length} employees (avg score: ${Math.round(perfDocs.reduce((a, b) => a + b.score, 0) / perfDocs.length)}%)`);

    // ============================================================
    // AI AGENTS
    // ============================================================
    const agents = await Agent.insertMany([
      { name: 'Sentinel Debugger', role: 'Code Debugger', systemPrompt: 'You are an elite software debugger.', modelName: 'gpt-4o', status: 'active', creator: admin._id },
      { name: 'Sentinel Copywriter', role: 'Marketing Copywriter', systemPrompt: 'You are a creative copywriter.', modelName: 'gemini-1.5-pro', status: 'active', creator: admin._id },
      { name: 'Sentinel Analyst', role: 'Business Analyst', systemPrompt: 'You are a corporate business analyst.', modelName: 'claude-3.5-sonnet', status: 'active', creator: admin._id },
      { name: 'Deprecated Assistant', role: 'General Purpose Agent', systemPrompt: 'Legacy automation assistant.', modelName: 'gpt-4o', status: 'inactive', creator: admin._id },
      { name: 'Code Reviewer Pro', role: 'Code Reviewer', systemPrompt: 'Expert code reviewer focusing on security and performance.', modelName: 'gpt-4o', status: 'active', creator: admin._id },
    ]);
    logger.info(`${agents.length} AI agents created`);

    // ============================================================
    // FINAL SUMMARY — This structure helps HR understand the data
    // ============================================================
    const completedCount = tasksPerPhase.filter(t => t.doc.status === 'completed').length;
    const inProgCount = tasksPerPhase.filter(t => t.doc.status === 'in_progress').length;
    const pendingCount = tasksPerPhase.filter(t => t.doc.status === 'pending').length;

    logger.info('========================================');
    logger.info(`DATABASE SEEDING COMPLETE ✅`);
    logger.info('========================================');
    logger.info(`  USERS:           ${employees.length + 1}`);
    logger.info(`    - Admin:       1`);
    logger.info(`    - Employees:   ${employees.length}`);
    logger.info(`  DEPARTMENTS:     ${deptDocs.length}`);
    logger.info(`  DESIGNATIONS:    ${desigDocs.length}`);
    logger.info('----------------------------------------');
    logger.info(`  TASK LIFECYCLE:  ${taskDocs.length} total`);
    logger.info(`    - Pending:     ${pendingCount} (not started)`);
    logger.info(`    - In Progress: ${inProgCount} (being worked on)`);
    logger.info(`    - Completed:   ${completedCount} (finished)`);
    logger.info(`    - Comments:    ${inProgressComments.length + completionComments.length}`);
    logger.info(`    - Approvals:   ${approvalRequests.length}`);
    logger.info('----------------------------------------');
    logger.info(`  PERFORMANCE:     ${perfDocs.length} scores`);
    logger.info(`    - Avg Score:   ${Math.round(perfDocs.reduce((a, b) => a + b.score, 0) / perfDocs.length)}%`);
    logger.info(`  ACTIVITY LOGS:   ${auditLogs.length}`);
    logger.info(`  AI AGENTS:       ${agents.length}`);
    logger.info('========================================');
    logger.info('LIFECYCLE FLOW: Created → In Progress → Completed');
    logger.info('Each phase is a separate loop in seed.ts — look for');
    logger.info('PHASE 1 (task creation), PHASE 2 (work start),');
    logger.info('PHASE 3 (completion), PHASE 4 (audit logging)');
    logger.info('========================================');

    logger.info('Seeding complete!');
  } catch (error) {
    logger.error('Seeding failed', { error });
    throw error;
  }
};

// Allow running directly via `tsx src/seed.ts`
const isMainModule = process.argv[1]?.endsWith('seed.ts');
if (isMainModule) {
  connectDB().then(() => seed().then(() => process.exit(0)).catch(() => process.exit(1)));
}
