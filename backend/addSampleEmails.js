const mongoose = require('mongoose');
require('dotenv').config();

const Email = require('./src/models/Email');
const User = require('./src/models/User');

async function addSampleEmails() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get the admin user
    const admin = await User.findOne({ email: 'developer@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    // Create a dummy email account ID (we'll use the admin's ID)
    const dummyAccountId = new mongoose.Types.ObjectId();

    // Sample priority emails
    const sampleEmails = [
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `demo-urgent-panel-${Date.now()}`,
        from: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'URGENT: Panel Upgrade Needed - Residential',
        body: {
          text: 'Hi, I need an urgent panel upgrade for my home. The current panel is overloaded and I\'m experiencing frequent circuit breaker trips. This needs to be done ASAP as I work from home and need reliable power. Can you provide a quote and schedule this week? Address: 123 Oak Street, Springfield.',
          html: '<p>Hi, I need an urgent panel upgrade for my home. The current panel is overloaded and I\'m experiencing frequent circuit breaker trips. This needs to be done ASAP as I work from home and need reliable power.</p><p>Can you provide a quote and schedule this week?</p><p>Address: 123 Oak Street, Springfield.</p>'
        },
        snippet: 'Hi, I need an urgent panel upgrade for my home. The current panel is overloaded...',
        date: new Date(),
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `demo-ev-charger-${Date.now()}`,
        from: {
          name: 'Michael Chen',
          email: 'mchen@techcorp.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'EV Charger Installation Quote Request',
        body: {
          text: 'Hello, I just purchased a Tesla Model Y and need a Level 2 EV charger installed in my garage. I\'d like to get a quote for installation including any necessary electrical work. My garage is detached and about 50 feet from the main panel. Looking to get this done within the next 2 weeks. Please let me know your availability and pricing. Thanks!',
          html: '<p>Hello, I just purchased a Tesla Model Y and need a Level 2 EV charger installed in my garage.</p><p>I\'d like to get a quote for installation including any necessary electrical work. My garage is detached and about 50 feet from the main panel.</p><p>Looking to get this done within the next 2 weeks. Please let me know your availability and pricing.</p><p>Thanks!</p>'
        },
        snippet: 'Hello, I just purchased a Tesla Model Y and need a Level 2 EV charger...',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `demo-outlet-install-${Date.now()}`,
        from: {
          name: 'Restaurant Manager',
          email: 'manager@bistro22.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Commercial Outlet Installation - Restaurant',
        body: {
          text: 'We need to install 6 additional outlets in our restaurant kitchen for new equipment. We also need a dedicated 240V circuit for a commercial oven. Can you come by for a site visit this week to provide an estimate? We\'re looking to complete this work before our health inspection next month. Restaurant address: 456 Main Street, Downtown.',
          html: '<p>We need to install 6 additional outlets in our restaurant kitchen for new equipment. We also need a dedicated 240V circuit for a commercial oven.</p><p>Can you come by for a site visit this week to provide an estimate?</p><p>We\'re looking to complete this work before our health inspection next month.</p><p>Restaurant address: 456 Main Street, Downtown.</p>'
        },
        snippet: 'We need to install 6 additional outlets in our restaurant kitchen...',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        isRead: false,
        isWorkRelated: true,
        isStarred: true,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `demo-rewiring-${Date.now()}`,
        from: {
          name: 'David Martinez',
          email: 'david.m.homeowner@gmail.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Whole House Rewiring Quote - Old Home',
        body: {
          text: 'Hi, I recently purchased a 1960s home and the inspector recommended rewiring the entire house. The current wiring is outdated and potentially hazardous. I need a comprehensive quote for rewiring all rooms, updating the panel, and bringing everything up to current code. The house is approximately 2,000 square feet, 3 bedrooms, 2 bathrooms. Would appreciate if you could schedule a walkthrough. Thank you.',
          html: '<p>Hi, I recently purchased a 1960s home and the inspector recommended rewiring the entire house. The current wiring is outdated and potentially hazardous.</p><p>I need a comprehensive quote for rewiring all rooms, updating the panel, and bringing everything up to current code.</p><p>The house is approximately 2,000 square feet, 3 bedrooms, 2 bathrooms.</p><p>Would appreciate if you could schedule a walkthrough. Thank you.</p>'
        },
        snippet: 'Hi, I recently purchased a 1960s home and the inspector recommended rewiring...',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `demo-lighting-${Date.now()}`,
        from: {
          name: 'Jennifer Smith',
          email: 'jsmith.design@outlook.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'LED Lighting Installation - Home Office',
        body: {
          text: 'Hello, I\'m remodeling my home office and need help with lighting installation. I want to install recessed LED lighting (8-10 fixtures), under-cabinet LED strips, and some accent lighting. I also need a few additional outlets installed. Can you provide a quote and timeline? I\'d like to start in about 3 weeks. My office is about 200 sq ft.',
          html: '<p>Hello, I\'m remodeling my home office and need help with lighting installation.</p><p>I want to install:</p><ul><li>Recessed LED lighting (8-10 fixtures)</li><li>Under-cabinet LED strips</li><li>Accent lighting</li></ul><p>I also need a few additional outlets installed.</p><p>Can you provide a quote and timeline? I\'d like to start in about 3 weeks. My office is about 200 sq ft.</p>'
        },
        snippet: 'Hello, I\'m remodeling my home office and need help with lighting...',
        date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      }
    ];

    // Insert sample emails
    console.log(`\nAdding ${sampleEmails.length} sample priority emails...`);

    for (const emailData of sampleEmails) {
      try {
        await Email.create(emailData);
        console.log(`✓ Added: ${emailData.subject}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⊘ Skipped (already exists): ${emailData.subject}`);
        } else {
          console.log(`✗ Error adding ${emailData.subject}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Sample emails added successfully!');
    console.log('\nYou can now:');
    console.log('1. Click the golden bell icon (🔔) in the bottom right corner');
    console.log('2. View the AI-analyzed job opportunities');
    console.log('3. Approve jobs or send quotes directly from the popup\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSampleEmails();
