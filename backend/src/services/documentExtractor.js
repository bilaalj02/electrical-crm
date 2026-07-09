const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Extracts raw text from an uploaded PDF or Word document.
 * Returns { text, readable } — readable is false for PDFs that produced no
 * extractable text (e.g. a scanned image with no text layer), which is the
 * signal to fall back to some other input method rather than guess at content.
 */
async function extractText(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = (result.text || '').trim();
    return { text, readable: text.length > 20 };
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = (result.value || '').trim();
    return { text, readable: text.length > 20 };
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

/**
 * Turns extracted document text into structured CRM records for user review.
 * Mirrors the extraction prompt shape used in aiJobExtractor.js. Nothing here
 * writes to the database — this only returns a preview for the user to
 * tick/untick before anything is imported.
 */
async function extractCrmDataFromText(text, provider) {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API key not configured — document parsing is unavailable.'
    };
  }

  try {
    const prompt = `You are helping an electrical contracting company import business records from a document exported from ${provider}.

Document text:
"""
${text.slice(0, 12000)}
"""

Extract every client, job/invoice, and priced line item you can find and return them as a JSON object with this exact shape:
{
  "clients": [
    { "name": "", "company": "", "email": "", "phone": "", "confidence": 0.0 }
  ],
  "jobs": [
    { "title": "", "clientName": "", "status": "quote|approved|scheduled|in-progress|completed|invoiced|paid|cancelled", "amount": 0, "date": "ISO date or null", "confidence": 0.0 }
  ],
  "pricing": [
    { "jobTitle": "", "itemName": "", "quantity": 1, "unitPrice": 0, "totalPrice": 0, "confidence": 0.0 }
  ]
}

Rules:
- "confidence" is your own 0.0-1.0 estimate of how certain you are this record is accurate and complete — be honest, not optimistic.
- If email is not present for a client, leave it as an empty string; the user will fill it in before import (email is required to add a client).
- clientName in jobs/pricing must exactly match a name in the clients array so records can be linked.
- Only extract what's actually in the text. Do not invent data.
- Return ONLY the JSON object, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured business records (clients, jobs, invoices, pricing) from exported accounting documents for an electrical service company.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error extracting CRM data from document:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  extractText,
  extractCrmDataFromText
};
