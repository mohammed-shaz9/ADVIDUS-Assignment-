import { describe, it, expect, vi } from 'vitest';
import { EMAIL_RE, validateRegister, validateLogin } from '../src/middleware/validator.js';

describe('EMAIL_RE', () => {
  it.each(['a@b.tech', 'a@b.co.in', 'first.last+tag@sub.example.online', 'a@b.io'])('accepts %s', (e) => {
    expect(EMAIL_RE.test(e)).toBe(true);
  });

  it.each(['a b@c.com', 'a@b .com', 'a@b.com ', 'abc.com', '@b.com', 'a@', 'a@b', 'a@b.c', 'a@@b.com', ''])(
    'rejects %j',
    (e) => {
      expect(EMAIL_RE.test(e)).toBe(false);
    }
  );

  it('ReDoS guard: 10k-char near-miss finishes fast', () => {
    const evil = 'a'.repeat(10000) + '!';
    const t = performance.now();
    expect(EMAIL_RE.test(evil)).toBe(false);
    expect(performance.now() - t).toBeLessThan(50);
  });

  it('ReDoS guard: 10k-char near-miss with @ and dots finishes fast', () => {
    const evil = 'a@' + 'a.'.repeat(5000) + ' ';
    const t = performance.now();
    expect(EMAIL_RE.test(evil)).toBe(false);
    expect(performance.now() - t).toBeLessThan(50);
  });
});

describe('validateRegister / validateLogin', () => {
  const run = (fn: typeof validateRegister, body: Record<string, unknown>) => {
    const req: any = { body };
    const next = vi.fn();
    const call = () => fn(req, {} as any, next);
    return { req, next, call };
  };

  it('register normalizes name and email', () => {
    const { req, next, call } = run(validateRegister, { name: ' Al ', email: ' Al@Ex.Tech ', password: 'secret1' });
    call();
    expect(next).toHaveBeenCalled();
    expect(req.body).toMatchObject({ name: 'Al', email: 'al@ex.tech' });
  });

  it('register rejects bad email / short password / blank name', () => {
    expect(run(validateRegister, { name: 'A', email: 'a b@c.com', password: 'secret1' }).call).toThrow('valid email');
    expect(run(validateRegister, { name: 'A', email: 'a@b.com', password: '123' }).call).toThrow('6 characters');
    expect(run(validateRegister, { name: '  ', email: 'a@b.com', password: 'secret1' }).call).toThrow('name');
  });

  it('login rejects non-string email (object injection) and blank password', () => {
    expect(run(validateLogin, { email: { $ne: '' }, password: 'x' }).call).toThrow('valid email');
    expect(run(validateLogin, { email: 'a@b.com', password: '  ' }).call).toThrow('Password');
  });

  it('login lowercases email', () => {
    const { req, call } = run(validateLogin, { email: 'A@B.COM', password: 'x' });
    call();
    expect(req.body.email).toBe('a@b.com');
  });
});
