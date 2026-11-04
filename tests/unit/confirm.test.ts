import { describe, expect, it } from 'vitest';
import { parseConfirmSearch } from '../../src/auth/confirmFlow';

const hash = 'abcdefghijklmnopqrst';

describe('confirmación', () => {
  it('acepta un hash y un tipo', () => {
    expect(parseConfirmSearch(`?token_hash=${hash}&type=signup`)).toEqual({
      status: 'ready',
      type: 'signup',
    });
    expect(parseConfirmSearch(`token_hash=${hash}&type=recovery`)).toEqual({
      status: 'ready',
      type: 'recovery',
    });
  });

  it('rechaza duplicados, tipos ajenos y parámetros extra', () => {
    expect(parseConfirmSearch(`?token_hash=${hash}&token_hash=${hash}&type=signup`).status).toBe(
      'invalid',
    );
    expect(parseConfirmSearch(`?token_hash=${hash}&type=magiclink`).status).toBe('invalid');
    expect(parseConfirmSearch(`?token_hash=${hash}&type=signup&next=/cuenta`).status).toBe(
      'invalid',
    );
    expect(parseConfirmSearch('?type=signup').status).toBe('invalid');
  });
});
