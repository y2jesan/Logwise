import Groq from 'groq-sdk';

let groq = null;

const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
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
          content: 'You are LogWise AI, a log analysis expert. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
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
      aiRaw: analysis,
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

export const optimizeQuery = async (queryText, functionName = '') => {
  try {
    const prompt = `You are LogWise AI, an expert database query optimizer. Analyze the provided query and return a JSON response with the following structure:

{
  "queryType": "SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Other",
  "language": "The specific database language/dialect",
  "isValid": true|false,
  "errors": ["List of syntax errors if isValid is false"],
  "optimizedQuery": "The optimized version of the query",
  "optimizationReason": "Brief explanation of why these optimizations were made",
  "optimizations": [
    {
      "suggestion": "Specific optimization suggestion",
      "reason": "Why this optimization helps",
      "impact": "Expected performance impact (low/medium/high)"
    }
  ],
  "indexSuggestions": [
    {
      "index": "CREATE INDEX statement or index description",
      "reason": "Why this index would help",
      "columns": ["list of columns for the index"]
    }
  ],
  "correctedQuery": "Corrected query if isValid is false, otherwise same as optimizedQuery"
}

QUERY TEXT:
${queryText}

${functionName ? `FUNCTION NAME: ${functionName}` : ''}

IMPORTANT INSTRUCTIONS:
1. First, detect the query type (SQL, NoSQL, MongoDB, etc.) and language
2. Check if the query syntax is correct
3. If incorrect, provide a corrected version
4. Analyze the query for optimization opportunities (missing indexes, inefficient joins, full table scans, etc.)
5. Provide specific index suggestions if needed
6. Return ONLY valid JSON, no additional text.`;

    const groqClient = getGroqClient();
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are LogWise AI, a database query optimization expert. Always return valid JSON. Be thorough in your analysis and provide actionable optimization suggestions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    // Parse JSON response
    const analysis = JSON.parse(response);

    // Ensure required fields have defaults
    return {
      queryType: analysis.queryType || 'Unknown',
      language: analysis.language || 'Unknown',
      isValid: analysis.isValid !== undefined ? analysis.isValid : true,
      errors: analysis.errors || [],
      optimizedQuery: analysis.optimizedQuery || queryText,
      optimizationReason: analysis.optimizationReason || 'No optimizations suggested',
      optimizations: analysis.optimizations || [],
      indexSuggestions: analysis.indexSuggestions || [],
      correctedQuery: analysis.correctedQuery || analysis.optimizedQuery || queryText,
      aiRaw: analysis,
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`Query optimization failed: ${error.message}`);
  }
};
