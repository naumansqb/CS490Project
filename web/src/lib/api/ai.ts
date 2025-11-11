export async function generateAICoverLetter({
    userId,
    jobId,
  }: {
    userId: string;
    jobId: string;
  }) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/cover-letter/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, jobId }),
    });
  
    if (!res.ok) throw new Error(`Cover letter generation failed: ${res.status}`);
    return res.json();
  }