/**
 * clearDemoData.js
 * Wipes all demo/mock data from the database, leaving user accounts intact.
 * Run once before handing over to the client:
 *   node clearDemoData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Job          = require('./src/models/Job');
const Client       = require('./src/models/Client');
const Email        = require('./src/models/Email');
const Photo        = require('./src/models/Photo');
const Project      = require('./src/models/Project');
const CalendarEvent = require('./src/models/CalendarEvent');
const Diagram      = require('./src/models/Diagram');

async function clearDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.\n');

    const results = await Promise.all([
      Job.deleteMany({}).then(r => ({ collection: 'Jobs', deleted: r.deletedCount })),
      Client.deleteMany({}).then(r => ({ collection: 'Clients', deleted: r.deletedCount })),
      Email.deleteMany({}).then(r => ({ collection: 'Emails', deleted: r.deletedCount })),
      Photo.deleteMany({}).then(r => ({ collection: 'Photos', deleted: r.deletedCount })),
      Project.deleteMany({}).then(r => ({ collection: 'Projects', deleted: r.deletedCount })),
      CalendarEvent.deleteMany({}).then(r => ({ collection: 'CalendarEvents', deleted: r.deletedCount })),
      Diagram.deleteMany({}).then(r => ({ collection: 'Diagrams', deleted: r.deletedCount })),
    ]);

    console.log('Cleared collections:');
    results.forEach(r => console.log(`  ${r.collection}: ${r.deleted} record(s) removed`));
    console.log('\nUser accounts were NOT touched — employees and admin remain.');
    console.log('Done. The CRM is ready for the client.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

clearDemoData();
