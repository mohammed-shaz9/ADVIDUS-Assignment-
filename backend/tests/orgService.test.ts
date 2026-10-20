import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/User.js', () => ({ default: { findById: vi.fn(), aggregate: vi.fn() } }));
vi.mock('../src/models/Department.js', () => ({ default: {} }));
vi.mock('../src/models/Designation.js', () => ({ default: {} }));

import User from '../src/models/User.js';
import { getMyDepartmentStats } from '../src/services/orgService.js';

const me = (department: unknown) =>
  vi.mocked(User.findById).mockReturnValue({ select: () => ({ lean: () => Promise.resolve({ department }) }) } as any);

describe('getMyDepartmentStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when the user has no department (no aggregate run)', async () => {
    me(null);
    expect(await getMyDepartmentStats('u1')).toBeNull();
    expect(User.aggregate).not.toHaveBeenCalled();
  });

  it('folds status/role groups into totals', async () => {
    me('dept1');
    vi.mocked(User.aggregate).mockResolvedValue([
      { _id: { status: 'active', role: 'user' }, n: 7 },
      { _id: { status: 'inactive', role: 'user' }, n: 2 },
      { _id: { status: 'active', role: 'admin' }, n: 1 },
    ]);
    expect(await getMyDepartmentStats('u1')).toEqual({ total: 10, active: 8, inactive: 2, roles: { user: 9, admin: 1 } });
  });
});
