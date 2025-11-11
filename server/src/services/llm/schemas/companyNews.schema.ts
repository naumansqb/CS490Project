// services/llm/schemas/companyNews.schema.ts
export const companyNewsSchema = {
  type: "object",
  properties: {
    articles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "News article headline/title",
          },
          source: {
            type: "string",
            description: "Publication or source name (use generic names like 'Industry News', 'Company Announcements' if specific source unknown)",
          },
          url: {
            type: "string",
            description: "Full URL to the original article (or placeholder if not available)",
            nullable: true,
          },
          publishDate: {
            type: "string",
            description: "Publication date in ISO format (YYYY-MM-DD)",
          },
          category: {
            type: "string",
            enum: [
              "funding",
              "product_launch",
              "hiring",
              "acquisition",
              "partnership",
              "award",
              "leadership_change",
              "general",
            ],
            description: "News category classification",
          },
          summary: {
            type: "string",
            description: "2-3 sentence summary of the news article",
          },
          keyPoints: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Array of 3-5 key points extracted from the article",
            minItems: 3,
            maxItems: 5,
          },
          relevanceScore: {
            type: "number",
            description: "Relevance score for job seekers (0-100)",
            minimum: 0,
            maximum: 100,
          },
          thumbnailUrl: {
            type: "string",
            description: "URL to article thumbnail/image (optional)",
            nullable: true,
          },
        },
        required: [
          "title",
          "source",
          "publishDate",
          "category",
          "summary",
          "keyPoints",
          "relevanceScore",
        ],
      },
      description: "Array of news articles about the company",
    },
    researchDate: {
      type: "string",
      description: "Date when research was performed (ISO format: YYYY-MM-DD)",
    },
    totalFound: {
      type: "number",
      description: "Total number of articles found during research",
      minimum: 0,
    },
  },
  required: ["articles", "researchDate", "totalFound"],
};

