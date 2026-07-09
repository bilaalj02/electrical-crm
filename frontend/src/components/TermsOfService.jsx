import './LegalDoc.css';
import mesLogo from '../assets/mes-logo.png';

export default function TermsOfService() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <img src={mesLogo} alt="MES Electrical" />
        <div>
          <div className="legal-brand">MES Electrical CRM</div>
          <div className="legal-brand-sub">Terms of Service &amp; End-User License Agreement</div>
        </div>
      </div>

      <div className="legal-body">
        <h1>Terms of Service</h1>
        <p className="legal-effective-date">Effective date: July 2026</p>

        <div className="legal-notice">
          These terms cover use of the MES Electrical CRM ("the CRM"), including its optional
          integrations with Gmail, Microsoft/Outlook, and QuickBooks Online.
        </div>

        <h2>1. Acceptance of terms</h2>
        <p>
          By logging into and using the CRM, you agree to these terms. If you're using the CRM on
          behalf of a business, you're agreeing on that business's behalf.
        </p>

        <h2>2. What the CRM does</h2>
        <p>
          The CRM is an internal business tool for managing clients, jobs, scheduling, email, and
          accounting records for an electrical contracting business. It optionally connects to:
        </p>
        <ul>
          <li>Gmail and Microsoft/Outlook, to send, receive, and organize work email from within the CRM.</li>
          <li>QuickBooks Online, to sync customers, invoices, and payments between the CRM and your accounting records.</li>
          <li>Document upload and AI-assisted extraction, to pull client, job, and pricing information out of uploaded PDF or Word files for review before it's added to the CRM.</li>
        </ul>

        <h2>3. Your account</h2>
        <p>
          You're responsible for keeping your login credentials secure and for activity that
          happens under your account. Admin-level accounts can manage integrations and other
          staff accounts — access to those features should be limited to people who need it.
        </p>

        <h2>4. Connecting third-party accounts</h2>
        <p>
          When you connect Gmail, Outlook, or QuickBooks, you're authorizing the CRM to access
          that account on your behalf, using the access you grant during that provider's own
          sign-in and authorization flow. We never see or store your password for these
          providers — only the access token they issue, which is encrypted before storage. You
          can disconnect any of these accounts at any time from the Integrations page, which
          revokes the CRM's access.
        </p>
        <p>
          Your use of Gmail, Microsoft, QuickBooks/Intuit, and any other connected service is also
          governed by that provider's own terms of service, separate from these terms.
        </p>

        <h2>5. Data extracted from uploaded documents</h2>
        <p>
          When a document is uploaded for data extraction, nothing is added to the CRM
          automatically — extracted client, job, and pricing information is shown for review, and
          only the records you approve are saved. Uploaded files are deleted from our servers
          immediately after processing.
        </p>

        <h2>6. Acceptable use</h2>
        <p>You agree not to use the CRM to:</p>
        <ul>
          <li>Access data you're not authorized to access, including other users' accounts.</li>
          <li>Upload or process documents you don't have the right to use.</li>
          <li>Interfere with the CRM's operation or attempt to bypass its access controls.</li>
        </ul>

        <h2>7. Data ownership</h2>
        <p>
          All client, job, and business data entered into or synced with the CRM belongs to the
          business operating it. Connecting a third-party service like QuickBooks does not
          transfer ownership of that data to us — it's simply synced between systems you already
          control.
        </p>

        <h2>8. Availability and changes</h2>
        <p>
          We aim to keep the CRM available and working correctly, but we don't guarantee
          uninterrupted access, and features may change or be added over time as the CRM
          evolves.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          The CRM is provided as an internal business tool on an "as is" basis. To the extent
          permitted by law, we are not liable for indirect or consequential damages arising from
          its use, including issues originating from connected third-party services (Google,
          Microsoft, Intuit, OpenAI) that are outside our control.
        </p>

        <h2>10. Termination</h2>
        <p>
          Access to the CRM can be revoked for any account at the discretion of MES Electrical's
          administrators, including for violation of these terms.
        </p>

        <h2>11. Changes to these terms</h2>
        <p>
          If these terms change, the updated version will be posted at this same address with a
          new effective date.
        </p>

        <h2>12. Contact us</h2>
        <p>
          Questions about these terms can be sent to MES Electrical at the contact information
          provided on our main site.
        </p>
      </div>

      <div className="legal-footer">
        This is a working terms document describing the CRM's actual functionality. For a
        business handling real client and financial data, we recommend a qualified legal review
        before relying on this as a final, binding document.
      </div>
    </div>
  );
}
