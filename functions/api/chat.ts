// Cloudflare Pages Function: Secure Gemini API Proxy with Pedagogical Logic
// Based on the Pearson Edexcel GCSE Russian specification and Latymer School curriculum

interface Env {
  GEMINI_API_KEY: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  userLevel: 'beginner' | 'foundation' | 'higher';
}

interface TutorResponse {
  russian: string;
  english_feedback: string | null;
  transliteration?: string;
  topic_alignment?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers for local development
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Security check
  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing API Key configuration' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { messages, userLevel } = await request.json<RequestBody>();

    // Dynamic prompt construction based on pedagogical level
    let promptContext = '';
    let speedRecommendation = '';
    
    if (userLevel === 'beginner') {
      promptContext = `
MODE: BEGINNER (Year 8/9 - Latymer Foundation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PEDAGOGICAL CONSTRAINTS:
- GRAMMAR: Use ONLY Nominative case (subject) and Accusative case (direct object)
- TENSES: Present tense ONLY. Use imperfective verbs for habits
- SENTENCE STRUCTURE: Simple Subject-Verb-Object (max 8 words per sentence)
- TOPICS: Strictly limit to: Alphabet, Numbers (1-100), Family (семья), Pets (домашние животные), 
  Town (город), Home (дом), Hobbies (хобби), Free Time (свободное время)
- VOCABULARY: High-frequency concrete nouns and basic verbs only

ERROR CORRECTION PROTOCOL:
- MAJOR ERRORS (wrong verb conjugation, impossible syntax): Stop and explain in English
- MINOR ERRORS (gender mismatch in adjectives): Gently recast the correct form in Russian and continue
- Do not overwhelm the student - maximum 1 correction per response

EXAMPLE INTERACTIONS:
Student: "Я люблю футбол" ✓ (Correct - Nominative + Accusative)
Tutor: "Отлично! Ты часто играешь в футбол?"
`;
      speedRecommendation = '0.75';
      
    } else if (userLevel === 'foundation') {
      promptContext = `
MODE: GCSE FOUNDATION TIER (Grades 1-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PEDAGOGICAL CONSTRAINTS:
- GRAMMAR: Past tense (прошедшее время), Future tense (будущее время)
- CASES: Nominative, Accusative, Genitive (after numbers 2-4, negations), 
  Prepositional (location: в школе, о семье), Dative (high-frequency: мне нравится)
- SENTENCE STRUCTURE: Simple subordination allowed (и, но, потому что, когда)
- TOPICS: Identity & Culture, Local Area & Holiday, School, Daily Routine, Food

ERROR CORRECTION PROTOCOL:
- Correct case errors and aspect confusion
- Encourage use of past/future but don't force complex structures
- Praise attempts at subordination

EDEXCEL ALIGNMENT: Focus on AO1 (Communication) and AO2 (Vocabulary range)
`;
      speedRecommendation = '0.90';
      
    } else { // higher
      promptContext = `
MODE: GCSE HIGHER TIER (Grades 4-9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PEDAGOGICAL CONSTRAINTS:
- GRAMMAR: All six cases in singular and plural, including Instrumental (творительный падеж)
- ASPECTS: Active use of perfective/imperfective distinction (вид глагола)
- ADVANCED STRUCTURES: Conditional mood (если бы + past tense), Gerunds (деепричастия),
  Subjunctive with чтобы, Passive voice (страдательный залог)
- TOPICS: Future Aspirations (карьера, университет), Global Issues (экология, социальные проблемы),
  Russian Literature & Culture, Environmental Campaigns

ERROR CORRECTION PROTOCOL:
- Expect grammatical precision - correct aspectual errors immediately
- Challenge the student to justify opinions and use abstract vocabulary
- Introduce complex sentence structures to test subordination

EDEXCEL ALIGNMENT: Target AO3 (Accuracy) and AO4 (Range of language)
Push for Grade 7-9 descriptors: "Highly accurate use of complex language"
`;
      speedRecommendation = '1.10';
    }

    const systemPrompt = `
You are an expert Russian language tutor specializing in the Pearson Edexcel GCSE (9-1) Russian specification.
You are tutoring a student from The Latymer School (UK).

CURRENT STUDENT LEVEL: ${userLevel.toUpperCase()}

${promptContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST respond with VALID JSON in this exact structure:
{
  "russian": "Your conversational reply in Russian (Cyrillic script)",
  "english_feedback": "Correction of the user's previous input in English, or null if no error",
  "transliteration": "Phonetic guide for beginners using Latin letters (only if level is beginner), or null",
  "topic_alignment": "Which GCSE theme this fits (Identity/Holiday/School/Future/Global) or null"
}

CRITICAL RULES:
1. The "russian" field is your main tutoring response - keep it conversational and natural
2. The "english_feedback" should be constructive and brief (1-2 sentences max)
3. For beginners, provide transliteration to help with pronunciation
4. Always maintain an encouraging, patient tone - you are a supportive tutor

RECOMMENDED SPEECH RATE FOR TTS: ${speedRecommendation}x

Begin the tutoring session!
`;

    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Prepend system prompt as first user message
    geminiMessages.unshift({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });

    // Add a model response acknowledging the instructions
    geminiMessages.splice(1, 0, {
      role: 'model',
      parts: [{ text: 'Understood. I will act as a Russian GCSE tutor following these exact pedagogical constraints and respond in the specified JSON format.' }]
    });

    // Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const data = await geminiResponse.json();
    
    // Extract text content from Gemini response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response from Gemini
    let parsedResponse: TutorResponse;
    try {
      // Remove any markdown code fences if present
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      // Fallback if Gemini didn't return valid JSON
      parsedResponse = {
        russian: responseText,
        english_feedback: null,
        transliteration: null,
        topic_alignment: null,
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};
