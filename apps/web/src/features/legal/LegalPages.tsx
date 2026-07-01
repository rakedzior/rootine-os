import type { ReactNode } from 'react';

type LegalPageProps = {
  title: string;
  children: ReactNode;
};

const appUrl = 'https://rootine-os.ra-kedzior.workers.dev';
const contactEmail = 'ra.kedzior@gmail.com';

function LegalPage({ title, children }: LegalPageProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '48px 20px',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <article
        style={{
          width: 'min(860px, 100%)',
          margin: '0 auto',
          padding: '32px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--surface)',
          lineHeight: 1.7,
        }}
      >
        <p className="auth-sub" style={{ textAlign: 'left', marginBottom: 8 }}>
          Rootine OS
        </p>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p style={{ color: 'var(--ink-2)' }}>Last updated: July 1, 2026</p>
        {children}
      </article>
    </main>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Rootine OS is a personal productivity and life management application. We use Supabase
        for authentication, account storage, and application data storage.
      </p>
      <h2>Data we collect</h2>
      <p>
        When you create an account or sign in with Google or Facebook, we may receive your
        email address, provider account identifier, display name, and profile information made
        available by the provider. Inside the app, you may add personal notes, tasks, goals, health,
        finance, travel, work, and other personal planning data.
      </p>
      <h2>How we use data</h2>
      <p>
        We use your data to provide the app, authenticate your account, sync your information,
        maintain security, and support account export or deletion requests. We do not sell personal
        data.
      </p>
      <h2>Third-party providers</h2>
      <p>
        Login and optional integrations may use providers such as Google, Facebook,
        Supabase, and Cloudflare. Their services process data according to their own policies.
      </p>
      <h2>Contact</h2>
      <p>
        Questions or privacy requests can be sent to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalPage>
  );
}

export function TermsOfService() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        By using Rootine OS, you agree to use the service responsibly and only for lawful personal
        productivity and life management purposes.
      </p>
      <h2>Your account</h2>
      <p>
        You are responsible for keeping access to your account secure. You should not share your
        login credentials or use another person's account without permission.
      </p>
      <h2>Your content</h2>
      <p>
        You keep ownership of the personal data you add to Rootine OS. You grant the service the
        limited permission needed to store, display, sync, export, and delete that data as part of
        the app.
      </p>
      <h2>Availability</h2>
      <p>
        Rootine OS is provided as-is. We may update, change, or discontinue features over time.
      </p>
      <h2>Contact</h2>
      <p>
        Questions can be sent to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalPage>
  );
}

export function DeleteData() {
  return (
    <LegalPage title="User Data Deletion">
      <p>
        You can request deletion of your Rootine OS account and associated application data at any
        time.
      </p>
      <h2>Delete from inside the app</h2>
      <p>
        Sign in to Rootine OS at <a href={appUrl}>{appUrl}</a>, open Settings, then use the account
        deletion option if it is available for your account.
      </p>
      <h2>Delete by email request</h2>
      <p>
        Send an email to <a href={`mailto:${contactEmail}`}>{contactEmail}</a> from the email address
        connected to your Rootine OS account. Use the subject line "Delete my Rootine OS data".
      </p>
      <p>
        After verification, we will delete or anonymize account data associated with your account,
        except where retention is required for security, abuse prevention, legal compliance, or
        backup integrity.
      </p>
    </LegalPage>
  );
}
