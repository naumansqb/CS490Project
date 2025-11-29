export const linkedinMessageSchema = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description: "Optional subject line for the message (if applicable)"
    },
    message: {
      type: "string",
      description: "The LinkedIn message content"
    },
    tips: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Tips for sending this message effectively"
    }
  },
  required: ["message", "tips"]
};

export const linkedinOptimizationSchema = {
  type: "object",
  properties: {
    headlineSuggestions: {
      type: "array",
      items: {
        type: "string"
      },
      description: "3-5 optimized headline suggestions"
    },
    summarySuggestions: {
      type: "array",
      items: {
        type: "string"
      },
      description: "2-3 optimized summary/bio suggestions"
    },
    profileCompleteness: {
      type: "object",
      properties: {
        score: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        missingSections: {
          type: "array",
          items: {
            type: "string"
          }
        },
        recommendations: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["score", "missingSections", "recommendations"]
    },
    keywordOptimization: {
      type: "object",
      properties: {
        suggestedKeywords: {
          type: "array",
          items: {
            type: "string"
          }
        },
        currentKeywords: {
          type: "array",
          items: {
            type: "string"
          }
        },
        missingKeywords: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["suggestedKeywords", "currentKeywords", "missingKeywords"]
    },
    bestPractices: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Industry-specific best practices"
    }
  },
  required: ["headlineSuggestions", "summarySuggestions", "profileCompleteness", "keywordOptimization", "bestPractices"]
};

export const networkingStrategySchema = {
  type: "object",
  properties: {
    strategies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          strategy: {
            type: "string"
          },
          description: {
            type: "string"
          },
          actionItems: {
            type: "array",
            items: {
              type: "string"
            }
          },
          timeline: {
            type: "string"
          }
        },
        required: ["strategy", "description", "actionItems", "timeline"]
      }
    },
    connectionRequestTemplates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          scenario: {
            type: "string"
          },
          template: {
            type: "string"
          },
          tips: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },
        required: ["scenario", "template", "tips"]
      }
    },
    targetConnections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string"
          },
          description: {
            type: "string"
          },
          approach: {
            type: "string"
          }
        },
        required: ["type", "description", "approach"]
      }
    }
  },
  required: ["strategies", "connectionRequestTemplates", "targetConnections"]
};

export const contentSharingStrategySchema = {
  type: "object",
  properties: {
    contentTypes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string"
          },
          description: {
            type: "string"
          },
          examples: {
            type: "array",
            items: {
              type: "string"
            }
          },
          bestPractices: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },
        required: ["type", "description", "examples", "bestPractices"]
      }
    },
    postingSchedule: {
      type: "object",
      properties: {
        frequency: {
          type: "string"
        },
        bestTimes: {
          type: "array",
          items: {
            type: "string"
          }
        },
        recommendations: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["frequency", "bestTimes", "recommendations"]
    },
    engagementStrategies: {
      type: "array",
      items: {
        type: "string"
      }
    },
    visibilityTips: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: ["contentTypes", "postingSchedule", "engagementStrategies", "visibilityTips"]
};

export const networkingCampaignSchema = {
  type: "object",
  properties: {
    campaign: {
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        strategy: {
          type: "string"
        },
        phases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              phase: {
                type: "string"
              },
              duration: {
                type: "string"
              },
              activities: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              goals: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            },
            required: ["phase", "duration", "activities", "goals"]
          }
        }
      },
      required: ["name", "strategy", "phases"]
    },
    outreachTemplates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          scenario: {
            type: "string"
          },
          template: {
            type: "string"
          },
          subject: {
            type: "string"
          }
        },
        required: ["scenario", "template"]
      }
    },
    trackingMetrics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          metric: {
            type: "string"
          },
          description: {
            type: "string"
          },
          target: {
            type: "string"
          }
        },
        required: ["metric", "description", "target"]
      }
    },
    successCriteria: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: ["campaign", "outreachTemplates", "trackingMetrics", "successCriteria"]
};


