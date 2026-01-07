const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('./src/models/Job');
const Client = require('./src/models/Client');
const User = require('./src/models/User');
const Email = require('./src/models/Email');

async function populateDemoData() {
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB Atlas\n');

    // Get admin user
    const admin = await User.findOne({ email: 'developer@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found. Run createAdmin.js first.');
      process.exit(1);
    }

    // Clear existing demo data (optional - comment out to keep existing data)
    console.log('Clearing existing demo data...');
    await Job.deleteMany({});
    await Client.deleteMany({});
    await Email.deleteMany({});
    console.log('✓ Cleared old data\n');

    // ========================================
    // CREATE CLIENTS
    // ========================================
    console.log('📋 Creating demo clients...');

    const clients = await Client.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@residentialclient.com',
        phone: '(555) 123-4567',
        address: {
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701'
        },
        clientType: 'residential',
        status: 'active',
        source: 'referral'
      },
      {
        name: 'Michael Chen',
        email: 'mchen@techcorp.com',
        phone: '(555) 234-5678',
        address: {
          street: '456 Tech Drive',
          city: 'Innovation Park',
          state: 'IL',
          zipCode: '62702'
        },
        clientType: 'commercial',
        status: 'active',
        source: 'website'
      },
      {
        name: 'Bistro 22 Restaurant',
        email: 'manager@bistro22.com',
        phone: '(555) 345-6789',
        address: {
          street: '789 Main Street',
          city: 'Downtown',
          state: 'IL',
          zipCode: '62703'
        },
        clientType: 'commercial',
        status: 'active',
        source: 'email'
      },
      {
        name: 'David Martinez',
        email: 'david.m.homeowner@gmail.com',
        phone: '(555) 456-7890',
        address: {
          street: '321 Maple Avenue',
          city: 'Oldtown',
          state: 'IL',
          zipCode: '62704'
        },
        clientType: 'residential',
        status: 'active',
        source: 'website'
      },
      {
        name: 'Jennifer Smith',
        email: 'jsmith.design@outlook.com',
        phone: '(555) 567-8901',
        address: {
          street: '654 Creative Lane',
          city: 'Art District',
          state: 'IL',
          zipCode: '62705'
        },
        clientType: 'residential',
        status: 'prospect',
        source: 'referral'
      }
    ]);

    console.log(`✓ Created ${clients.length} clients\n`);

    // ========================================
    // CREATE JOBS WITH FULL FINANCIAL DATA
    // ========================================
    console.log('💼 Creating demo jobs with financial data...');

    const jobsData = [
      {
        title: 'Panel Upgrade - 200A Service',
        description: 'Complete electrical panel upgrade from 100A to 200A. Replace outdated breakers, add GFCI protection for kitchen and bathrooms, ensure code compliance.',
        client: clients[0]._id,
        status: 'completed',
        priority: 'high',
        location: {
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701'
        },
        scheduledDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        costs: {
          laborHours: 8,
          laborRate: 85,
          materials: [
            { name: '200A Panel Box (Square D)', quantity: 1, unitPrice: 450, totalPrice: 450 },
            { name: 'GFCI Breakers (20A)', quantity: 4, unitPrice: 45, totalPrice: 180 },
            { name: 'Standard Breakers', quantity: 6, unitPrice: 25, totalPrice: 150 },
            { name: 'Wire & Conduit', quantity: 1, unitPrice: 180, totalPrice: 180 }
          ],
          equipment: [
            { name: 'Panel Installation Kit', cost: 75 }
          ],
          permitsCost: 150,
          subcontractorsCost: 0,
          otherCosts: 50,
          taxRate: 0.0825,
          discount: 0
        },
        actualExpenses: {
          laborHours: 7.5,
          laborRate: 85,
          materials: [
            { name: '200A Panel Box (Square D)', quantity: 1, unitPrice: 450, totalPrice: 450 },
            { name: 'GFCI Breakers (20A)', quantity: 4, unitPrice: 45, totalPrice: 180 },
            { name: 'Standard Breakers', quantity: 6, unitPrice: 22, totalPrice: 132 },
            { name: 'Wire & Conduit', quantity: 1, unitPrice: 165, totalPrice: 165 }
          ],
          equipment: [
            { name: 'Panel Installation Kit', cost: 75 }
          ],
          permitsCost: 150,
          subcontractorsCost: 0,
          otherCosts: 40,
          taxRate: 0.0825,
          discount: 0,
          enteredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          enteredBy: 'Developer Admin'
        },
        payment: {
          method: 'check',
          depositAmount: 500,
          amountPaid: 1850,
          terms: 'Net 30'
        }
      },
      {
        title: 'Commercial Kitchen Electrical - Restaurant',
        description: 'Install 6 new 120V outlets for kitchen equipment, 1 dedicated 240V/50A circuit for commercial oven, update wiring to code.',
        client: clients[2]._id,
        status: 'completed',
        priority: 'medium',
        location: {
          street: '789 Main Street',
          city: 'Downtown',
          state: 'IL',
          zipCode: '62703'
        },
        scheduledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        costs: {
          laborHours: 12,
          laborRate: 95,
          materials: [
            { name: 'Commercial Grade Outlets (20A)', quantity: 6, unitPrice: 28, totalPrice: 168 },
            { name: '240V Circuit Breaker (50A)', quantity: 1, unitPrice: 75, totalPrice: 75 },
            { name: 'Heavy Duty Conduit & Wire', quantity: 1, unitPrice: 320, totalPrice: 320 },
            { name: 'Junction Boxes (Metal)', quantity: 7, unitPrice: 18, totalPrice: 126 }
          ],
          equipment: [
            { name: 'Conduit Bender', cost: 85 },
            { name: 'Commercial Drilling Kit', cost: 45 }
          ],
          permitsCost: 225,
          subcontractorsCost: 0,
          otherCosts: 120,
          taxRate: 0.0825,
          discount: 100
        },
        actualExpenses: {
          laborHours: 11,
          laborRate: 95,
          materials: [
            { name: 'Commercial Grade Outlets (20A)', quantity: 6, unitPrice: 28, totalPrice: 168 },
            { name: '240V Circuit Breaker (50A)', quantity: 1, unitPrice: 75, totalPrice: 75 },
            { name: 'Heavy Duty Conduit & Wire', quantity: 1, unitPrice: 295, totalPrice: 295 },
            { name: 'Junction Boxes (Metal)', quantity: 7, unitPrice: 18, totalPrice: 126 }
          ],
          equipment: [
            { name: 'Conduit Bender', cost: 85 },
            { name: 'Commercial Drilling Kit', cost: 45 }
          ],
          permitsCost: 225,
          subcontractorsCost: 0,
          otherCosts: 95,
          taxRate: 0.0825,
          discount: 100,
          enteredAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          enteredBy: 'Developer Admin'
        },
        payment: {
          method: 'credit-card',
          depositAmount: 700,
          amountPaid: 2154,
          terms: 'Net 30'
        }
      },
      {
        title: 'EV Charger Installation - Tesla Wall Connector',
        description: 'Install Level 2 EV charger in detached garage. Run dedicated 240V/48A circuit from main panel, 50ft distance.',
        client: clients[1]._id,
        status: 'in-progress',
        priority: 'medium',
        location: {
          street: '456 Tech Drive',
          city: 'Innovation Park',
          state: 'IL',
          zipCode: '62702'
        },
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        costs: {
          laborHours: 6,
          laborRate: 85,
          materials: [
            { name: 'Tesla Wall Connector (48A)', quantity: 1, unitPrice: 550, totalPrice: 550 },
            { name: '50A Circuit Breaker', quantity: 1, unitPrice: 48, totalPrice: 48 },
            { name: '6/3 Wire (50ft)', quantity: 1, unitPrice: 285, totalPrice: 285 },
            { name: 'Weather-Resistant Box', quantity: 1, unitPrice: 42, totalPrice: 42 }
          ],
          equipment: [
            { name: 'Trenching Tools', cost: 65 }
          ],
          permitsCost: 125,
          subcontractorsCost: 200,
          otherCosts: 75,
          taxRate: 0.0825,
          discount: 0
        },
        payment: {
          method: 'bank-transfer',
          depositAmount: 600,
          amountPaid: 600,
          terms: 'Due on completion'
        }
      },
      {
        title: 'Whole House Rewiring - 1960s Home',
        description: 'Complete rewiring of 2,000 sq ft home. Replace all outlets, switches, fixtures. Update panel to 200A. Bring to current code.',
        client: clients[3]._id,
        status: 'approved',
        priority: 'high',
        location: {
          street: '321 Maple Avenue',
          city: 'Oldtown',
          state: 'IL',
          zipCode: '62704'
        },
        quoteDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        approvalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        costs: {
          laborHours: 80,
          laborRate: 85,
          materials: [
            { name: '200A Main Panel', quantity: 1, unitPrice: 480, totalPrice: 480 },
            { name: 'Romex Wire (Various)', quantity: 1, unitPrice: 1850, totalPrice: 1850 },
            { name: 'Outlets & Switches', quantity: 1, unitPrice: 420, totalPrice: 420 },
            { name: 'Junction Boxes', quantity: 1, unitPrice: 280, totalPrice: 280 },
            { name: 'Light Fixtures', quantity: 1, unitPrice: 650, totalPrice: 650 }
          ],
          equipment: [
            { name: 'Fish Tape & Tools', cost: 150 },
            { name: 'Drywall Repair Kit', cost: 95 }
          ],
          permitsCost: 450,
          subcontractorsCost: 800,
          otherCosts: 300,
          taxRate: 0.0825,
          discount: 500
        },
        payment: {
          method: 'check',
          depositAmount: 3000,
          amountPaid: 3000,
          terms: 'Net 30'
        }
      },
      {
        title: 'LED Lighting Retrofit - Home Office',
        description: 'Install 10 recessed LED lights, under-cabinet LED strips, dimmer controls, and 2 additional outlets.',
        client: clients[4]._id,
        status: 'quote',
        priority: 'low',
        location: {
          street: '654 Creative Lane',
          city: 'Art District',
          state: 'IL',
          zipCode: '62705'
        },
        quoteDate: new Date(),
        costs: {
          laborHours: 8,
          laborRate: 85,
          materials: [
            { name: 'Recessed LED Fixtures', quantity: 10, unitPrice: 45, totalPrice: 450 },
            { name: 'LED Strip Lights (15ft)', quantity: 2, unitPrice: 65, totalPrice: 130 },
            { name: 'Smart Dimmer Switches', quantity: 2, unitPrice: 85, totalPrice: 170 },
            { name: 'Outlets & Wiring', quantity: 1, unitPrice: 95, totalPrice: 95 }
          ],
          equipment: [
            { name: 'Hole Saw Kit', cost: 45 }
          ],
          permitsCost: 0,
          subcontractorsCost: 0,
          otherCosts: 60,
          taxRate: 0.0825,
          discount: 0
        },
        payment: {
          method: 'cash',
          depositAmount: 0,
          amountPaid: 0,
          terms: 'Due on completion'
        }
      },
      {
        title: 'Emergency Repair - Electrical Fire Hazard',
        description: 'Emergency service: Replace damaged wiring causing sparking, update faulty breaker, inspect entire circuit for safety.',
        client: clients[0]._id,
        status: 'completed',
        priority: 'urgent',
        location: {
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701'
        },
        scheduledDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        costs: {
          laborHours: 3,
          laborRate: 125, // Emergency rate
          materials: [
            { name: 'Emergency Wiring Kit', quantity: 1, unitPrice: 85, totalPrice: 85 },
            { name: 'Circuit Breaker', quantity: 1, unitPrice: 35, totalPrice: 35 }
          ],
          equipment: [],
          permitsCost: 0,
          subcontractorsCost: 0,
          otherCosts: 50,
          taxRate: 0.0825,
          discount: 0
        },
        actualExpenses: {
          laborHours: 3,
          laborRate: 125,
          materials: [
            { name: 'Emergency Wiring Kit', quantity: 1, unitPrice: 85, totalPrice: 85 },
            { name: 'Circuit Breaker', quantity: 1, unitPrice: 35, totalPrice: 35 }
          ],
          equipment: [],
          permitsCost: 0,
          subcontractorsCost: 0,
          otherCosts: 50,
          taxRate: 0.0825,
          discount: 0,
          enteredAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          enteredBy: 'Developer Admin'
        },
        payment: {
          method: 'credit-card',
          depositAmount: 0,
          amountPaid: 558,
          terms: 'Immediate'
        }
      }
    ];

    // Create jobs with proper job numbers
    const createdJobs = [];
    for (const jobData of jobsData) {
      const jobNumber = await Job.generateJobNumber();
      const job = new Job({ ...jobData, jobNumber });
      await job.save();

      // Update client's jobs array
      await Client.findByIdAndUpdate(job.client, {
        $addToSet: { jobs: job._id }
      });

      createdJobs.push(job);
      console.log(`  ✓ ${job.jobNumber}: ${job.title}`);
    }

    console.log(`\n✓ Created ${createdJobs.length} jobs with full financial data\n`);

    // ========================================
    // CREATE AI-PRIORITIZED EMAILS
    // ========================================
    console.log('📧 Creating AI-prioritized emails with revenue estimates...');

    const dummyAccountId = new mongoose.Types.ObjectId();

    const emails = await Email.create([
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `priority-commercial-hvac-${Date.now()}`,
        from: {
          name: 'Metro HVAC Systems',
          email: 'procurement@metrohvac.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Large Commercial HVAC Project - Electrical Subcontractor Needed',
        body: {
          text: 'We have a large commercial HVAC installation project at a 50,000 sq ft office building. We need an electrical subcontractor to handle all electrical work including: main service upgrade to 400A, dedicated circuits for 12 HVAC units, control wiring, and integration with building management system. Project budget is $45,000-$60,000 for electrical work. Timeline: 6 weeks starting next month. Please provide quote and availability.',
          html: '<p>We have a large commercial HVAC installation project at a 50,000 sq ft office building.</p><p><strong>Electrical work needed:</strong></p><ul><li>Main service upgrade to 400A</li><li>Dedicated circuits for 12 HVAC units</li><li>Control wiring</li><li>Building management system integration</li></ul><p><strong>Budget:</strong> $45,000-$60,000</p><p><strong>Timeline:</strong> 6 weeks starting next month</p><p>Please provide quote and availability.</p>'
        },
        snippet: 'Large commercial HVAC project - electrical subcontractor needed. Budget $45k-$60k...',
        date: new Date(),
        isRead: false,
        isWorkRelated: true,
        isStarred: true,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `priority-solar-install-${Date.now()}`,
        from: {
          name: 'SunPower Residential',
          email: 'contracts@sunpower-local.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Solar Installation - Electrical Connection Required',
        body: {
          text: 'We need an electrician to handle the grid connection for a 10kW residential solar installation. Scope: Install AC disconnect, run conduit from inverter to main panel, update panel with solar breaker, coordinate with utility for final inspection. Est. value: $2,500-$3,500. Customer address: 890 Sunnyview Drive. Preferred completion within 2 weeks.',
          html: '<p>We need an electrician for grid connection on a 10kW residential solar installation.</p><p><strong>Scope:</strong></p><ul><li>Install AC disconnect</li><li>Run conduit from inverter to main panel</li><li>Update panel with solar breaker</li><li>Coordinate utility inspection</li></ul><p><strong>Value:</strong> $2,500-$3,500</p><p><strong>Timeline:</strong> 2 weeks</p>'
        },
        snippet: 'Solar installation electrical connection needed. Est $2,500-$3,500...',
        date: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `priority-pool-electrical-${Date.now()}`,
        from: {
          name: 'Crystal Clear Pools',
          email: 'office@crystalclearpools.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Pool Equipment Electrical - New Construction',
        body: {
          text: 'New pool installation requiring electrical work: 240V/50A circuit for pool pump, 120V GFCI for pool lights, bonding of all pool equipment, landscape lighting (low voltage transformer). Customer is ready to proceed immediately. Estimated job value: $3,200-$4,000. Location: 1234 Poolside Lane. Can you provide quote this week?',
          html: '<p>New pool installation - electrical work needed.</p><p><strong>Requirements:</strong></p><ul><li>240V/50A circuit for pool pump</li><li>120V GFCI for pool lights</li><li>Equipment bonding</li><li>Landscape lighting transformer</li></ul><p><strong>Value:</strong> $3,200-$4,000</p><p><strong>Status:</strong> Ready to proceed immediately</p>'
        },
        snippet: 'Pool equipment electrical - new construction. $3,200-$4,000...',
        date: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `priority-tenant-improvement-${Date.now()}`,
        from: {
          name: 'Property Management Group',
          email: 'maintenance@pmgcommercial.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Tenant Improvement - Medical Office Build-Out',
        body: {
          text: 'We have a medical office tenant improvement project. 2,500 sq ft space needs complete electrical: exam room outlets (medical grade), specialized lighting, dedicated circuits for medical equipment, emergency lighting, and exit signs. Budget approved: $18,000-$22,000. Must meet medical code requirements. Start date flexible. Please bid on project.',
          html: '<p>Medical office tenant improvement - 2,500 sq ft</p><p><strong>Electrical scope:</strong></p><ul><li>Medical grade outlets (exam rooms)</li><li>Specialized lighting</li><li>Dedicated equipment circuits</li><li>Emergency lighting & exit signs</li><li>Medical code compliance</li></ul><p><strong>Budget:</strong> $18,000-$22,000 (approved)</p><p>Start date flexible. Please bid.</p>'
        },
        snippet: 'Medical office build-out. Budget $18k-$22k approved...',
        date: new Date(Date.now() - 12 * 60 * 60 * 1000),
        isRead: false,
        isWorkRelated: true,
        isStarred: true,
        hasAttachments: false
      },
      {
        userId: admin._id,
        emailAccountId: dummyAccountId,
        messageId: `priority-generator-install-${Date.now()}`,
        from: {
          name: 'Home Backup Power LLC',
          email: 'sales@homebackuppower.com'
        },
        to: [{
          name: 'MES Electrical',
          email: 'contact@meselectrical.com'
        }],
        subject: 'Whole House Generator - Transfer Switch Installation',
        body: {
          text: 'Customer purchased 22kW whole house generator. Need licensed electrician to install transfer switch and connect to panel. Includes: install 200A transfer switch, run gas line coordination, connect to existing panel, test system. Job value: $2,800-$3,600. Customer location: 567 Backup Lane. Generator arrives in 10 days.',
          html: '<p>22kW whole house generator - transfer switch installation needed</p><p><strong>Work includes:</strong></p><ul><li>Install 200A transfer switch</li><li>Gas line coordination</li><li>Panel connection</li><li>System testing</li></ul><p><strong>Value:</strong> $2,800-$3,600</p><p>Generator arrives in 10 days</p>'
        },
        snippet: 'Whole house generator transfer switch. $2,800-$3,600...',
        date: new Date(Date.now() - 18 * 60 * 60 * 1000),
        isRead: false,
        isWorkRelated: true,
        isStarred: false,
        hasAttachments: false
      }
    ]);

    console.log(`✓ Created ${emails.length} priority emails with revenue estimates\n`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DEMO DATA POPULATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log(`  • ${clients.length} Clients`);
    console.log(`  • ${createdJobs.length} Jobs (with full financials)`);
    console.log(`  • ${emails.length} Priority Emails (with revenue estimates)\n`);

    console.log('💰 Financial Overview:');
    const completedJobs = createdJobs.filter(j => j.status === 'completed');
    const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.costs?.finalTotal || 0), 0);
    const totalProfit = completedJobs.reduce((sum, j) => {
      if (j.actualExpenses?.finalTotal) {
        return sum + (j.costs.finalTotal - j.actualExpenses.finalTotal);
      }
      return sum;
    }, 0);
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    console.log(`  • Total Revenue (Completed): $${totalRevenue.toFixed(2)}`);
    console.log(`  • Total Profit: $${totalProfit.toFixed(2)}`);
    console.log(`  • Avg Profit Margin: ${avgProfitMargin.toFixed(1)}%\n`);

    console.log('📧 Email Revenue Potential:');
    console.log(`  • 5 High-Value Opportunities`);
    console.log(`  • Est. Total Value: $71,500 - $93,100`);
    console.log(`  • Highest Value: $45,000-$60,000 (HVAC Project)\n`);

    console.log('🎯 Pages Now Populated:');
    console.log('  ✅ Dashboard - Shows metrics and recent activity');
    console.log('  ✅ Jobs Page - 6 jobs with complete cost breakdowns');
    console.log('  ✅ Analytics Page - Revenue, profit, and trends');
    console.log('  ✅ Email Page - 5 priority opportunities with AI analysis');
    console.log('  ✅ Clients Page - 5 clients (residential & commercial)');
    console.log('  ✅ Marketing Page - Data for review/referral automation\n');

    console.log('🔔 Bell Icon (Email Job Summarizer):');
    console.log('  • Shows 5 unread priority emails');
    console.log('  • AI estimates revenue potential for each');
    console.log('  • Click to approve jobs or send quotes\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 Your Vercel app is now fully populated!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Share with client:');
    console.log('  URL: https://your-vercel-url.vercel.app');
    console.log('  Login: developer@gmail.com / dev123\n');

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

populateDemoData();
