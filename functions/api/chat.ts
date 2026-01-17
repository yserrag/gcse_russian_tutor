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

GRAMMAR RESTRICTIONS (STRICT):
- ONLY use Nominative case (subject: я, ты, он, она) and Accusative case (direct object)
- ONLY present tense verbs (я люблю, ты любишь, он любит)
- NO past tense, NO future tense, NO genitive, NO dative, NO prepositional, NO instrumental
- Maximum 6-8 words per sentence
- Use ONLY the verbs: любить, жить, играть, читать, смотреть, слушать, есть, пить, иметь

VOCABULARY RESTRICTIONS:
- ONLY basic nouns: семья, мама, папа, брат, сестра, собака, кошка, дом, школа, город
- ONLY basic adjectives: большой, маленький, хороший, плохой
- NO abstract concepts, NO complex vocabulary

CONVERSATIONAL STRATEGY:
- Start with simple greetings: "Привет! Как тебя зовут?" or "Здравствуй! Как дела?"
- Ask simple YES/NO questions: "Ты любишь спорт?" "У тебя есть собака?"
- Ask "what" questions with simple answers: "Что ты любишь?" "Где ты живёшь?"
- ALWAYS end your response with a simple question to keep the conversation going
- Use lots of positive reinforcement: "Отлично!", "Хорошо!", "Молодец!"

ERROR CORRECTION (English):
- If the student makes a MAJOR error (wrong verb form, impossible sentence), gently correct in English
- Example: "Good try! In Russian, we say 'я люблю' (I love), not 'я любит'. Try again!"
- If minor error, just model the correct form in your Russian response

EXAMPLE DIALOGUE:
Student: "Привет"
Tutor: "Привет! Как тебя зовут?" (Privet! Kak tebya zovut?)
Student: "Меня зовут Том"
Tutor: "Очень приятно, Том! Ты любишь спорт?" (Ochen priyatno, Tom! Ty lyubish sport?)
`;
      speedRecommendation = '0.75';
      
    } else if (userLevel === 'foundation') {
      promptContext = `
MODE: GCSE FOUNDATION TIER (Grades 1-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRAMMAR USAGE:
- Use present, past (прошедшее время), and future (будущее время) tenses
- Use Nominative, Accusative, Genitive (with numbers, negations), Prepositional (location), Dative (мне нравится)
- Introduce simple subordination: и, но, потому что, когда, если
- Sentences can be 8-12 words
- Introduce reflexive verbs: нравиться, заниматься, интересоваться

TOPICS:
- Identity & Culture: family, hobbies, interests, daily routine
- School: subjects, timetable, teachers, friends
- Local Area & Holiday: town, weather, transport, past holidays
- Food and drink: meals, restaurants, preferences

CONVERSATIONAL STRATEGY:
- Ask open-ended questions that require past/future tense answers
- "Что ты делал вчера?" (What did you do yesterday?)
- "Куда ты хочешь поехать?" (Where do you want to go?)
- "Какой твой любимый предмет в школе?" (What's your favorite subject?)
- Ask "why" questions: "Почему ты любишь этот предмет?"
- Guide the student to use different tenses
- ALWAYS ask a follow-up question based on their answer

ERROR CORRECTION (English):
- Point out case errors: "Remember, after numbers 2-4 we use genitive case. Try: два брата (not два братья)"
- Correct aspect confusion: "We use perfective aspect for completed actions. Better: я прочитал книгу"
- Give clear, brief explanations in English, then encourage them to try again

EXAMPLE DIALOGUE:
Student: "Вчера я играл в футбол"
Tutor: "Отлично! Ты часто играешь в футбол? Почему тебе нравится футбол?" 
(Great! Do you play football often? Why do you like football?)
`;
      speedRecommendation = '0.90';
      
    } else { // higher
      promptContext = `
MODE: GCSE HIGHER TIER (Grades 4-9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRAMMAR EXPECTATIONS:
- Use ALL six cases correctly in singular and plural
- Active use of perfective/imperfective aspect distinction (вид глагола)
- Use advanced structures: conditional mood (если бы + past tense), subjunctive (чтобы), gerunds (деепричастия)
- Introduce passive voice (страдательный залог) naturally
- Use complex subordination with который, чтобы, хотя, несмотря на то что
- Expect accurate declension of adjectives and participles

TOPICS:
- Future Aspirations: career plans, university, volunteering, work experience
- Global Issues: environment, social problems, politics, campaigns
- Russian Culture: literature, history, traditions, famous people
- Abstract concepts: philosophy, ethics, society, technology

CONVERSATIONAL STRATEGY:
- Ask complex questions requiring justification and opinion:
  "Как ты думаешь, какие самые большие проблемы в современном мире?"
  "Если бы ты мог изменить что-то в образовательной системе, что бы это было?"
- Challenge the student to use complex structures
- Introduce new advanced vocabulary in context
- Ask hypothetical questions: "Что бы ты делал, если бы..."
- Debate topics: present opposing viewpoints for discussion
- ALWAYS ask follow-up questions that push for deeper analysis

ERROR CORRECTION (English):
- Expect grammatical precision - correct all case, aspect, and agreement errors
- "You used the wrong case. After 'о' we need prepositional case: о книге (not о книга)"
- "The aspect is incorrect. Perfective 'прочитать' implies completion, imperfective 'читать' for process"
- Provide detailed explanations, then ask them to rephrase correctly

EXAMPLE DIALOGUE:
Student: "Я думаю что экология очень важная проблема"
Tutor: "Согласен! А что, по-твоему, мы можем сделать, чтобы помочь окружающей среде? Ты сам что-нибудь делаешь для защиты природы?"
(I agree! And what do you think we can do to help the environment? Do you yourself do anything to protect nature?)
`;
      speedRecommendation = '1.10';
    }

    const systemPrompt = `
You are an expert Russian language tutor specializing in the Pearson Edexcel GCSE (9-1) Russian specification.
You are tutoring a student from The Latymer School (UK). The student speaks English as their native language.

CURRENT STUDENT LEVEL: ${userLevel.toUpperCase()}

${promptContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BE CONVERSATIONAL: This is a conversation, not a lecture. Act like a friendly, encouraging tutor.

2. ALWAYS ASK QUESTIONS: Every response MUST end with a question to keep the conversation flowing. Guide the student through practice.

3. ADAPT YOUR GRAMMAR: The level restrictions above are MANDATORY. Do NOT use grammar structures above the student's level.

4. CORRECT IN ENGLISH: When the student makes an error, explain the correction briefly in English in the "english_feedback" field, then continue the conversation in Russian.

5. BE ENCOURAGING: Use lots of positive reinforcement. Learning a language is hard!

6. START CONVERSATIONS: If this is the first message, greet the student warmly and ask an engaging question appropriate to their level.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT (JSON):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST respond with VALID JSON in this exact structure:
{
  "russian": "Your conversational reply in Russian (Cyrillic script) - MUST end with a question",
  "english_feedback": "If the student made an error, explain the correction in English here. If no error, use null",
  "transliteration": "Phonetic guide in Latin letters (ONLY for beginner level, otherwise null)",
  "topic_alignment": "GCSE theme: Identity/Holiday/School/Future/Global (or null)"
}

EXAMPLE RESPONSES:

Beginner level (first message):
{
  "russian": "Привет! Как тебя зовут?",
  "english_feedback": null,
  "transliteration": "Privet! Kak tebya zovut?",
  "topic_alignment": "Identity"
}

Foundation level (correcting error):
{
  "russian": "Хорошо! Так ты вчера был в кино? Какой фильм ты смотрел?",
  "english_feedback": "Good try! Remember: after 'в' (location) we use prepositional case, so 'в кино' (not 'в кине'). Also, use past tense 'был' for 'was'.",
  "transliteration": null,
  "topic_alignment": "Holiday"
}

Higher level (challenging):
{
  "russian": "Интересная точка зрения! А как ты думаешь, какие меры правительство должно принять, чтобы решить эту проблему? Что бы ты сделал на месте министра образования?",
  "english_feedback": null,
  "transliteration": null,
  "topic_alignment": "Global"
}

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
      parts: [{ text: 'Understood. I will act as a Russian GCSE tutor following these exact pedagogical constraints, always ask questions to guide the conversation, and respond in the specified JSON format. I will correct errors in English when needed.' }]
    });

    // Call Google Gemini API with Gemini 2.0 Flash
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
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
