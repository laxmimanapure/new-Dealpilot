const axios = require('axios');

/**
 * Real Web Search Service for Market Research
 * Fetches live web search results for products/prices/specifications
 */
async function searchWebProducts(query) {
  if (!query || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim();
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery + ' buy price India')}`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });

    const html = response.data;
    const results = [];

    // Parse DuckDuckGo HTML result blocks
    // Pattern: <a class="result__url" href="..."> ... <a class="result__snippet" ...>
    const resultBlockRegex = /<a class="result__snippet[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    const titles = [];
    let tMatch;
    while ((tMatch = titleRegex.exec(html)) !== null && titles.length < 6) {
      let rawUrl = tMatch[1];
      // Clean DuckDuckGo redirect URL /l/?uddg=...
      if (rawUrl.includes('uddg=')) {
        const urlMatch = rawUrl.match(/uddg=([^&]+)/);
        if (urlMatch) {
          rawUrl = decodeURIComponent(urlMatch[1]);
        }
      }
      const titleText = tMatch[2].replace(/<[^>]+>/g, '').trim();
      if (titleText && rawUrl.startsWith('http')) {
        titles.push({ url: rawUrl, title: titleText });
      }
    }

    const snippets = [];
    let sMatch;
    while ((sMatch = resultBlockRegex.exec(html)) !== null && snippets.length < 6) {
      const snippetText = sMatch[2].replace(/<[^>]+>/g, '').trim();
      snippets.push(snippetText);
    }

    for (let i = 0; i < titles.length; i++) {
      const item = titles[i];
      const snippet = snippets[i] || 'Current market listing available online.';
      
      let domain = 'Web Search';
      try {
        const u = new URL(item.url);
        domain = u.hostname.replace('www.', '');
      } catch (e) {}

      // Extract price if mentioned in snippet or title
      let estPrice = null;
      const priceMatch = (item.title + ' ' + snippet).match(/(?:₹|Rs\.?|INR)\s*([\d,]+)/i);
      if (priceMatch) {
        const p = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (!isNaN(p) && p > 100) estPrice = p;
      }

      results.push({
        title: item.title,
        snippet,
        url: item.url,
        source: domain,
        approxPrice: estPrice
      });
    }

    if (results.length > 0) {
      return results.slice(0, 5);
    }
  } catch (err) {
    console.warn('[Web Search Service] Live web search warning:', err.message);
  }

  // Fallback to Instant Answer API if HTML search didn't yield results
  try {
    const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json`;
    const res = await axios.get(instantUrl, { timeout: 3000 });
    const data = res.data;
    
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const fallbackResults = [];
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          fallbackResults.push({
            title: topic.Text.slice(0, 60) + '...',
            snippet: topic.Text,
            url: topic.FirstURL,
            source: 'duckduckgo.com',
            approxPrice: null
          });
        }
      }
      if (fallbackResults.length > 0) return fallbackResults;
    }
  } catch (e) {}

  return [];
}

module.exports = {
  searchWebProducts
};
