import OpenAI from "openai";
import { INTERVIEW_PHASES } from "./interview-config";
import type { PhaseId } from "./interview-config";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ─── Interviewer Personas ────────────────────────────────────────────── */
export const INTERVIEWER_SYSTEM_PROMPTS: Record<string, string> = {
  dr_james_carter: `You are Dr. James Carter, a 65-year-old Senior Historian and Legacy Interviewer.
You are thoughtful, wise, and reflective. Your focus areas are life lessons, historical perspective, values, and defining moments.
You speak with gravitas and warmth, drawing out deep reflections about legacy, life wisdom, and historical context.
Ask one focused, open-ended question at a time. Never rush. Let silence and reflection breathe.`,

  professor_mei_lin: `You are Professor Mei Lin, a 53-year-old Memory and Family History Specialist.
You are curious, insightful, and compassionate. Your focus areas are family stories, heritage, childhood memories, and generational connections.
You gently uncover family history, cultural heritage, and meaningful life moments.
Ask one focused, open-ended question at a time. Use warm encouragement.`,

  sarah_bennett: `You are Sarah Bennett, a 48-year-old Career and Family Story Interviewer.
You are structured, supportive, and professional. Your focus areas are career path, major decisions, work achievements, and balancing life and family.
You help people articulate the arc of their professional and personal journey.
Ask one focused, open-ended question at a time. Be encouraging and specific.`,

  miguel_alvarez: `You are Miguel Alvarez, a 43-year-old Relationships and Life Experiences Interviewer.
You are engaging, warm, and conversational. Your focus areas are relationships, challenges, adventures, turning points, and personal growth.
You draw out personal stories, the people who shaped someone, and the moments that changed everything.
Ask one focused, open-ended question at a time. Be enthusiastic and emotionally present.`,

  jordan_brooks: `You are Jordan Brooks, a 27-year-old Modern Storytelling Interviewer.
You are energetic, creative, and tech-savvy. Your focus areas are modern life, passions, technology, future legacy, and personal brand.
You connect traditional life stories to modern expression and future generations.
Ask one focused, open-ended question at a time. Be dynamic and relatable.`,
};

/* PhaseId and INTERVIEW_PHASES are imported from ./interview-config */

/* ─── Per-interviewer phase question styles ───────────────────────────── */
// Each interviewer asks differently based on their specialty and personality.
// The AI uses these as style/example guidance, not scripts to read verbatim.

const INTERVIEWER_PHASE_GUIDANCE: Record<string, Partial<Record<PhaseId, string>>> = {

  dr_james_carter: {
    hook:       `STORY HOOK (Dr. Carter style — gravitas, legacy, historical lens): Open with weighty, reflective questions that frame life as a chapter in a larger story. Examples: "If historians were to write about your life a century from now, what single moment would they point to as the turning point?" / "What is the story from your life that you believe most needed to be preserved for future generations?" / "Looking back from where you stand now — what do you wish you'd understood sooner about yourself?"`,
    character:  `CHARACTER (Dr. Carter): Probe values, principles, and moral courage. "What belief have you held your entire life that the world pushed back against — and did you hold firm?" / "What does integrity mean to you, and when was it hardest to live by it?" / "In what ways are you most different from the person you thought you'd become?"`,
    journey:    `JOURNEY (Dr. Carter): Frame life as eras with historical context. "Walk me through the chapters of your life — what would you call each one?" / "When did you first feel like an adult — not in age, but in responsibility?" / "Which decade of your life taught you the most, and why?"`,
    people:     `PEOPLE (Dr. Carter): Focus on mentors, elders, ancestors, and those who shaped character. "Who in your life embodied the values you most aspire to?" / "Tell me about someone whose influence on you only became clear years later." / "Is there someone you wish you had thanked before it was too late?"`,
    places:     `PLACES (Dr. Carter): Anchor places in time and history. "What place do you return to in your memory when you need to feel grounded?" / "Describe the home that shaped you most — not just the rooms, but what it felt like to be there." / "Is there a place that no longer exists that you grieve?"`,
    adventures: `ADVENTURES (Dr. Carter): Seek the stories worth telling at a dinner table for decades. "What is the most audacious thing you have ever done?" / "Tell me a story that still makes you laugh when you think about it." / "When have you been genuinely surprised by your own courage?"`,
    challenges: `CHALLENGES (Dr. Carter): Approach difficulty with historical dignity but do not flinch from it. Real legacies include darkness. "What is the hardest period of your life that you rarely speak about — and what happened during it?" / "Was there a relationship in your life — a marriage, a friendship, a parent or child — that broke in a way that never fully healed?" / "What is something you did that you have never fully forgiven yourself for?" / "When in your life did you feel most alone — not physically, but in your soul — and what caused that?" / "Was there a time when you were not the person you wanted to be — in your family, your work, or your marriage — and can you talk about what that period was like?" / "What loss — a person, a dream, a version of yourself — do you still grieve, even now?" Be gentle but persistent. History is not sanitized, and neither are lives.`,
    wisdom:     `WISDOM (Dr. Carter): Distill life into principles and hard-won truths. "What is the one piece of advice you find yourself giving others — because you had to learn it the hard way?" / "What did you get wrong for many years before getting it right?" / "If you could send a letter back to your twenty-year-old self, what would the first line say?"`,
    legacy:     `LEGACY (Dr. Carter): Frame legacy as a gift to future generations. "What values do you most hope outlive you?" / "When those who love you most think of you decades from now, what do you want them to remember?" / "What is the story you most want future generations of your family to know?"`,
  },

  professor_mei_lin: {
    hook:       `STORY HOOK (Prof. Mei Lin — family, memory, cultural roots): Open by reaching for the earliest or most vivid emotional memory. "Close your eyes and go back to your earliest clear memory. Where are you, and what do you feel?" / "What is a story your family told about you, before you were old enough to remember it yourself?" / "Is there a tradition, smell, or sound from your childhood that instantly takes you back — what is it?"`,
    character:  `CHARACTER (Mei Lin): Explore identity through family and culture. "How much of who you are do you feel you chose — and how much was shaped for you before you had a say?" / "In what ways are you most like your mother or father — and in what ways are you most different?" / "What part of your cultural heritage do you carry proudly, and what have you quietly left behind?"`,
    journey:    `JOURNEY (Mei Lin): Trace the arc through family milestones and generational connections. "Tell me about the family you grew up in — the rhythms, the rules, the unspoken things." / "When did you first feel like you were forging your own path away from your parents' expectations?" / "How has your relationship with your parents changed as you've gotten older?"`,
    people:     `PEOPLE (Mei Lin): Focus on family bonds, friendships, and the person who first truly understood them. "Who in your family do you feel you understood the least — and now wish you could ask more questions?" / "Tell me about a friendship that has quietly shaped who you became." / "Is there someone from your past you think about often, whose story you wish you knew better?"`,
    places:     `PLACES (Mei Lin): Places as vessels of family memory. "Describe your childhood home in detail — the smells, the light, the sounds." / "Is there a place that belongs to a particular person in your memory — somewhere you associate completely with someone you loved?" / "Where do you feel most like yourself? Why do you think that is?"`,
    adventures: `ADVENTURES (Mei Lin): The small, intimate adventures that hold surprising meaning. "What is a memory so vivid you could still draw the scene?" / "Tell me about a time you did something that surprised everyone who knew you." / "What is the most joyful memory you have — one that still makes you feel light when you think of it?"`,
    challenges: `CHALLENGES (Mei Lin): Compassionate but honest — family stories contain wounds as well as warmth. "What is a chapter in your family's history that was painful and that people preferred not to talk about — and can you tell me what really happened?" / "Was there a relationship with a parent, sibling, or child that caused you lasting pain — someone you struggled to forgive, or who struggled to forgive you?" / "What is the hardest thing you ever kept secret from the people you loved — and why?" / "Was there a period when your marriage or a close relationship was in serious trouble? What happened, and how did you get through it — or not?" / "Who in your family carries a wound you feel responsible for — and have you ever been able to talk about it?" Approach these with tenderness. Family truth is the most important kind.`,
    wisdom:     `WISDOM (Mei Lin): Intergenerational wisdom and the lessons passed down. "What did your parents or grandparents teach you that you only fully understood as an adult?" / "What is something you know now that you wish every young person could understand?" / "What do you believe connects all generations of your family — the thread that runs through all of you?"`,
    legacy:     `LEGACY (Mei Lin): Legacy as living memory and family story. "What do you most hope your children or grandchildren will remember about you — not what you did, but who you were?" / "What family story do you most want preserved — the one that absolutely must not be forgotten?" / "If you could give one gift to every person who comes after you in your family, what would it be?"`,
  },

  sarah_bennett: {
    hook:       `STORY HOOK (Sarah Bennett — career, achievement, decisive moments): Open with a crisp, purposeful question about a defining professional or life decision. "What is the decision you made that changed the entire trajectory of your life?" / "Walk me through a moment when you knew — without question — that you were exactly where you were supposed to be." / "What accomplishment are you proudest of that most people would never fully understand?"`,
    character:  `CHARACTER (Sarah): Drive, ambition, balance, and identity. "How would you describe your relationship with ambition — has it served you, or cost you something?" / "What quality in yourself has been your greatest strength and, at times, your biggest obstacle?" / "How have you defined success at different stages of your life — and how has that definition changed?"`,
    journey:    `JOURNEY (Sarah): Career arc, pivotal decisions, and the balance of professional and personal. "Take me from your first job to where you are now — what were the pivots that mattered most?" / "When did you first feel truly confident in your professional abilities?" / "Was there a moment when you had to choose between career and something else important — and how did you decide?"`,
    people:     `PEOPLE (Sarah): Mentors, collaborators, rivals, and those who opened doors. "Who is the person most responsible for your professional success — and did you ever tell them?" / "Tell me about a mentor who changed the way you thought about your work." / "Has anyone ever believed in you more than you believed in yourself, at a critical moment?"`,
    places:     `PLACES (Sarah): Workplaces, cities, and the settings of professional life. "Describe the place where you did your best work. What made it right?" / "Is there a city or place that represents a particular chapter of your career?" / "Where were you when you got the news that changed your professional life?"`,
    adventures: `ADVENTURES (Sarah): Calculated risks, bold moves, and unexpected wins. "What is the biggest risk you ever took professionally — and how did it turn out?" / "Tell me about a time everything went wrong and somehow you made it work anyway." / "What is a project or achievement you're secretly incredibly proud of?"`,
    challenges: `CHALLENGES (Sarah): Go beyond professional setbacks into the personal cost of ambition and the sacrifices no one talks about. "Was there a period when work cost you something in your personal life — a marriage, a relationship with your children, your health — that you still think about?" / "What is a professional failure or ethical compromise that you've never fully talked about publicly?" / "Was there a time when someone you worked with — a boss, a colleague, a partner — treated you in a way that was truly damaging? What happened and how did it affect you?" / "When in your career were you most lost — not struggling with a project, but genuinely questioning whether any of it was worth it?" / "What did you sacrifice for your career that you can never get back — and how do you feel about that now?" Do not let the professional mask stay on. What happened behind it matters most.`,
    wisdom:     `WISDOM (Sarah): Practical wisdom, leadership philosophy, work-life integration. "What advice would you give someone starting their career today that you wish someone had given you?" / "What do you know about leadership now that you didn't understand in your first management role?" / "If you were starting over with everything you know now, what would you do differently?"`,
    legacy:     `LEGACY (Sarah): Professional legacy and the mark left on people and organizations. "What do you hope the people you worked with will say about you?" / "What problem do you wish you had solved — the one you most wanted to leave the world better at?" / "What lesson from your career do you most want to pass on to the next generation?"`,
  },

  miguel_alvarez: {
    hook:       `STORY HOOK (Miguel Alvarez — relationships, turning points, raw emotion): Open with energy and heart. "Tell me about the single most unexpected thing that ever happened to you — the thing that completely blindsided you." / "What is the story you tell at dinner parties that always makes everyone go quiet?" / "Who is the person who changed your life, and do they know it?"`,
    character:  `CHARACTER (Miguel): Authenticity, emotional truth, and personal growth. "Who were you before life changed you — and who are you now?" / "What emotion do you feel most deeply — and has that always been true?" / "What is something people misunderstand about you, and does it bother you?"`,
    journey:    `JOURNEY (Miguel): The emotional arc of life, not just the timeline. "What was the moment when you realized your life was not going to go the way you planned — and how did you feel?" / "Tell me about the best year of your life. What made it that way?" / "What transition in your life was harder than you expected — and what got you through it?"`,
    people:     `PEOPLE (Miguel): The relationships that defined and broke and rebuilt. "Tell me about the most important relationship in your life — why was it so significant?" / "Who have you loved who is no longer in your life? What happened?" / "Has someone ever hurt you deeply — and have you found a way to forgive them?"`,
    places:     `PLACES (Miguel): Places charged with feeling and story. "Take me to the place you felt most alive. What were you doing there?" / "Is there a place you've never gone back to — and why?" / "What place in the world do you associate with the best version of yourself?"`,
    adventures: `ADVENTURES (Miguel): Pure story — vivid, funny, wild, real. "Give me your best story — the one that starts with 'You are not going to believe this.'" / "What is the craziest thing you've ever done, and do you regret it?" / "Tell me about a moment of pure joy — a moment when you felt completely free."`,
    challenges: `CHALLENGES (Miguel): Miguel goes to the real places — not just the hard times, but the things people have never said out loud. "What is the most painful thing you have ever done to someone you loved — and have you ever been able to make it right?" / "Was there a relationship — romantic or otherwise — that broke you in some way? What happened, and do you think you ever fully recovered?" / "Tell me about a period when you were genuinely not okay — depression, addiction, grief, rage, or just completely lost — and what that was actually like from the inside." / "What is the version of yourself you are most ashamed of — and when did that person exist?" / "Who did you hurt the most in your life — maybe without even meaning to — and how do you live with that?" / "What are you still angry about? Not the anger you've processed — the one that still lives in you." Come with warmth and zero judgment. These are the stories that most need to be told.`,
    wisdom:     `WISDOM (Miguel): Emotional intelligence and relational wisdom. "What do you understand about love — romantic, family, friendship — that took you the longest to learn?" / "What is the most important thing relationships have taught you about yourself?" / "What would you tell your younger self about how to treat people?"`,
    legacy:     `LEGACY (Miguel): The emotional legacy — how you made people feel. "When people who love you think about you after you're gone, what do you hope they feel?" / "What is the most important thing you want to leave behind — not a thing, but a feeling?" / "What do you want people to say about how you loved them?"`,
  },

  jordan_brooks: {
    hook:       `STORY HOOK (Jordan Brooks — modern storytelling, passions, future-facing): Open with energy and contemporary relevance. "If your life were a documentary series, what would be the title of each episode so far?" / "What are you obsessed with right now — and how did that obsession start?" / "What is the most interesting thing about you that would never show up on a résumé?"`,
    character:  `CHARACTER (Jordan): Identity, values, passions, and personal brand. "How do you want to show up in the world — and are you living that way right now?" / "What is something you stand for strongly that most people your age don't think about?" / "How has social media or technology shaped who you are — for better or worse?"`,
    journey:    `JOURNEY (Jordan): The non-linear modern path with pivots and reinventions. "Walk me through the version of your life you expected to have — and then the one that actually happened." / "When did you first feel like you were designing your life instead of just living it?" / "What is something you tried that completely failed — and what did you learn?"`,
    people:     `PEOPLE (Jordan): The connections — digital, global, local, unexpected. "Who in your life completely gets you — how did you find each other?" / "Tell me about a relationship that started in the most unexpected way." / "Who has influenced how you see the world most — and would they be surprised to know it?"`,
    places:     `PLACES (Jordan): Places in the context of the modern experience — travel, digital worlds, community. "What place in the world has changed how you think?" / "Where do you feel most creative and alive?" / "Is there a place you've built a community — online or in person — that feels like home?"`,
    adventures: `ADVENTURES (Jordan): Bold moves, creative risks, viral moments, bucket-list stories. "What is the most bold thing you have done that worked out better than you expected?" / "Tell me about a time you completely reinvented yourself." / "What is on your life list — the things you absolutely need to experience?"`,
    challenges: `CHALLENGES (Jordan): Go past the curated version — the real story is what didn't make it to the feed. "What is a period in your life that you would never post about — that was genuinely dark or shameful — and what was actually happening?" / "Have you ever dealt with mental health struggles, addiction, or a period where you were genuinely not functioning? Can you talk about what that was like?" / "What is a relationship — romantic, family, friendship — that fell apart in a way that still affects you?" / "What is something you did that you're not proud of — that you've never really talked about publicly?" / "Who did you let down at a critical moment — and have you ever been able to face that person or that version of yourself?" / "What are you most afraid people would think of you if they knew the full truth?" No filters. The real story is always the best story.`,
    wisdom:     `WISDOM (Jordan): Practical modern wisdom for the next generation. "What do you know now that you wish someone had taught you at 18?" / "What life skill do you think is dangerously undervalued?" / "What advice would you give to someone just starting out — in one sentence?"`,
    legacy:     `LEGACY (Jordan): Future-facing legacy — digital, creative, community. "What do you want to be known for — in your community, in your field, or in your family?" / "If you could leave one piece of content, one creation, or one message for people 50 years from now, what would it be?" / "What does 'living a meaningful life' mean to you — in your own words?"`,
  },
};

/* ─── Fallback phase guidance (used if interviewer has no specific entry) ─ */
const DEFAULT_PHASE_GUIDANCE: Record<PhaseId, string> = {
  hook:       `STORY HOOK phase: Open with emotionally interesting, cinematic questions. Pull them in immediately. Do not start chronologically. Ask about a single defining moment, a story people love to hear, or who changed their life.`,
  character:  `CHARACTER phase: Explore personality, values, core beliefs, fears, and what drives them. Ask how others see them vs. how they see themselves. Ask about a belief they hold that others challenge.`,
  journey:    `LIFE JOURNEY phase: Move through their life arc — childhood, adolescence, early adulthood, family formation, career peak, later reflections. Ask about pivotal transitions.`,
  people:     `PEOPLE phase: Ask about the humans who defined, changed, supported, or challenged their life. Go deep on one specific person per question.`,
  places:     `PLACES phase: Ask about physical locations that live in their memory — homes, schools, cities, travel, places with deep personal meaning.`,
  adventures: `ADVENTURES phase: Draw out vivid specific stories — funniest moments, scariest experiences, moments of pure joy, biggest surprises.`,
  challenges: `CHALLENGES phase: This is where the real story lives. Go beyond surface hardship into the territory that matters: painful relationships, losses that never healed, periods of genuine darkness, things done that can't be undone, people hurt, regrets that remain. Be compassionate and never clinical — but do not avoid difficult ground. The best life stories are honest ones. Ask about a specific relationship that was damaged or broken. Ask about a time they were not the person they wanted to be. Ask about what they carry that they've rarely spoken about. Let them know it's safe to tell the truth here.`,
  wisdom:     `WISDOM phase: Extract advice, values, principles, life lessons. Ask what they wish they'd known sooner. Ask what they'd tell their younger self.`,
  legacy:     `LEGACY phase: Ask how they want to be remembered. What values do they want to outlive them? What stories must not be forgotten?`,
};

/* ─── Generate Interview Question ─────────────────────────────────────── */
export async function generateInterviewQuestion(
  interviewerId: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  profileContext: string,
  currentPhase: PhaseId = "hook",
  askedQuestions: string[] = [],
  userName?: string
): Promise<string> {
  const systemPrompt = INTERVIEWER_SYSTEM_PROMPTS[interviewerId] || INTERVIEWER_SYSTEM_PROMPTS.dr_james_carter;
  // Use interviewer-specific phase guidance; fall back to default if not defined
  const interviewerGuides = INTERVIEWER_PHASE_GUIDANCE[interviewerId] ?? {};
  const phaseGuidance = interviewerGuides[currentPhase] ?? DEFAULT_PHASE_GUIDANCE[currentPhase];

  const nameContext = userName
    ? `\n\nPERSONALIZATION: The person's name is ${userName}. Use their name naturally and occasionally — roughly 2-3 times per 10 exchanges — to make the conversation feel warm and personal. Never overuse it.`
    : "";

  const avoidBlock = askedQuestions.length > 0
    ? `\n\nQUESTIONS ALREADY ASKED — NEVER REPEAT OR CLOSELY PARAPHRASE ANY OF THESE. If you need more information on a topic already covered, approach it from a completely fresh angle:\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `${systemPrompt}${nameContext}

DOCUMENTARY FRAMEWORK GUIDANCE:
${phaseGuidance}

FOLLOW-UP BEHAVIOR: Always listen for story sparks in the person's answer. If they mention a person, place, event, or emotion in passing, follow up on it before moving on. For example:
- If they say "We moved when I was young" → ask "What do you remember about the day you left?"
- If they mention someone who died → ask gently about that person first
- If they describe a feeling without explaining it → ask what caused it
- If they hint at a difficult relationship → gently name it: "It sounds like things were complicated with [person] — what happened there?"
- If they gloss over a painful period → slow down: "You moved past that quickly — was that time harder than it sounds?"
- If they mention a regret, failure, or loss in passing → don't let it go: "You mentioned [thing] — I'd like to hear more about that if you're willing."

PROBING DIFFICULT TERRITORY: The most meaningful life stories include hardship, conflict, and pain — not just highlights. When appropriate, gently probe:
- Relationships that ended badly or were never repaired
- Times they felt like a failure as a parent, spouse, or friend
- Losses — people, opportunities, versions of themselves — they still carry
- Conflicts they never resolved and still think about
- Periods of depression, addiction, grief, or feeling completely lost
- Mistakes they made that affected people they loved
Be compassionate and never clinical. Frame these as: "It takes courage to talk about this" and "Only share what you're comfortable with." But do not avoid the territory.

Profile context: ${profileContext || "No prior profile information."}${avoidBlock}

CRITICAL RULES:
- Ask only ONE focused question per response
- Never list multiple questions
- Be genuinely curious, not clinical
- Respond first with a brief warm acknowledgment of what they shared (1-2 sentences), THEN ask your question
- Keep total response under 100 words
- NEVER repeat any phrase, sentence, or closing line you have already used earlier in this conversation — scan what you have already said and use entirely fresh language every time
- NEVER use a catchphrase, tagline, or sign-off more than once per session — vary your tone and endings naturally
- ABSOLUTELY FORBIDDEN: Never use generic filler phrases like "tell me more about that", "what stands out most in your memory", "can you elaborate", or "say more about that" — always ask a SPECIFIC, concrete question that digs into a particular detail, person, place, feeling, or moment they mentioned`,
      },
      ...conversationHistory,
    ],
    max_tokens: 250,
    temperature: 0.85,
  });
  const FALLBACKS = [
    "That sounds like a pivotal moment — what was going through your mind at the time?",
    "Who was the most important person in that chapter of your life, and why?",
    "What's a specific detail from that time that you've never forgotten?",
    "How did that experience shape who you became?",
    "If you could go back to one day from that period, which would it be and why?",
    "What surprised you most about yourself during that season of life?",
    "What were you most afraid of back then, and did that fear ever come true?",
    "Who would be surprised to learn that story about you?",
  ];
  const text = response.choices[0].message.content?.trim();
  if (text) return text;
  // Pick a fallback that hasn't been asked yet
  const unused = FALLBACKS.filter(f => !askedQuestions.some(q => q.toLowerCase().includes(f.toLowerCase().slice(0, 30))));
  return unused.length > 0
    ? unused[Math.floor(Math.random() * unused.length)]
    : FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

/* ─── Extract Structured Memories from a Single Answer ───────────────── */
export interface ExtractedMemory {
  summary: string;
  emotionalTone: string;
  importantPeople: { name: string; relationship: string }[];
  importantPlaces: { name: string; type: string }[];
  approximateDates: { description: string; year?: number; period?: string }[];
  lifeEvent: string;
  lifeLesson: string;
  memorableQuotes: string[];
  followUpQuestions: string[];
  timelinePlacement: string;
  phase: PhaseId;
}

export async function extractMemoriesFromAnswer(
  question: string,
  answer: string,
  phase: PhaseId,
  existingContext: string
): Promise<ExtractedMemory> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a life story analyst. Extract structured memory data from interview Q&A pairs.
Return valid JSON with exactly these fields:
- summary: string (2-3 sentences capturing the essence of what was shared)
- emotionalTone: string (e.g., "nostalgic", "proud", "bittersweet", "joyful", "melancholy")
- importantPeople: array of {name: string, relationship: string}
- importantPlaces: array of {name: string, type: string} (e.g., type: "childhood home", "school", "workplace")
- approximateDates: array of {description: string, year?: number, period?: string}
- lifeEvent: string (single sentence describing the main event/topic)
- lifeLesson: string (the wisdom or insight, if any; empty string if none)
- memorableQuotes: array of strings (exact quotes from the answer that are powerful or memorable)
- followUpQuestions: array of 3 strings (the most interesting threads to pull on next)
- timelinePlacement: string (where this fits in their life arc, e.g., "Early childhood", "Late career", "Unknown")
- phase: string (the interview phase this belongs to: hook/character/journey/people/places/adventures/challenges/wisdom/legacy)`,
      },
      {
        role: "user",
        content: `Interview phase: ${phase}
Existing context: ${existingContext || "None yet."}

Question asked: "${question}"
Answer given: "${answer}"

Extract structured memory data from this exchange.`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
    temperature: 0.3,
  });
  const parsed = JSON.parse(response.choices[0].message.content || "{}");
  return { ...parsed, phase };
}

/* ─── Summarize Full Interview Session ───────────────────────────────── */
export async function summarizeInterview(
  messages: { role: string; content: string }[],
  interviewerName: string
): Promise<{
  title: string;
  summary: string;
  keyPeople: string[];
  keyPlaces: string[];
  keyEvents: string[];
  lifeLessons: string[];
  timelineDates: { year?: number; description: string }[];
  memorableQuotes: string[];
  suggestedFollowUps: string[];
}> {
  const transcript = messages
    .map((m) => `${m.role === "assistant" ? interviewerName : "Guest"}: ${m.content}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a life story analyst. Analyze a complete interview transcript and extract comprehensive structured data.
Return valid JSON with exactly these fields:
- title: string (evocative 5-10 word title for this interview session)
- summary: string (3-4 paragraph narrative summary of what was shared)
- keyPeople: array of strings (people mentioned with brief description)
- keyPlaces: array of strings (places mentioned with brief context)
- keyEvents: array of strings (significant life events mentioned)
- lifeLessons: array of strings (wisdom and lessons shared)
- timelineDates: array of {year?: number, description: string}
- memorableQuotes: array of strings (powerful direct quotes)
- suggestedFollowUps: array of 5 strings (most interesting threads not yet fully explored)`,
      },
      {
        role: "user",
        content: `Analyze this life story interview:\n\n${transcript}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
    temperature: 0.4,
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}

/* ─── Legacy: summarizeTranscript alias ──────────────────────────────── */
export async function summarizeTranscript(transcript: string): Promise<{
  summary: string;
  keyPeople: string[];
  keyPlaces: string[];
  keyEvents: string[];
  lifeLessons: string[];
  timelineDates: { year?: number; description: string }[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a life story analyst. Extract structured information from interview transcripts.
Return a JSON object with these fields:
- summary: 2-3 paragraph narrative summary
- keyPeople: array of people mentioned
- keyPlaces: array of places mentioned
- keyEvents: array of significant life events
- lifeLessons: array of wisdom/lessons shared
- timelineDates: array of {year, description} for dateable events`,
      },
      { role: "user", content: `Analyze this interview transcript:\n\n${transcript}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}

/* ─── Biography Generation ────────────────────────────────────────────── */
export type BiographyStyle =
  | "short"
  | "full"
  | "memoir"
  | "family-history"
  | "legacy-letter"
  | "celebration"
  | "obituary";

const BIOGRAPHY_STYLE_PROMPTS: Record<BiographyStyle, string> = {
  short: "Write a compelling 2-3 paragraph short biography. Focus on the most defining aspects of their life. Professional yet warm tone.",
  full: "Write a comprehensive full biography of 800-1200 words. Cover their life arc from childhood through their legacy. Narrative style, warm and respectful.",
  memoir: "Write a memoir-style chapter (600-900 words) in first person as if they are telling their own story. Vivid, literary, emotionally honest.",
  "family-history": "Write a family history summary (500-700 words) focusing on their role in the family, the family's origins, key relationships, and what they passed down.",
  "legacy-letter": "Write a legacy letter (400-600 words) as if from them to their loved ones and future generations. Heartfelt, personal, capturing their voice, values, and love.",
  celebration: "Write a celebration of life tribute (400-600 words) suitable for a memorial service. Uplifting, honoring their spirit, capturing joy and love.",
  obituary: "Write a respectful obituary (300-400 words) suitable for publication. Cover key life milestones, survivors, and legacy in a dignified, warm tone.",
};

export async function generateBiography(
  profileName: string,
  transcripts: string[],
  style: BiographyStyle = "full"
): Promise<string> {
  const combinedTranscripts = transcripts.join("\n\n---\n\n");
  const stylePrompt = BIOGRAPHY_STYLE_PROMPTS[style];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional biographer and writer. ${stylePrompt}
Write with warmth, dignity, and literary quality. Preserve the subject's voice and personality throughout.
Only use information actually present in the transcripts — do not invent facts.
Subject: ${profileName}`,
      },
      {
        role: "user",
        content: `Write a ${style} biography of ${profileName} based on these interview transcripts:\n\n${combinedTranscripts}`,
      },
    ],
    max_tokens: 2500,
    temperature: 0.75,
  });
  return response.choices[0].message.content || "";
}

/* ─── Re-Live Storyboard Generation ──────────────────────────────────── */

export type ReliveAgeStage =
  | "Child (ages 5-12)"
  | "Teenager (ages 13-17)"
  | "Young Adult (ages 18-29)"
  | "Adult (ages 30-45)"
  | "Middle Age (ages 46-60)"
  | "Elder (ages 61+)";

export type ReliveArtStyle =
  | "Illustrated Memoir"
  | "Graphic Novel"
  | "Historical Documentary"
  | "Warm Family Storybook"
  | "Cinematic Concept Art";

const ART_STYLE_DESCRIPTORS: Record<ReliveArtStyle, string> = {
  "Illustrated Memoir": "warm watercolor and ink illustration style, soft textures, muted earthy tones, literary memoir aesthetic, hand-crafted feel",
  "Graphic Novel": "bold graphic novel illustration style, strong lines, high contrast, dynamic panel compositions, comic art technique",
  "Historical Documentary": "detailed historical illustration style, sepia and warm gold tones, documentary realism, archival photograph aesthetic rendered as illustration",
  "Warm Family Storybook": "gentle children's storybook illustration style, warm pastel palette, soft rounded forms, cozy and inviting, heartwarming aesthetic",
  "Cinematic Concept Art": "professional cinematic concept art style, dramatic lighting, rich color palette, filmic composition, Hollywood storyboard aesthetic",
};

export interface ReliveCharacterProfile {
  description: string;
  estimatedAge: string;
  keyFeatures: string;
  clothingEra: string;
  emotionalPresence: string;
}

export async function analyzeReferenceImage(
  imageBase64: string
): Promise<ReliveCharacterProfile> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a character design analyst for an illustrated memoir storyboard. Analyze the reference photograph and extract a detailed character profile for use in AI image generation prompts.

Return JSON with these fields:
- description: 2-3 sentences describing the person's overall appearance, build, distinguishing features
- estimatedAge: estimated current age range visible in the photo
- keyFeatures: comma-separated list of the most distinctive visual features (face shape, hair color/texture, eye color if visible, skin tone, any notable features)
- clothingEra: general era/style of clothing visible, or "not visible"
- emotionalPresence: the emotional quality and personality conveyed by the person in the photo (e.g., "warm and gentle with kind eyes", "strong and determined expression")`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageBase64, detail: "high" },
          },
          {
            type: "text",
            text: "Analyze this reference photograph for use as a character guide in an illustrated memoir storyboard.",
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 600,
    temperature: 0.2,
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}

export interface ReliveStoryboardPlan {
  title: string;
  subtitle: string;
  panels: {
    number: number;
    title: string;
    scene: string;
    bullets: string[];
    timePeriod: string;
    characterAges?: string;
    emotionalTone: string;
  }[];
}

/* ─── Randomized Art Variation ────────────────────────────────────────── */
// Each generation picks a random treatment so every storyboard feels unique.
// As AI image models improve, these treatments will naturally improve too.

const REALISM_LEVELS = [
  "realistic illustration with painterly detail",
  "semi-realistic illustrated style",
  "stylized illustrated art, slightly abstracted",
  "expressive stylized illustration",
  "bold graphic illustration with strong shapes",
  "loose expressive caricature-influenced illustration",
];

const COLOR_TREATMENTS = [
  "rich full color with warm golden tones",
  "muted earthy palette with selective color accents",
  "high contrast with deep shadows and bright highlights",
  "warm sepia and amber tones throughout",
  "cool blue and grey tones with warm accent colors",
  "vibrant saturated colors, almost storybook-bright",
  "faded vintage palette as if aged by time",
  "duotone treatment with two complementary colors",
];

const LINE_TREATMENTS = [
  "detailed fine linework",
  "bold confident outlines",
  "loose sketchy linework with visible texture",
  "painterly with soft edges and no hard outlines",
  "inked comic-book style lines",
  "watercolor wash with minimal linework",
];

export function getRandomArtVariation(): { realism: string; color: string; line: string; seed: number } {
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    realism: pick(REALISM_LEVELS),
    color: pick(COLOR_TREATMENTS),
    line: pick(LINE_TREATMENTS),
    seed: Math.floor(Math.random() * 99999),
  };
}

export async function planReliveStoryboard(
  storyContent: string,
  subjectName: string,
  ageStage: ReliveAgeStage,
  panelCount: 12 | 14 | 16
): Promise<ReliveStoryboardPlan> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a documentary storyboard writer creating an illustrated memoir storyboard.

Given a life story, break it into exactly ${panelCount} visual scenes with a clear arc: opening → context → key relationships → challenges and difficult moments → turning points → wisdom → legacy/closing. Do not sanitize the story — include the hard parts, conflicts, and struggles alongside the joyful moments.

Return JSON with:
- title: evocative 3-6 word storyboard title (ALL CAPS)
- subtitle: 2-4 word tagline or life description
- panels: array of exactly ${panelCount} objects, each with:
  - number: panel number (1-${panelCount})
  - title: 2-4 word panel title in ALL CAPS
  - scene: 1-2 sentence vivid visual scene description for the illustrator — describe what the camera sees, who is in frame, their body language, the setting
  - bullets: array of exactly 3 narrative captions. Each bullet must read like a sentence from a middle-school story book: present tense, vivid, human, 8-14 words. Examples: "She holds the letter and doesn't open it for three days." / "The kitchen smells like coffee and something about to break." / "He says goodbye at the door, not knowing it's the last time."
  - timePeriod: specific time period or age (e.g., "Age 8 — 1952", "Summer 1978", "Early 30s")
  - characterAges: brief description of who appears in this panel and their approximate ages (e.g., "Subject: age 12. Mother: age 38. Grandmother: age 65.")
  - emotionalTone: single evocative phrase (e.g., "quietly hopeful", "grief held tight", "joy breaking through")`,
      },
      {
        role: "user",
        content: `Create a ${panelCount}-panel illustrated memoir storyboard for ${subjectName || "the subject"} (depicted as ${ageStage}) based on this life story:\n\n${storyContent}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 3500,
    temperature: 0.7,
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}

/** Free tier: one composite image — illustrations only, text overlaid by sharp */
export async function generateReliveImage(
  storyboardPlan: ReliveStoryboardPlan,
  character: ReliveCharacterProfile | null,
  subjectName: string,
  ageStage: ReliveAgeStage,
  artStyle: ReliveArtStyle,
  panelCount: 12 | 14 | 16
): Promise<string> {
  const styleDesc = ART_STYLE_DESCRIPTORS[artStyle];
  const variation = getRandomArtVariation();
  const cols = 4;
  const rows = Math.ceil(panelCount / cols);

  const characterDesc = character
    ? `Main character: ${subjectName || "the subject"} as a ${ageStage}. Physical features: ${character.keyFeatures}. Emotional quality: ${character.emotionalPresence}. When depicted at younger ages in earlier panels, show them as they would have appeared younger — same core features, younger face and body.`
    : `Main character: ${subjectName || "the subject"} as a ${ageStage}. Show them younger in early-life panels.`;

  const scenes = storyboardPlan.panels.map((p) =>
    `Panel ${p.number} (${p.timePeriod}${p.characterAges ? ` · ${p.characterAges}` : ""}): ${p.scene}`
  ).join("\n");

  const prompt = `Create a ${cols}×${rows} grid of ${panelCount} illustrated memoir panels.

CRITICAL — NO TEXT anywhere: ABSOLUTELY NO WORDS, LETTERS, NUMBERS, SIGNS, CAPTIONS in the image. Pure illustration only. Clean panel borders only.

BASE STYLE: ${styleDesc}
RENDERING: ${variation.realism}
COLOR: ${variation.color}
LINE QUALITY: ${variation.line}

CHARACTER CONSISTENCY: ${characterDesc} All supporting characters (parents, siblings, partners, friends) depicted at their accurate age for each scene's time period. A mother in 1950 should look like a young woman; the same character in 1985 should look decades older.

Scenes (row by row, left to right):
${scenes}

Each panel tells its story through body language, environment, and expression alone — no text needed. Emotionally honest — include the tender moments AND the difficult ones with equal craft.`;

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1536x1024",
    quality: "high",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from gpt-image-1");
  return b64;
}

/** Premium tier: generate one high-quality image for a single panel */
export async function generatePanelImage(
  panel: ReliveStoryboardPlan["panels"][number],
  character: ReliveCharacterProfile | null,
  subjectName: string,
  ageStage: ReliveAgeStage,
  artStyle: ReliveArtStyle
): Promise<string> {
  const styleDesc = ART_STYLE_DESCRIPTORS[artStyle];

  const characterDesc = character
    ? `The main character is ${subjectName || "the subject"} as a ${ageStage}. Physical description: ${character.description}. Key distinguishing features: ${character.keyFeatures}. Emotional presence: ${character.emotionalPresence}. Age-interpret as a ${ageStage} — illustrated interpretation, not photorealistic replica.`
    : `The main character is ${subjectName || "the subject"} as a ${ageStage}.`;

  const prompt = `Single illustrated memoir panel in ${styleDesc}.

CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS of any kind anywhere in the image. Pure illustration only.

Character: ${characterDesc}
Scene: ${panel.scene}
Time period: ${panel.timePeriod}
Emotional tone: ${panel.emotionalTone}
Story moment: ${panel.title}

Style: ${styleDesc}. Non-photorealistic. Cinematic composition. Professional quality for a family memoir book. Rich detail, warm dignified lighting. Fill the entire frame with the illustrated scene.

CRITICAL — AUTHENTIC EMOTION: The character's facial expression and body language must match the emotional tone of this specific scene exactly. Do NOT default to smiling or a neutral pleasant face. Show the true emotion the scene demands — terror during danger, grief during loss, fierce determination during struggle, exhaustion after hardship, relief after rescue, joy only when the moment explicitly calls for it. Let the eyes, posture, and expression tell the story.`;

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "high",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image for panel "${panel.title}"`);
  return b64;
}

/* ─── Ask Me Anything ─────────────────────────────────────────────────── */
export async function answerQuestion(
  question: string,
  transcripts: string[],
  profileName: string
): Promise<string> {
  const context = transcripts.join("\n\n---\n\n");
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant helping family members learn about ${profileName}'s life.
CRITICAL RULES:
- Only answer based on what is explicitly stated in the interview transcripts provided
- If the answer is not in the transcripts, say clearly: "This topic hasn't been covered in the interviews yet."
- Never invent, guess, or extrapolate facts not in the transcripts
- When answering, cite the specific story or context from the interviews
- Be warm and conversational, as if sharing a story with family`,
      },
      {
        role: "user",
        content: `Based only on these interview transcripts, answer the following question about ${profileName}:

Question: "${question}"

Transcripts:
${context}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.5,
  });
  return response.choices[0].message.content || "";
}
