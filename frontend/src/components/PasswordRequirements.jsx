import React from 'react';
import { validatePassword } from '../utils/passwordValidator';
import { Check, X } from 'lucide-react';

export const PasswordRequirements = ({ password = '', username = '' }) => {
  const { checks } = validatePassword(password, username);

  const rules = [
    { label: '8 to 64 characters', valid: checks.length },
    { label: 'At least one uppercase letter (A-Z)', valid: checks.uppercase },
    { label: 'At least one lowercase letter (a-z)', valid: checks.lowercase },
    { label: 'At least one number (0-9)', valid: checks.number },
    { label: 'At least one special character (!@#$%...)', valid: checks.special },
    { label: 'Must not contain username', valid: checks.noUsername },
    { label: 'Must not be a common password (e.g. Password@123)', valid: checks.notCommon }
  ];

  return (
    <div style={{
      background: 'var(--bg-secondary, #f8fafc)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: '6px',
      padding: '0.65rem 0.85rem',
      marginTop: '0.4rem',
      fontSize: '0.78rem'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted, #64748b)' }}>
        Password Requirements:
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.2rem' }}>
        {rules.map((rule, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: rule.valid ? '#16a34a' : (password ? '#dc2626' : '#64748b')
            }}
          >
            {rule.valid ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
