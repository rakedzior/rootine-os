import { useCallback, useMemo, useRef, useState } from 'react';
import { Field, Modal } from '@/components/common';
import { toast } from '@/lib/toast';
import { getVerifiedTotpFactorId, needsMfaStepUp, verifyTotpCode } from './mfa';

type PendingChallenge = {
  resolve: (verified: boolean) => void;
};

export function useMfaStepUp() {
  const pending = useRef<PendingChallenge | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const close = useCallback((verified = false) => {
    pending.current?.resolve(verified);
    pending.current = null;
    setOpen(false);
    setCode('');
    setFactorId(null);
    setVerifying(false);
  }, []);

  const ensureMfa = useCallback(async () => {
    if (!(await needsMfaStepUp())) return true;

    const verifiedFactorId = await getVerifiedTotpFactorId();
    if (!verifiedFactorId) {
      toast.error('Najpierw włącz MFA w ustawieniach bezpieczeństwa.');
      return false;
    }

    setFactorId(verifiedFactorId);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      pending.current = { resolve };
    });
  }, []);

  const submit = useCallback(async () => {
    if (!factorId || code.trim().length < 6) return;
    setVerifying(true);
    const { error } = await verifyTotpCode(factorId, code.trim());
    if (error) {
      toast.error('Kod MFA jest nieprawidłowy.');
      setVerifying(false);
      return;
    }
    toast.success('MFA potwierdzone');
    close(true);
  }, [close, code, factorId]);

  const mfaStepUpModal = useMemo(() => (
    <Modal
      open={open}
      onClose={() => close(false)}
      title="Potwierdź MFA"
      footer={(
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => close(false)} disabled={verifying}>
            Anuluj
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void submit()}
            disabled={verifying || code.trim().length < 6}
          >
            {verifying ? 'Sprawdzanie...' : 'Potwierdź'}
          </button>
        </>
      )}
    >
      <Field label="Kod z aplikacji uwierzytelniającej">
        <input
          className="input"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit();
          }}
          autoFocus
        />
      </Field>
    </Modal>
  ), [close, code, open, submit, verifying]);

  return { ensureMfa, mfaStepUpModal };
}
