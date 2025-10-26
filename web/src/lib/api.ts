const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // CRITICAL: Sends HTTP-only cookies
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle 401 - Redirect to login
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },
};
