import Groq from 'groq-sdk';

let groq = null;

const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
};

export const analyzeLog = async (logText) => {
  try {
    const prompt = `You are LogWise AI, an expert log analyzer. Analyze this application log and return a JSON response with the following structure:

{
  "summary": "Brief summary of the log issue",
  "cause": "Root cause analysis",
  "severity": "info|warning|critical",
  "fix": "Human-readable fix recommendation",
  "codePatch": "Optional code patch suggestion if applicable"
}

LOG TEXT:
${logText}

Return ONLY valid JSON, no additional text.`;

    const groqClient = getGroqClient();
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are LogWise AI, a log analysis expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    // Parse JSON response
    const analysis = JSON.parse(response);
    
    // Ensure severity is valid
    if (!['info', 'warning', 'critical'].includes(analysis.severity)) {
      analysis.severity = 'info';
    }

    return {
      summary: analysis.summary || 'No summary available',
      cause: analysis.cause || 'No cause identified',
      severity: analysis.severity || 'info',
      fix: analysis.fix || 'No fix recommendation',
      codePatch: analysis.codePatch || '',
      aiRaw: analysis
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

