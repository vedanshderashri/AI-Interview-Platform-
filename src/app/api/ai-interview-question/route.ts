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

  // Infrastructure/Backend
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

  // Psychometrics
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

  // Advanced Topics
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
};

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const domainContext = domains
      .map((d) => `- ${d}`)
      .join("\n");

    const previousQuestionsContext =
      conversationHistory.length > 0
        ? `Previous questions and answers in this interview:\n${conversationHistory
            .map((msg) => `${msg.role === "model" ? "Question" : "Answer"}: ${msg.content}`)
            .join("\n\n")}`
        : "This is the first question.";

    const systemPrompt = `You are an expert technical interviewer conducting a highly interactive, one-to-one professional interview.
Your goal is to make the candidate feel like they are in a real, live conversation.

Candidate Name: ${candidateName}
Selected Domains/Topics: 
${domainContext}

${resumeText ? `Candidate's Resume:\n${resumeText.substring(0, 1000)}` : "No resume was provided. Use general domain knowledge for questions."}

${previousQuestionsContext}

Current Stage: Question ${questionNumber} of 10

Guidelines for a One-to-One Conversational Experience:
1. ACKNOWLEDGE and briefly VALIDATE the candidate's previous answer if one was provided. (e.g., "That's a solid explanation of...", "I like how you mentioned...", "Interesting perspective on...")
2. If the previous answer was brief or missing details, ask a FOLLOW-UP question to dig deeper into their specific experience.
3. If the previous answer was comprehensive, move to a NEW topic within the selected domains.
4. Maintain a professional yet ENCOURAGING and natural conversational tone.
5. Reference the candidate's resume or specific projects they mentioned in their previous answers to show you are listening.
6. AVOID generic, canned questions. Tailor each question to the flow of the conversation.
7. Keep your response concise (3-4 sentences max). It should include a brief acknowledgement/feedback followed by the next question or follow-up.
8. Do not use numbering (like "Question 2:") or meta-commentary about the process.
9. Speak DIRECTLY to the candidate.

Generate your conversational response now.`;

    const result = await model.generateContent(systemPrompt);
    const question = result.response.text();
    
    if (!question || question.trim().length === 0) {
      console.warn("Gemini returned empty response, using fallback");
      return getFallbackQuestion(domains, questionNumber);
    }

    return question.trim();
  } catch (error) {
    console.error("Error generating question with Gemini:", error);
    // Log domain info for debugging custom domains
    const hasCustomDomain = domains.some(d => !Object.keys(INTERVIEW_QUESTIONS_BY_DOMAIN).includes(d));
    if (hasCustomDomain) {
      console.warn("Custom domain detected, attempting Gemini-based generation");
    }
    // Fallback to predefined questions
    return getFallbackQuestion(domains, questionNumber);
  }
}

function getFallbackQuestion(
  domains: string[],
  questionNumber: number
): string {
  // Check if any domain is custom (not in our predefined list)
  const customDomains = domains.filter(
    d => !(d in INTERVIEW_QUESTIONS_BY_DOMAIN)
  );

  // If we have custom domains, generate domain-specific questions
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
    
    // Use a random index to ensure variety across sessions
    const randomIndex = Math.floor(Math.random() * customDomainQuestions.length);
    return customDomainQuestions[randomIndex];
  }

  // For predefined domains, select randomly
  const selectedDomain = domains.find(d => d in INTERVIEW_QUESTIONS_BY_DOMAIN) || domains[0];
  const questions =
    (INTERVIEW_QUESTIONS_BY_DOMAIN as Record<string, string[]>)[selectedDomain] ||
    INTERVIEW_QUESTIONS_BY_DOMAIN["Resume Analysis"];

  // Use random selection to avoid exact repetition across sessions
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
