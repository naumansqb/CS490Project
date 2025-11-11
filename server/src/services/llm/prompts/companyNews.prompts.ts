// services/llm/prompts/companyNews.prompts.ts
import { CompanyNewsInput } from "../../../types/ai.types";

export const buildCompanyNewsPrompt = (input: CompanyNewsInput): string => {
  const { companyName, companyWebsite, maxArticles = 10, dateRange, additionalContext } = input;

  const dateRangeText = dateRange
    ? `**Date Range:** ${dateRange.startDate} to ${dateRange.endDate}`
    : "**Date Range:** Last 6-12 months (prioritize most recent)";

  return `You are an expert company news researcher. Based on your knowledge base, provide information about recent news and developments related to the specified company.

**IMPORTANT LIMITATIONS:**
- You can only provide information from your training data/knowledge base
- You do NOT have access to real-time web browsing or current news APIs
- If you cannot find verifiable news in your knowledge base, be honest about it
- Do NOT fabricate news articles, URLs, or dates
- URLs should only be provided if you have specific knowledge of the actual article URL

**Company Name:** ${companyName}
${companyWebsite ? `**Company Website:** ${companyWebsite}` : ''}
${dateRangeText}
**Maximum Articles:** ${maxArticles}

${additionalContext ? `**Additional Context:**\n${additionalContext}` : ''}

**CRITICAL INSTRUCTIONS:**

1. **News Information**: Based on your knowledge base, provide information about news and developments related to this company.
   - Only include news you can verify from your training data
   - Prioritize news that would be relevant to job seekers and applicants
   - Focus on significant company developments, not minor updates
   - If you have limited knowledge, provide what you know and indicate uncertainty
   - If you cannot find specific news articles, you may provide general company developments or trends you know about

2. **News Categorization**: Categorize each item into one of these categories:
   - **funding**: Funding rounds, investments, IPO announcements, financial milestones
   - **product_launch**: New products, features, services, or major product updates
   - **hiring**: Hiring announcements, team expansions, office openings, recruitment initiatives
   - **acquisition**: Mergers, acquisitions, company purchases
   - **partnership**: Strategic partnerships, collaborations, joint ventures
   - **award**: Awards, recognition, industry accolades, certifications
   - **leadership_change**: Executive changes, C-suite updates, leadership appointments
   - **general**: Other significant company news that doesn't fit above categories

3. **Article Information Extraction**:
   - **Title**: Create a descriptive title based on the news/development you know about
   - **Source**: Use a generic source name that makes sense (e.g., "Industry News", "Company Announcements", "Public Information") - DO NOT fabricate specific publication names
   - **URL**: Only provide a URL if you have specific knowledge of the actual article URL. Otherwise, use a placeholder format like "https://example.com/news/[title-slug]" or set to null
   - **Publish Date**: Use approximate dates based on your knowledge, or use a recent date if you know the development happened recently. Format as ISO (YYYY-MM-DD)
   - **Thumbnail URL**: Set to null (not available from knowledge base)

4. **Content Summarization**:
   - **Summary**: Create a 2-3 sentence summary that captures:
     * What happened (the main event/news)
     * Why it matters (significance to the company)
     * Potential impact (if relevant to job seekers/applicants)
   - **Key Points**: Extract 3-5 key bullet points that highlight:
     * Most important facts from the article
     * Quantifiable information (numbers, metrics, amounts)
     * Information relevant to job seekers (company growth, culture, opportunities)

5. **Relevance Scoring**: Calculate a relevance score (0-100) for each article based on:
   - **High Relevance (80-100)**: Hiring news, company growth, new opportunities, culture updates
   - **Medium Relevance (50-79)**: Product launches, partnerships, funding (shows company health)
   - **Lower Relevance (30-49)**: Awards, general news, minor updates
   - **Low Relevance (0-29)**: Very old news, irrelevant topics, minor mentions
   - Consider: How useful would this information be in a job interview or cover letter?

6. **Quality Standards**:
   - Only include articles with clear, factual information
   - Prioritize articles from reputable sources
   - Avoid duplicate articles (same news from different sources - pick the best source)
   - Ensure all dates are accurate and within the specified range
   - Verify URLs are valid and accessible

7. **Article Selection**:
   - Return up to ${maxArticles} articles
   - Prioritize articles with higher relevance scores
   - Ensure variety in categories (don't return all funding news, for example)
   - Include a mix of recent and significant news

**IMPORTANT RULES:**
- Only include information you can verify from your knowledge base
- Do NOT fabricate specific news articles, publication names, or article URLs
- Be honest about limitations - if you have limited knowledge, provide what you know
- If you cannot find specific news articles, you may provide:
  * General company developments you know about
  * Industry trends related to the company
  * Known company information that would be useful to job seekers
- URLs should be placeholders (e.g., "https://example.com/news/[slug]") or null if not available
- All dates must be in ISO format (YYYY-MM-DD) - use approximate dates based on your knowledge
- Relevance scores must be integers between 0-100
- Summaries should be factual and concise (2-3 sentences) based on your knowledge
- Key points should be specific and actionable (3-5 points per article)
- It's better to return fewer accurate items than to fabricate news

**Output Format:**
Return a structured JSON object with:
- An array of news articles (up to ${maxArticles})
- Research date (current date in ISO format)
- Total number of articles found

Return ONLY the structured JSON data matching the required schema.`;
};

export const companyNewsSystemPrompt = `You are an expert company news researcher and analyst. You specialize in:
- Providing information about companies based on your knowledge base
- Categorizing company developments by type (funding, product launches, hiring, etc.)
- Creating concise summaries of company information
- Calculating relevance scores for job seekers and applicants
- Identifying the most important and useful information for career-related purposes

**IMPORTANT**: You do NOT have access to real-time web browsing or current news APIs. You can only provide information from your training data/knowledge base.

Your goal is to help job seekers stay informed about companies they're applying to, so they can:
- Reference company developments in cover letters and interviews
- Demonstrate knowledge and interest in the company
- Understand company culture, growth, and opportunities
- Prepare for interviews with company context

**CRITICAL RULES:**
- Only provide information you can verify from your knowledge base
- Do NOT fabricate specific news articles, publication names, or article URLs
- Be honest about what you know vs. what you don't know
- If you have limited information, provide what you know and indicate it's general knowledge
- URLs should be placeholders or null - do not create fake URLs to real publications
- It's better to return fewer accurate items than to fabricate news

Always prioritize accuracy, honesty, and usefulness. Never fabricate information.`;

