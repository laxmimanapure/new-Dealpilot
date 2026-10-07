const { GoogleGenerativeAI } = require('@google/generative-ai');

function fallbackParsePrompt(promptText) {
  const text = promptText.toLowerCase();

  // Extract total budget
  let total_budget = 100000;
  const budgetMatch = text.match(/(?:budget|price|cost|limit|around|approx|under|for)\s*(?:of|is|:)?\s*₹?\s*([\d,]+)/i) || 
                      text.match(/₹\s*([\d,]+)/);
  if (budgetMatch) {
    const parsedB = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (!isNaN(parsedB) && parsedB > 0) {
      total_budget = parsedB;
    }
  }

  // Extract deadline
  let deadline_days = 7;
  const deadlineMatch = text.match(/(\d+)\s*(?:days|day|weeks|week)/i);
  if (deadlineMatch) {
    const num = parseInt(deadlineMatch[1], 10);
    if (!isNaN(num) && num > 0) {
      deadline_days = text.includes('week') ? num * 7 : num;
    }
  }

  // Extract items & quantities
  let items = [];
  const itemRegex = /(\d+)\s+([a-zA-Z0-9\s\-]+?)(?=(?:,|\.|\band\b|\bwith\b|\bfor\b|\bby\b|$))/gi;
  let match;
  
  const reservedWords = ['days', 'day', 'weeks', 'week', 'rupees', 'rs', 'inr', 'lakh', 'lakhs', 'budget', 'deadline'];

  while ((match = itemRegex.exec(promptText)) !== null) {
    const qty = parseInt(match[1], 10);
    let name = match[2].trim();
    
    name = name.replace(/^(units of|pieces of|items of|set of|sets of)\s+/i, '');
    const cleanNameLower = name.toLowerCase();

    const isReserved = reservedWords.some(w => cleanNameLower.includes(w));

    if (qty >= 1 && name.length > 2 && !isReserved) {
      items.push({
        item_name: name,
        quantity: qty,
        estimated_budget: null
      });
    }
  }

  if (items.length === 0) {
    // If no quantity specified, default to 1 item of the query text
    const cleanName = promptText.replace(/under|budget|delivery|within|days|rupees|rs|₹|\d+/gi, '').trim();
    items = [
      { item_name: cleanName || 'General Office Equipment', quantity: 1, estimated_budget: total_budget }
    ];
  }

  // Check if clarification is needed
  const clarificationQuestions = [];
  if (items.some(i => i.item_name.toLowerCase().includes('monitor') || i.item_name.toLowerCase().includes('display'))) {
    clarificationQuestions.push('What screen size or resolution do you prefer? (e.g., 24-inch, Full HD, 4K)');
  }
  if (!text.includes('days') && !text.includes('week')) {
    clarificationQuestions.push('What is your required delivery timeframe? (Default is 7 days)');
  }

  return {
    raw_prompt: promptText,
    parsed_summary: `Parsed ${items.length} requirement items with target budget of ₹${total_budget.toLocaleString('en-IN')} and ${deadline_days} days delivery window.`,
    total_budget,
    currency: 'INR',
    deadline_days,
    items,
    clarification_questions: clarificationQuestions
  };
}

async function parseBuyerPrompt(promptText) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an AI procurement assistant for DealPilot Procure B2B platform.
Analyze the following natural-language procurement requirement from a buyer and extract structured data as JSON:

Buyer Request: "${promptText}"

Return JSON strictly matching this structure:
{
  "total_budget": number (in INR rupees, e.g. 100000 for 1 lakh),
  "currency": "INR",
  "deadline_days": number (in days, e.g. 7),
  "parsed_summary": string,
  "items": [
    {
      "item_name": string (clean product name like "Dell Keyboard", "Wireless Mouse", "24-inch Monitor"),
      "quantity": number,
      "estimated_budget": number or null
    }
  ],
  "clarification_questions": [ string ] (optional array of 1-2 relevant questions if spec or details are vague)
}

Return raw valid JSON only without markdown formatting.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        const validItems = parsed.items
          .map(i => ({
            item_name: String(i.item_name || '').trim(),
            quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
            estimated_budget: i.estimated_budget ? Number(i.estimated_budget) : null
          }))
          .filter(i => i.item_name.length > 0 && i.quantity >= 1);

        if (validItems.length > 0) {
          return {
            raw_prompt: promptText,
            parsed_summary: parsed.parsed_summary || `Parsed ${validItems.length} items from requirement.`,
            total_budget: parsed.total_budget || 100000,
            currency: parsed.currency || 'INR',
            deadline_days: parsed.deadline_days || 7,
            items: validItems,
            clarification_questions: parsed.clarification_questions || []
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini AI Service] Gemini API call failed, falling back to intelligent parser:', err.message);
    }
  }

  return fallbackParsePrompt(promptText);
}

/**
 * Generate human-like explanation for a negotiation result
 */
function generateRoundExplanation(roundNumber, leverApplied, price, discountPct, accepted, reason) {
  if (!accepted) {
    return `Round ${roundNumber} rejected by policy engine. Lever "${leverApplied}" produced a price of ₹${price.toLocaleString('en-IN')}, but breached constraint: ${reason}.`;
  }
  return `In Round ${roundNumber}, seller applied lever "${leverApplied}", bringing package price to ₹${price.toLocaleString('en-IN')} (${discountPct}% total discount off list price). Policy check passed.`;
}

module.exports = {
  parseBuyerPrompt,
  generateRoundExplanation,
  fallbackParsePrompt
};
