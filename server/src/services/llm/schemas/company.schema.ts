// services/llm/schemas/company.schema.ts
export const companyResearchSchema = {
  type: "object",
  properties: {
    companyName: {
      type: "string",
      description: "Official company name",
    },
    companySize: {
      type: "string",
      description: "Employee count range (e.g., '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+')",
      nullable: true,
    },
    industry: {
      type: "string",
      description: "Primary industry category",
      nullable: true,
    },
    location: {
      type: "string",
      description: "Headquarters location (format: 'City, State, Country' or 'City, Country')",
      nullable: true,
    },
    website: {
      type: "string",
      description: "Official company website URL",
      nullable: true,
    },
    description: {
      type: "string",
      description: "Company description (2-4 sentences about what the company does)",
      nullable: true,
    },
    mission: {
      type: "string",
      description: "Company mission statement or values (1-2 sentences)",
      nullable: true,
    },
    logoUrl: {
      type: "string",
      description: "URL to company logo image",
      nullable: true,
    },
    contactInfo: {
      type: "object",
      properties: {
        email: {
          type: "string",
          nullable: true,
        },
        phone: {
          type: "string",
          nullable: true,
        },
        address: {
          type: "string",
          nullable: true,
        },
      },
      nullable: true,
    },
    glassdoorRating: {
      type: "number",
      description: "Glassdoor rating (0-5 scale)",
      nullable: true,
      minimum: 0,
      maximum: 5,
    },
    socialMedia: {
      type: "object",
      properties: {
        linkedin: {
          type: "string",
          nullable: true,
        },
        twitter: {
          type: "string",
          nullable: true,
        },
      },
      nullable: true,
    },
    leadership: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          title: {
            type: "string",
          },
        },
        required: ["name", "title"],
      },
      description: "Key executives and leadership team members",
      nullable: true,
    },
    productsAndServices: {
      type: "array",
      items: {
        type: "string",
      },
      description: "List of main products and services offered",
      nullable: true,
    },
    competitiveLandscape: {
      type: "string",
      description: "Information about competitors and market position (1-2 sentences)",
      nullable: true,
    },
  },
  required: ["companyName"],
};

export const companyNewsSchema = {
  type: "object",
  properties: {
    companyName: {
      type: "string",
      description: "Company name",
    },
    newsItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headline: {
            type: "string",
            description: "News headline or title",
          },
          summary: {
            type: "string",
            description: "Brief summary of the news (2-3 sentences)",
          },
          date: {
            type: "string",
            description: "Publication date (ISO format or readable format)",
          },
          category: {
            type: "string",
            enum: [
              "product_launch",
              "funding",
              "acquisition",
              "partnership",
              "leadership_change",
              "expansion",
              "financial_results",
              "controversy",
              "award",
              "other",
            ],
            description: "Category of news",
          },
          sentiment: {
            type: "string",
            enum: ["positive", "neutral", "negative"],
            description: "Overall sentiment of the news",
          },
          relevanceScore: {
            type: "number",
            description: "Relevance score (0-10) for job seekers",
          },
          source: {
            type: "string",
            description: "News source name",
          },
        },
        required: ["headline", "summary", "date", "category", "sentiment"],
      },
      description: "Recent news items (5-10 most relevant items)",
    },
    marketPosition: {
      type: "object",
      properties: {
        recentTrends: {
          type: "string",
          description: "Analysis of recent company trends and direction",
        },
        hiringOutlook: {
          type: "string",
          enum: ["expanding", "stable", "contracting", "uncertain"],
          description: "Current hiring outlook based on recent news",
        },
        keyDevelopments: {
          type: "array",
          items: { type: "string" },
          description: "3-5 key developments in the past 3-6 months",
        },
      },
    },
    interviewTips: {
      type: "object",
      properties: {
        talkingPoints: {
          type: "array",
          items: { type: "string" },
          description: "5-7 talking points candidates can mention in interviews based on recent news",
        },
        questionsToAsk: {
          type: "array",
          items: { type: "string" },
          description: "3-5 intelligent questions candidates can ask based on company news",
        },
      },
    },
    lastUpdated: {
      type: "string",
      description: "When this research was conducted (ISO date string)",
    },
  },
  required: ["companyName", "newsItems", "lastUpdated"],
};