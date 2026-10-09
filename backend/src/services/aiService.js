const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Clean product names by stripping filler phrases, prepositions, and budget/delivery clauses
 */
function cleanProductName(rawName) {
  if (!rawName) return 'General Equipment';

  let name = String(rawName).trim();

  // Strip leading filler phrases
  name = name.replace(/^(i need|need|i want|want|buy|looking for|purchase|require|order|please send|please get|total|overall|sum)\s+/gi, '');
  name = name.replace(/^(units of|pieces of|items of|set of|sets of|packs of|boxes of)\s+/gi, '');

  // Strip trailing clauses starting with prepositions, budget terms, or delivery terms
  name = name.replace(/\s+(in|within|for|by|under|around|approx|at|budget|price|cost|rs|rupees|inr|₹|\d+).*$/gi, '');
  
  // Strip common trailing words
  name = name.replace(/\s+(my|is|this|the|a|an|of|to|with|and|total)$/gi, '');

  name = name.replace(/[,\.;:\?!\(\)]/g, '').trim();

  if (name.length > 0) {
    return name.split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return 'General Equipment';
}

function fallbackParsePrompt(promptText) {
  const text = promptText.trim();
  const lowerText = text.toLowerCase();

  // 1. Extract total budget
  let total_budget = 100000;
  const budgetMatch = lowerText.match(/(?:total\s*)?(?:budget|price|cost|limit|under|around|approx|for|is)\s*(?:of|is|:)?\s*₹?\s*([\d,]+)/i) || 
                      lowerText.match(/₹\s*([\d,]+)/) ||
                      lowerText.match(/([\d,]+)\s*(?:rs|rupees|inr)/i);
  if (budgetMatch) {
    const parsedB = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (!isNaN(parsedB) && parsedB > 0) {
      total_budget = parsedB;
    }
  }

  // 2. Extract deadline
  let deadline_days = 7;
  const deadlineMatch = lowerText.match(/(?:within|in|by|deadline)?\s*(\d+)\s*(?:days|day|weeks|week)/i);
  if (deadlineMatch) {
    const num = parseInt(deadlineMatch[1], 10);
    if (!isNaN(num) && num > 0) {
      deadline_days = lowerText.includes('week') ? num * 7 : num;
    }
  }

  // 3. Extract items and quantities
  let promptForItems = text
    .replace(/(?:total\s*)?(?:budget|price|cost|limit|under|around|approx)\s*(?:of|is|:)?\s*₹?\s*[\d,]+\s*(?:rs|rupees|inr)?/gi, '')
    .replace(/₹\s*[\d,]+/gi)
    .replace(/[\d,]+\s*(?:rs|rupees|inr)/gi)
    .replace(/(?:within|in|by)?\s*\d+\s*(?:days|day|weeks|week)/gi, '');

  const clauses = promptForItems.split(/(?:,|\band\b|&|;)/i);
  let items = [];

  for (let clause of clauses) {
    let cleanClause = clause.trim();
    if (!cleanClause) continue;

    const qtyMatch = cleanClause.match(/(\d+)\s+([a-zA-Z\s\-]+)/i) || cleanClause.match(/([a-zA-Z\s\-]+)\s+(\d+)/i);
    
    let qty = 1;
    let rawName = cleanClause;

    if (qtyMatch) {
      if (/^\d+$/.test(qtyMatch[1])) {
        qty = parseInt(qtyMatch[1], 10);
        rawName = qtyMatch[2];
      } else if (/^\d+$/.test(qtyMatch[2])) {
        qty = parseInt(qtyMatch[2], 10);
        rawName = qtyMatch[1];
      }
    }

    const finalName = cleanProductName(rawName);
    const lowerName = finalName.toLowerCase();
    const isNoise = ['days', 'day', 'weeks', 'week', 'rupees', 'rs', 'inr', 'budget', 'my', 'is', 'total', 'overall', 'sum'].some(w => lowerName === w);

    if (finalName.length >= 2 && !isNoise && finalName !== 'General Equipment') {
      items.push({
        item_name: finalName,
        quantity: Math.max(1, qty),
        estimated_budget: null
      });
    }
  }

  if (items.length === 0) {
    const finalName = cleanProductName(text);
    items = [
      { item_name: finalName || 'General Office Equipment', quantity: 1, estimated_budget: total_budget }
    ];
  }

  const clarificationQuestions = [];
  if (items.some(i => i.item_name.toLowerCase().includes('monitor') || i.item_name.toLowerCase().includes('display'))) {
    clarificationQuestions.push('What screen size or resolution do you prefer? (e.g., 24-inch, Full HD, 4K)');
  }

  const is_advance_payment = lowerText.includes('advance') || lowerText.includes('upfront') || lowerText.includes('100%') || lowerText.includes('prepaid');
  const is_flexible_lead_time = lowerText.includes('flexible') || lowerText.includes('extend') || lowerText.includes('extra days');

  return {
    raw_prompt: promptText,
    parsed_summary: `Parsed ${items.length} requirement items with target budget of ₹${total_budget.toLocaleString('en-IN')} and ${deadline_days} days delivery window.`,
    total_budget,
    currency: 'INR',
    deadline_days,
    is_advance_payment,
    is_flexible_lead_time,
    items,
    clarification_questions: clarificationQuestions,
    is_ai_parsed: false,
    ai_engine: 'regex'
  };
}

async function parseBuyerPrompt(promptText) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are an AI procurement assistant for DealPilot Procure B2B platform.
Analyze the following natural-language procurement requirement from a buyer and extract structured data as JSON:

Buyer Request: "${promptText}"

Extraction Rules:
1. Extract "items" array with exact clean product names and their specified quantities.
   - "item_name": MUST be ONLY the clean product noun phrase (e.g. "Pencil", "Dell Keyboard", "Notebook"). 
   - NEVER include filler verbs/phrases like "I need", "I want", "buy", "looking for", "for my office".
   - NEVER include delivery phrases ("in 5 days", "within 7 days") or pricing/budget phrases ("under 300 rs", "is 300").
2. "quantity": number (e.g. 30 for "30 pencils"). If no numeric quantity is specified for an item, default quantity to 1.
3. "total_budget": total requirement budget in INR (number, e.g. 300 for "300 rs" or "₹300").
4. "deadline_days": required delivery window in days (number, e.g. 5 for "5 days", 14 for "2 weeks"). Default to 7 if unspecified.

Return JSON strictly matching this structure:
{
  "total_budget": number,
  "currency": "INR",
  "deadline_days": number,
  "is_advance_payment": boolean,
  "is_flexible_lead_time": boolean,
  "parsed_summary": string,
  "items": [
    {
      "item_name": string,
      "quantity": number,
      "estimated_budget": number or null
    }
  ],
  "clarification_questions": [ string ]
}

Return raw valid JSON only without markdown formatting.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const validItems = parsed.items
            .map(i => ({
              item_name: cleanProductName(i.item_name),
              quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
              estimated_budget: i.estimated_budget ? Number(i.estimated_budget) : null
            }))
            .filter(i => i.item_name.length > 0 && i.item_name !== 'General Equipment' && i.quantity >= 1);

          if (validItems.length > 0) {
            return {
              raw_prompt: promptText,
              parsed_summary: parsed.parsed_summary || `Parsed ${validItems.length} items from requirement.`,
              total_budget: parsed.total_budget || 100000,
              currency: parsed.currency || 'INR',
              deadline_days: parsed.deadline_days || 7,
              is_advance_payment: Boolean(parsed.is_advance_payment),
              is_flexible_lead_time: Boolean(parsed.is_flexible_lead_time),
              items: validItems,
              clarification_questions: parsed.clarification_questions || [],
              is_ai_parsed: true,
              ai_engine: `gemini (${modelName})`
            };
          }
        }
      } catch (err) {
        console.warn(`[Gemini AI Service] Gemini model "${modelName}" failed:`, err.message);
      }
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
  cleanProductName,
  parseBuyerPrompt,
  generateRoundExplanation,
  fallbackParsePrompt
};
