import './LegalDoc.css';
import mesLogo from '../assets/mes-logo.png';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <img src={mesLogo} alt="MES Electrical" />
        <div>
          <div className="legal-brand">MES Electrical CRM</div>
          <div className="legal-brand-sub">Privacy Policy</div>
        </div>
      </div>

      <div className="legal-body">
        <h1>Privacy Policy</h1>
        <p className="legal-effective-date">Effective date: July 2026</p>

        <div className="legal-notice">
          This policy describes how the MES Electrical CRM ("the CRM," "we," "our") handles data
          for the business operating it and its clients. It is written to accurately describe
          what the software does today, including its Gmail, Microsoft, and QuickBooks
          integrations.
        </div>

        <h2>1. Who this applies to</h2>
        <p>
          The CRM is operated by MES Electrical for its own business use — managing clients,
          jobs, scheduling, email, and accounting records. This policy covers data belonging to
          MES Electrical, its staff who use the CRM, and the clients/customers whose information
          is stored in it.
        </p>

        <h2>2. What we collect</h2>
        <ul>
          <li><strong>Client and job records:</strong> names, contact details, addresses, service history, quotes, invoices, and pricing entered directly into the CRM.</li>
          <li><strong>Account and staff data:</strong> name, email, and role for anyone with a login to the CRM.</li>
          <li><strong>Connected email accounts:</strong> if a staff member connects Gmail or Microsoft/Outlook, we access email needed to run the CRM's email features (viewing, sending, and organizing work-related messages). We do not access personal, non-work email accounts.</li>
          <li><strong>Connected accounting data:</strong> if QuickBooks Online is connected, we access customer, invoice, and payment records needed to keep the CRM and QuickBooks in sync.</li>
          <li><strong>Uploaded documents:</strong> if a document (PDF or Word file) is uploaded to extract client, job, or pricing information, the file is processed to extract that data and is deleted from our servers immediately after processing.</li>
        </ul>

        <h2>3. How we use this data</h2>
        <p>
          Data is used solely to operate the CRM for MES Electrical: managing client
          relationships, scheduling and tracking jobs, sending and organizing business email, and
          keeping accounting records in sync with QuickBooks. We do not sell data, and we do not
          use client data for advertising.
        </p>

        <h2>4. Third-party services we connect to</h2>
        <p>The CRM integrates with the following third-party services, each governed by its own
          privacy policy in addition to this one:</p>
        <ul>
          <li><strong>Google (Gmail, Calendar)</strong> — for connected Gmail accounts and calendar sync.</li>
          <li><strong>Microsoft (Outlook)</strong> — for connected Outlook accounts.</li>
          <li><strong>Intuit (QuickBooks Online)</strong> — for accounting sync (customers, invoices, payments).</li>
          <li><strong>OpenAI</strong> — used to extract structured information (e.g. client or job details) from uploaded documents and job-related emails. Only the content necessary for extraction is sent, and it is not used to train OpenAI's models.</li>
        </ul>
        <p>
          Access tokens for connected accounts are encrypted at rest. Disconnecting an account in
          the CRM revokes the CRM's access to it.
        </p>

        <h2>5. Data storage and security</h2>
        <p>
          Data is stored in a managed MongoDB Atlas database. Credentials and access tokens for
          connected accounts are encrypted before storage. Access to the CRM requires
          authentication, and administrative data (integrations, staff management) is restricted
          to admin-level accounts.
        </p>

        <h2>6. Data retention</h2>
        <p>
          Client and job records are retained for as long as MES Electrical uses the CRM to
          operate its business, or until deletion is requested. Uploaded documents used for data
          extraction are deleted immediately after processing and are not retained.
        </p>

        <h2>7. Your rights</h2>
        <p>
          Clients of MES Electrical, or staff with a CRM account, may request access to,
          correction of, or deletion of their data by contacting us using the details below.
        </p>

        <h2>8. Children's privacy</h2>
        <p>
          The CRM is a business tool and is not directed at children. We do not knowingly collect
          data from children under 13.
        </p>

        <h2>9. Changes to this policy</h2>
        <p>
          If this policy changes, the updated version will be posted at this same address with a
          new effective date.
        </p>

        <h2>10. Contact us</h2>
        <p>
          Questions about this policy or your data can be sent to MES Electrical at the contact
          information provided on our main site.
        </p>
      </div>

      <div className="legal-footer">
        This is a working policy describing the CRM's actual data practices. For a business
        handling real client and financial data, we recommend a qualified legal review before
        relying on this as a final, binding document.
      </div>
    </div>
  );
}
