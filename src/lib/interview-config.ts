/**
 * Interview framework types and configuration.
 * Safe to import on the client — no OpenAI SDK dependency.
 */

export const INTERVIEW_PHASES = [
  { id: "hook",       name: "Story Hook",         description: "Open with emotionally resonant, cinematic questions", questionCount: 3 },
  { id: "character",  name: "Character Building",  description: "Personality, values, fears, strengths, and motivations", questionCount: 4 },
  { id: "journey",    name: "Life Journey",        description: "Childhood through career, family and legacy", questionCount: 6 },
  { id: "people",     name: "People Who Mattered", description: "Family, friends, mentors, and important influences", questionCount: 5 },
  { id: "places",     name: "Places",              description: "Homes, neighborhoods, schools, travel, and meaningful places", questionCount: 4 },
  { id: "adventures", name: "Adventures",          description: "Funniest, scariest, most beautiful, and most meaningful experiences", questionCount: 4 },
  { id: "challenges", name: "Challenges",          description: "Hardship, loss, failure, recovery, and resilience", questionCount: 4 },
  { id: "wisdom",     name: "Wisdom",              description: "Advice, values, principles, beliefs, and lessons", questionCount: 4 },
  { id: "legacy",     name: "Legacy",              description: "How they want to be remembered and what future generations should know", questionCount: 3 },
] as const;

export type PhaseId = typeof INTERVIEW_PHASES[number]["id"];
