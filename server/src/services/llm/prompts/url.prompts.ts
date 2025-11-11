// lib/jobExtraction.ts

/**
 * Generates a prompt for the LLM to extract job data from HTML
 * @param html - Raw HTML content from the job posting page
 * @returns Formatted prompt string
 */
export function generateJobExtractionPrompt(html: string): string {
  return `You are a job posting data extraction assistant. Your task is to analyze the provided HTML content and extract structured job information.

IMPORTANT INSTRUCTIONS:
1. Extract ONLY the information that is explicitly present in the HTML
2. If a field is not found or unclear, use null for that field
3. For Industry and Job Type, match to the closest option from the allowed values
4. Return ONLY valid JSON with no additional text, markdown, or explanations
5. Salary values should be numbers only (no currency symbols or commas)
6. Dates should be in ISO format (YYYY-MM-DD) if found

ALLOWED VALUES:
- Industry: Technology, Finance, Healthcare, Education, Manufacturing, Retail, Consulting, Marketing, Real Estate, Other
- Job Type: Full-time, Part-time, Contract, Temporary, Internship, Remote, Hybrid

EXPECTED JSON STRUCTURE:
{
  "title": "string or null",
  "company": "string or null",
  "location": "string or null",
  "salaryMin": "string or null",
  "salaryMax": "string or null",
  "deadline": "string or null (YYYY-MM-DD format)",
  "industry": "string (from allowed values) or null",
  "jobType": "string (from allowed values) or null",
  "description": "string or null"
}

HTML CONTENT TO ANALYZE:
${html}

Extract the job posting data and return ONLY the JSON object:`;
}

/**
 * Validates and sanitizes the extracted job data
 * @param data - Raw data returned from LLM
 * @returns Validated job data object
 */
export interface ExtractedJobData {
  title: string | null;
  company: string | null;
  location: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  deadline: string | null;
  industry: string | null;
  jobType: string | null;
  description: string | null;
}

const VALID_INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Consulting", "Marketing", "Real Estate", "Other"
];

const VALID_JOB_TYPES = [
  "Full-time", "Part-time", "Contract", "Temporary", "Internship", "Remote", "Hybrid"
];

export function validateExtractedData(rawData: any): ExtractedJobData {
  // Ensure we have an object
  if (typeof rawData !== 'object' || rawData === null) {
    throw new Error('Invalid data format: expected object');
  }

  // Validate industry
  let industry = rawData.industry || null;
  if (industry && !VALID_INDUSTRIES.includes(industry)) {
    console.warn(`Invalid industry "${industry}", setting to "Other"`);
    industry = "Other";
  }

  // Validate job type
  let jobType = rawData.jobType || null;
  if (jobType && !VALID_JOB_TYPES.includes(jobType)) {
    console.warn(`Invalid job type "${jobType}", setting to "Full-time"`);
    jobType = "Full-time";
  }

  // Validate and format salary (remove any non-numeric characters except decimals)
  const cleanSalary = (salary: any): string | null => {
    if (!salary) return null;
    const cleaned = String(salary).replace(/[^0-9.]/g, '');
    return cleaned || null;
  };

  // Validate date format (YYYY-MM-DD)
  const validateDate = (date: any): string | null => {
    if (!date) return null;
    const dateStr = String(date);
    // Check if it matches ISO format
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
    // Try to parse it
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return dateStr.split('T')[0]; // Return just YYYY-MM-DD part
  };

  // Truncate description if too long (max 2000 chars as per your form)
  // Add truncation indicator if cut off
  const truncateDescription = (desc: any): string | null => {
    if (!desc) return null;
    const str = String(desc);
    
    // If description exceeds 2000 chars, truncate and add indicator
    if (str.length > 2000) {
      // Truncate to 1997 chars to leave room for "..."
      return str.substring(0, 1997) + '...';
    }
    
    // Check if description might have been truncated by AI (ends abruptly)
    // If it doesn't end with punctuation and is close to max length, add indicator
    const trimmed = str.trim();
    if (trimmed.length > 1950 && !trimmed.match(/[.!?]\s*$/)) {
      // Might be truncated by AI - add indicator if not already present
      if (!trimmed.endsWith('...')) {
        return trimmed + '...';
      }
    }
    
    return str;
  };

  return {
    title: rawData.title ? String(rawData.title).trim() : null,
    company: rawData.company ? String(rawData.company).trim() : null,
    location: rawData.location ? String(rawData.location).trim() : null,
    salaryMin: cleanSalary(rawData.salaryMin),
    salaryMax: cleanSalary(rawData.salaryMax),
    deadline: validateDate(rawData.deadline),
    industry: industry,
    jobType: jobType,
    description: truncateDescription(rawData.description),
  };
}

/**
 * Cleans HTML to reduce token usage (removes scripts, styles, comments)
 * @param html - Raw HTML string
 * @returns Cleaned HTML string
 */
export function cleanHtmlForExtraction(html: string): string {
  let cleaned = html;

  // Remove script tags and their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Limit total length to prevent token overload (keep first 50000 chars)
  if (cleaned.length > 50000) {
    cleaned = cleaned.substring(0, 50000) + '... [truncated]';
  }
  
  return cleaned;
}

/**
 * Parse JSON response from LLM, handling common formatting issues
 * @param response - Raw response string from LLM
 * @returns Parsed JSON object
 */
export function parseJobExtractionResponse(response: string): any {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  cleaned = cleaned.replace(/```json\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}