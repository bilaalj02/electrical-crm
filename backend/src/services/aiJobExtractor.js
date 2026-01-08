const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract job details from email content using AI
 */
async function extractJobDetailsFromEmail(emailContent, senderEmail, senderName) {
  try {
    const prompt = `You are an AI assistant helping to extract electrical service job information from customer emails.

Email From: ${senderName} <${senderEmail}>
Email Content:
${emailContent}

Please extract the following information and return it as a JSON object:
{
  "title": "Brief job title (e.g., 'Electrical panel upgrade', 'Outlet installation')",
  "description": "Detailed description of the work requested",
  "priority": "low" | "medium" | "high" | "urgent",
  "estimatedHours": <number or null>,
  "customerName": "Customer's name",
  "customerEmail": "${senderEmail}",
  "customerPhone": "Phone number if mentioned, otherwise null",
  "address": {
    "street": "Street address if mentioned",
    "city": "City if mentioned",
    "state": "State if mentioned",
    "zipCode": "Zip code if mentioned"
  },
  "preferredDate": "Preferred date/time if mentioned (ISO format) or null",
  "isUrgent": true/false,
  "notes": "Any additional notes or special requirements"
}

Rules:
- If information is not mentioned in the email, set it to null or empty string
- For priority, assess based on language used (urgent words = high/urgent, normal request = medium, inquiry = low)
- Use the sender's email as customerEmail
- Extract phone numbers carefully
- If address is partial, include what you have
- Set isUrgent to true if the customer mentions urgency, emergency, ASAP, etc.

Return ONLY the JSON object, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured job information from customer service request emails for an electrical service company.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error extracting job details from email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze if an email is likely a job/service request
 */
async function isJobRequest(emailSubject, emailBody) {
  try {
    const prompt = `Analyze if this email is a service/job request for an electrical company.

Subject: ${emailSubject}
Body: ${emailBody.substring(0, 500)}

Respond with a JSON object:
{
  "isJobRequest": true/false,
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}

Consider it a job request if it:
- Asks for electrical work, repairs, installations, inspections
- Requests a quote or estimate
- Describes electrical problems or needs
- Schedules or inquires about service

NOT a job request if it's:
- Thank you emails
- Invoice/payment confirmations
- General marketing
- Unrelated topics`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing job request:', error);
    return { isJobRequest: false, confidence: 0, reasoning: 'Error analyzing email' };
  }
}

module.exports = {
  extractJobDetailsFromEmail,
  isJobRequest
};
