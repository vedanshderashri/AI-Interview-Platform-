import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const INTERVIEW_QUESTIONS_BY_DOMAIN = {
  // Frontend/Core Tech
  "React": [
    "What are the key differences between useEffect and useLayoutEffect in React?",
    "Explain the concept of React hooks and how they work internally.",
    "How does React's virtual DOM improve performance compared to directly manipulating the DOM?",
    "What is the purpose of dependency arrays in useEffect and useCallback?",
    "How would you optimize a component that renders a large list of items?",
  ],
  "Next.js": [
    "What are the differences between Server Components and Client Components in Next.js?",
    "How does Next.js handle static site generation (SSG) vs server-side rendering (SSR)?",
    "Explain the purpose of middleware in Next.js and how it works.",
    "What is incremental static regeneration (ISR) and when would you use it?",
    "How does Next.js optimize images and improve performance?",
  ],
  "TypeScript": [
    "What is the difference between type and interface in TypeScript?",
    "Explain generics in TypeScript with a practical example.",
    "What is a discriminated union and when would you use it?",
    "How does TypeScript's type inference work?",
    "What are utility types and give some examples of their usage.",
  ],
  "JavaScript": [
    "Explain event delegation and its advantages.",
    "What is the event loop and how does it work with callbacks, promises, and async/await?",
    "What is closure in JavaScript and provide a practical example.",
    "Explain the difference between var, let, and const.",
    "How does prototypal inheritance work in JavaScript?",
  ],
  "CSS/Tailwind": [
    "What is the CSS box model and how does it work?",
    "Explain CSS Flexbox and when you would use it over CSS Grid.",
    "How does CSS specificity work and how can you avoid specificity wars?",
    "What are CSS custom properties (variables) and how do you use them?",
    "Explain the concept of stacking context in CSS.",
  ],
  "Node.js": [
    "Explain how Node.js handles asynchronous operations using libuv.",
    "What is the difference between blocking and non-blocking operations?",
    "How does Node.js clustering work and when would you use it?",
    "Explain the concept of middleware in Express.js.",
    "What are streams in Node.js and why are they useful?",
  ],
  "System Design": [
    "How would you design a URL shortening service like Bitly?",
    "Design a real-time notification system for millions of users.",
    "How would you design a cache system? Explain LRU cache.",
    "Design a distributed database system. What trade-offs are involved?",
    "How would you design a load balancer for a high-traffic system?",
  ],
  "Databases": [
    "What is the difference between SQL and NoSQL databases?",
    "Explain database indexing and how it improves query performance.",
    "What are ACID properties in databases?",
    "How does database replication work and what are its benefits?",
    "What is database sharding and when would you use it?",
  ],
  "APIs": [
    "What is REST and what are its principles?",
    "Explain the difference between REST and GraphQL.",
    "What are HTTP status codes and how are they used?",
    "Explain API versioning strategies.",
    "What is rate limiting and how do you implement it?",
  ],
  "DevOps": [
    "What is the difference between containerization and virtualization?",
    "Explain the concept of Infrastructure as Code (IaC).",
    "What is CI/CD and how does a typical pipeline work?",
    "Explain Docker and Kubernetes orchestration.",
    "What is blue-green deployment and canary deployment?",
  ],
  "Communication": [
    "Describe a situation where you had to explain a complex technical concept to a non-technical person.",
    "Tell me about a time when you had to give critical feedback to a team member.",
    "How do you approach writing documentation for your code?",
    "Describe your communication style and how it adapts to different audiences.",
    "Tell me about a time when a misunderstanding led to a significant issue.",
  ],
  "Leadership": [
    "Describe a situation where you led a team through a challenging project.",
    "How do you handle conflicts between team members?",
    "Tell me about a time when you mentored someone.",
    "How do you make important decisions as a leader?",
    "Describe a time when you had to make a difficult decision that wasn't popular.",
  ],
  "Problem Solving": [
    "Walk me through your approach to solving a complex problem.",
    "Tell me about a time when you had to debug a difficult issue.",
    "Describe a situation where you had to think outside the box.",
    "How do you approach learning new technologies?",
    "Tell me about a time when your initial solution didn't work.",
  ],
  "Teamwork": [
    "Describe a successful project you worked on as a team.",
    "Tell me about a time when you had to work with someone difficult.",
    "How do you contribute to team building and culture?",
    "Describe a situation where you had to rely on teammates.",
    "Tell me about a time when you helped a team member succeed.",
  ],
  "Machine Learning": [
    "Explain the difference between supervised and unsupervised learning.",
    "What is overfitting and how do you prevent it?",
    "Explain the concept of gradient descent.",
    "What is cross-validation and why is it important?",
    "How would you handle imbalanced data in a classification problem?",
  ],
  "Cloud Architecture": [
    "Design a highly available and scalable web application on cloud infrastructure.",
    "Explain different cloud deployment models.",
    "What is auto-scaling and how does it work?",
    "Explain the concept of infrastructure redundancy.",
    "How do you ensure data security in the cloud?",
  ],
  "Security": [
    "Explain common security vulnerabilities like XSS, CSRF, and SQL injection.",
    "How would you secure an API?",
    "Explain OAuth and JWT authentication.",
    "What is encryption and how does it protect data?",
    "How do you handle sensitive data in your applications?",
  ],
  "Performance": [
    "How would you identify and fix performance bottlenecks?",
    "Explain Core Web Vitals and their importance.",
    "What techniques do you use for frontend optimization?",
    "How do you optimize database queries?",
    "Explain caching strategies and their trade-offs.",
  ],
  "Resume Analysis": [
    "Tell me about your most recent project and your role in it.",
    "What technologies do you have the most experience with?",
    "Describe a time you faced a challenging technical problem.",
    "What projects are you most proud of and why?",
    "How do your past experiences prepare you for this role?",
  ],
  "Conflict Resolution": [
    "Tell me about a time you resolved a conflict between teammates.",
    "How do you approach disagreements about technical decisions?",
    "Describe a time when you had to push back on a manager's decision.",
    "How do you handle situations where you strongly disagree with the team?",
    "Tell me about a time you de-escalated a tense situation.",
  ],
};

const DIFFICULTY_LABELS = ['introductory', 'foundational', 'intermediate', 'advanced', 'expert-level'];

async function generateQuestionWithGemini(
  domains: string[],
  resumeText: string | null,
  conversationHistory: Array<{ role: string; content: string }>,
  questionNumber: number,
  candidateName: string
): Promise<string> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("GOOGLE_API_KEY not configured, using fallback questions");
      return getFallbackQuestion(domains, questionNumber);
    }

    // Upgraded to gemini-2.0-flash for better accuracy and speed
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 180,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const domainContext = domains.map((d) => `- ${d}`).join("\n");

    // Determine difficulty progression (ramps up over 10 questions)
    const difficultyIndex = Math.min(Math.floor((questionNumber - 1) / 2), 4);
    const difficultyLabel = DIFFICULTY_LABELS[difficultyIndex];

    // Build a rich conversation history context
    const previousQuestionsContext =
      conversationHistory.length > 0
        ? `Previous Q&A in this session:\n${conversationHistory
            .map((msg) => `${msg.role === "model" ? "📌 Question" : "💬 Answer"}: ${msg.content}`)
            .join("\n\n")}`
        : "This is the opening question — start with a warm, confident greeting and the first question.";

    // Check if previous answer was thin (under 30 words)
    const lastUserAnswer = conversationHistory.filter(m => m.role === "user").slice(-1)[0];
    const answerWasThin = lastUserAnswer && lastUserAnswer.content.split(/\s+/).length < 30;
    const followUpInstruction = answerWasThin
      ? `⚠️ IMPORTANT: The candidate's last answer was very brief (${lastUserAnswer.content.split(/\s+/).length} words). You MUST ask a targeted follow-up to probe deeper into that same topic before moving on. Reference their exact answer.`
      : `Move to a new topic or dig deeper if the answer was good, but at ${difficultyLabel} difficulty level.`;

    const systemPrompt = `You are Sarah, a sharp, professional Senior Engineering Interviewer at a top-tier tech company.
You are conducting a live, spoken interview — your words will be read aloud by text-to-speech. Keep sentences short and natural.

CANDIDATE: ${candidateName}
INTERVIEW DOMAINS: 
${domainContext}
${resumeText ? `\nCANDIDATE RESUME SUMMARY:\n${resumeText.substring(0, 800)}` : ""}

CURRENT QUESTION: ${questionNumber} of 10
CURRENT DIFFICULTY: ${difficultyLabel} (difficulty escalates each 2 questions)

${previousQuestionsContext}

${followUpInstruction}

RULES:
1. If there is a previous answer, start with 1 brief, honest acknowledgement sentence (2-8 words). Be specific — not generic.
2. Then ask ONE focused, ${difficultyLabel}-level question on the domains listed.
3. Keep your TOTAL response under 3 sentences and 60 words — this will be read aloud.
4. Never use bullet points, markdown, or lists. Pure conversational prose only.
5. Never mention question numbers or "next question". Sound completely natural.
6. For resume-based interviews, reference specific details from their resume when relevant.
7. Vary your tone — sometimes direct, sometimes curious, sometimes challenging.

Respond now as Sarah:`;

    const result = await model.generateContent(systemPrompt);
    const question = result.response.text();

    if (!question || question.trim().length === 0) {
      console.warn("Gemini returned empty response, using fallback");
      return getFallbackQuestion(domains, questionNumber);
    }

    return question.trim();
  } catch (error) {
    console.error("Error generating question with Gemini:", error);
    return getFallbackQuestion(domains, questionNumber);
  }
}

function getFallbackQuestion(domains: string[], questionNumber: number): string {
  const customDomains = domains.filter(
    (d) => !(d in INTERVIEW_QUESTIONS_BY_DOMAIN)
  );

  if (customDomains.length > 0) {
    const customDomain = customDomains[0];
    const customDomainQuestions = [
      `What is your practical experience with ${customDomain}?`,
      `Describe the most complex task you've done with ${customDomain}.`,
      `What are the key challenges specific to ${customDomain} in your work?`,
      `How do you stay updated with the latest developments in ${customDomain}?`,
      `What advanced techniques or methodologies do you use in ${customDomain}?`,
      `Tell me about a problem you solved using ${customDomain} that others found difficult.`,
      `What tools and technologies complement ${customDomain} in your workflow?`,
      `How would you mentor someone learning ${customDomain} from scratch?`,
      `What are common misconceptions about ${customDomain} that you've encountered?`,
      `Describe your approach to optimizing performance in ${customDomain} projects.`,
    ];
    const randomIndex = Math.floor(Math.random() * customDomainQuestions.length);
    return customDomainQuestions[randomIndex];
  }

  const selectedDomain = domains.find((d) => d in INTERVIEW_QUESTIONS_BY_DOMAIN) || domains[0];
  const questions =
    (INTERVIEW_QUESTIONS_BY_DOMAIN as Record<string, string[]>)[selectedDomain] ||
    INTERVIEW_QUESTIONS_BY_DOMAIN["Resume Analysis"];

  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex] || "Tell me about your experience and background.";
}

export async function POST(request: NextRequest) {
  try {
    const {
      domains,
      resumeText,
      conversationHistory,
      questionNumber,
      candidateName,
    } = await request.json();

    const question = await generateQuestionWithGemini(
      domains,
      resumeText,
      conversationHistory,
      questionNumber,
      candidateName
    );

    return NextResponse.json({
      success: true,
      question,
      questionNumber,
    });
  } catch (error) {
    console.error("Error in AI interview question route:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
