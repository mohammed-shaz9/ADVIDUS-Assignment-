import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import User from '../models/User.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

export const getDepartments = async () => {
  return Department.find().populate('head', 'name email').sort({ name: 1 });
};

export const getDepartmentTree = async () => {
  const all = await Department.find().populate('head', 'name email').lean();
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const dept of all) {
    map.set(dept._id.toString(), { ...dept, children: [] });
  }
  for (const dept of all) {
    const node = map.get(dept._id.toString());
    if (dept.parentId && map.has(dept.parentId.toString())) {
      map.get(dept.parentId.toString()).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

export const createDepartment = async (data: {
  name: string;
  description?: string;
  parentId?: string;
  head?: string;
}) => {
  const exists = await Department.findOne({ name: data.name });
  if (exists) throw new ValidationError('Department name already exists');
  return Department.create(data);
};

export const updateDepartment = async (id: string, data: Partial<{
  name: string; description: string; parentId: string; head: string; isActive: boolean;
}>) => {
  const dept = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('head', 'name email');
  if (!dept) throw new NotFoundError('Department');
  return dept;
};

export const deleteDepartment = async (id: string) => {
  const children = await Department.countDocuments({ parentId: id });
  if (children > 0) throw new ValidationError('Cannot delete department with sub-departments');
  const dept = await Department.findByIdAndDelete(id);
  if (!dept) throw new NotFoundError('Department');
  return dept;
};

export const getDesignations = async (departmentId?: string) => {
  const filter = departmentId ? { department: departmentId } : {};
  return Designation.find(filter).populate('department', 'name').sort({ level: 1 });
};

export const createDesignation = async (data: {
  title: string; level: number; department?: string; description?: string;
}) => {
  const exists = await Designation.findOne({ title: data.title });
  if (exists) throw new ValidationError('Designation title already exists');
  return Designation.create(data);
};

export const updateDesignation = async (id: string, data: Partial<{
  title: string; level: number; department: string; description: string; isActive: boolean;
}>) => {
  const desig = await Designation.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('department', 'name');
  if (!desig) throw new NotFoundError('Designation');
  return desig;
};

export const deleteDesignation = async (id: string) => {
  const desig = await Designation.findByIdAndDelete(id);
  if (!desig) throw new NotFoundError('Designation');
  return desig;
};

// Headcount of the caller's own department — lets employees see peers without ever receiving the user list.
export const getMyDepartmentStats = async (userId: string) => {
  const me = await User.findById(userId).select('department').lean();
  if (!me?.department) return null;
  const rows = await User.aggregate([
    { $match: { department: me.department } },
    { $group: { _id: { status: '$status', role: '$role' }, n: { $sum: 1 } } },
  ]);
  const out = { total: 0, active: 0, inactive: 0, roles: {} as Record<string, number> };
  for (const r of rows) {
    out.total += r.n;
    out[r._id.status === 'active' ? 'active' : 'inactive'] += r.n;
    out.roles[r._id.role] = (out.roles[r._id.role] ?? 0) + r.n;
  }
  return out;
};

export const getOrgChart = async () => {
  const departments = await getDepartmentTree();
  // Capped sample + exact per-department headcount; the full 60k roster is served by /admin/users (paged).
  const [users, counts] = await Promise.all([
    User.find({ status: 'active' }).select('name email role designation department').limit(500).lean(),
    User.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
  ]);
  const departmentCounts = Object.fromEntries(counts.map((c) => [c._id ? String(c._id) : 'none', c.count]));
  return { departments, users, departmentCounts };
};
