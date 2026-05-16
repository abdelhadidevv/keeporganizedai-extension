import { describe, it, expect, beforeAll } from 'vitest';
import i18n from './config';

describe('i18n config', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('pt-BR');
  });

  it('resolves pt-BR without falling back to en', () => {
    expect(i18n.language).toBe('pt-BR');
    expect(i18n.t('cancel')).toBe('Cancelar');
    expect(i18n.t('lock_toggle.none')).toBe('Nenhum');
    expect(i18n.t('lock_toggle.hard_lock')).toBe('Bloqueio Fixo');
  });

  it('resolves en correctly', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('cancel')).toBe('Cancel');
    expect(i18n.t('lock_toggle.none')).toBe('None');
  });
});
