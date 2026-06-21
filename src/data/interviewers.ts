export interface Interviewer {
  id: string;
  name: string;
  title: string;
  age: number;
  ethnicity: string;
  expertise: string[];
  style: string[];
  focusAreas: string[];
  bestFor: string;
  quote: string;
  openingQuestion: string;
  accentColor: string;
  // Portrait palette
  skinTone: string;
  hairColor: string;
  hairStyle: "short-receding" | "straight-medium" | "medium-wavy" | "short-neat" | "casual-tousled";
  clothingColor: string;
  hasGlasses: boolean;
  gender: "male" | "female";
  /** OpenAI TTS voice to use for this interviewer */
  voiceName: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

export const INTERVIEWERS: Interviewer[] = [
  {
    id: "dr_james_carter",
    name: "Dr. James Carter",
    title: "Senior Historian & Legacy Interviewer",
    age: 65,
    ethnicity: "African American",
    expertise: ["History", "Life Lessons", "Legacy & Wisdom"],
    style: ["Thoughtful", "Wise", "Reflective"],
    focusAreas: ["Life Lessons", "Historical Perspective", "Values", "Defining Moments"],
    bestFor: "Deep reflections, legacy, life wisdom, historical context",
    quote: "Every life leaves a legacy. Let's make sure yours is remembered.",
    openingQuestion: "When you look back on your life, what single moment do you believe defined who you became — and why does it still feel so important?",
    accentColor: "#8a5021",
    skinTone: "#3a1e0a",
    hairColor: "#b8b8b0",
    hairStyle: "short-receding",
    clothingColor: "#1a2448",
    hasGlasses: true,
    gender: "male",
    voiceName: "onyx",   // deep, authoritative male — closest to a baritone
  },
  {
    id: "professor_mei_lin",
    name: "Professor Mei Lin",
    title: "Memory & Family History Specialist",
    age: 53,
    ethnicity: "Asian",
    expertise: ["Family History", "Cultural Heritage", "Personal Narratives"],
    style: ["Curious", "Insightful", "Compassionate"],
    focusAreas: ["Family Stories", "Heritage", "Childhood Memories", "Generational Connections"],
    bestFor: "Exploring family history, relationships & meaningful life moments",
    quote: "Your story connects generations. Let's uncover it together.",
    openingQuestion: "Tell me about your earliest memory — not necessarily the oldest, but the one that still feels the most vivid and alive inside you. Where are you, and what do you feel?",
    accentColor: "#6e5518",
    skinTone: "#c4956a",
    hairColor: "#111010",
    hairStyle: "straight-medium",
    clothingColor: "#2a2a30",
    hasGlasses: true,
    gender: "female",
    voiceName: "nova",   // warm, expressive female — softest/most empathetic
  },
  {
    id: "sarah_bennett",
    name: "Sarah Bennett",
    title: "Career & Family Story Interviewer",
    age: 48,
    ethnicity: "Caucasian",
    expertise: ["Career Journeys", "Leadership", "Family & Life Transitions"],
    style: ["Structured", "Supportive", "Professional"],
    focusAreas: ["Career Path", "Major Decisions", "Work Achievements", "Balancing Life & Family"],
    bestFor: "Career stories, major life transitions, accomplishments",
    quote: "Every chapter of your life has purpose. Let's capture it.",
    openingQuestion: "What was the most pivotal professional decision you ever made — the one where you felt the weight of it in your chest — and how did it turn out?",
    accentColor: "#7a4a20",
    skinTone: "#d4a87c",
    hairColor: "#5a3018",
    hairStyle: "medium-wavy",
    clothingColor: "#1c1c1c",
    hasGlasses: false,
    gender: "female",
    voiceName: "shimmer",   // bright, clear, professional female
  },
  {
    id: "miguel_alvarez",
    name: "Miguel Alvarez",
    title: "Relationships & Life Experiences Interviewer",
    age: 43,
    ethnicity: "Latino",
    expertise: ["Relationships", "Personal Experiences", "Emotions"],
    style: ["Engaging", "Warm", "Conversational"],
    focusAreas: ["Relationships", "Challenges", "Adventures", "Turning Points", "Personal Growth"],
    bestFor: "Personal stories, relationships, challenges & life experiences",
    quote: "The best stories come from the heart. Let's talk.",
    openingQuestion: "Tell me about a person who changed the direction of your life — someone who, if you'd never met them, you'd be a completely different person today.",
    accentColor: "#8a5a18",
    skinTone: "#a06830",
    hairColor: "#080606",
    hairStyle: "short-neat",
    clothingColor: "#181814",
    hasGlasses: false,
    gender: "male",
    voiceName: "fable",   // warm, storytelling male — conversational and engaging
  },
  {
    id: "jordan_brooks",
    name: "Jordan Brooks",
    title: "Modern Storytelling Interviewer",
    age: 27,
    ethnicity: "Mixed",
    expertise: ["Modern Storytelling", "Digital Legacy", "Creativity"],
    style: ["Energetic", "Creative", "Tech-Savvy"],
    focusAreas: ["Modern Life", "Passions", "Technology", "Future Legacy", "Personal Brand"],
    bestFor: "Younger generations, modern stories, creative expression",
    quote: "Your story. Your way. Let's make it amazing.",
    openingQuestion: "If your life so far were a film, what would the opening scene look like? Set the stage — where are you, how old are you, and what is happening that tells us everything about you?",
    accentColor: "#6b4a14",
    skinTone: "#c09060",
    hairColor: "#1a0e04",
    hairStyle: "medium-wavy",
    clothingColor: "#141414",
    hasGlasses: false,
    gender: "female",
    voiceName: "shimmer",  // bright, energetic female — modern and creative
  },
];

export const MENU_BOARD_SECTIONS = [
  {
    column: "left",
    items: [
      { icon: "⌂", label: "Dashboard", description: "Your story at a glance", href: "/dashboard" },
      { icon: "◎", label: "Interview Center", description: "Start or continue AI conversations", href: "/interview" },
      { icon: "◷", label: "Timeline", description: "Explore your life events", href: "/timeline" },
      { icon: "◉", label: "People", description: "Family, friends & important people", href: "/people" },
    ],
  },
  {
    column: "center-left",
    items: [
      { icon: "◈", label: "Places", description: "Where you've lived, traveled & explored", href: "/places" },
      { icon: "◆", label: "Life Lessons", description: "Wisdom, values & lessons learned", href: "/lessons" },
      { icon: "▣", label: "Media Library", description: "Photos, videos, audio & documents", href: "/media" },
    ],
  },
  {
    column: "center-right",
    items: [
      { icon: "◎", label: "Biography Generator", description: "Create beautiful stories & memories", href: "/biography" },
      { icon: "◈", label: "Legacy Documents", description: "Letters, tributes & important wishes", href: "/legacy" },
      { icon: "◉", label: "Ask Me Anything", description: "Ask questions about your story", href: "/ask" },
    ],
  },
  {
    column: "right",
    items: [
      { icon: "◆", label: "Family Vault", description: "Private sharing with family", href: "/vault" },
      { icon: "⚑", label: "Notifications", description: "Updates & reminders", href: "/notifications" },
      { icon: "◧", label: "Settings", description: "Customize your experience", href: "/settings" },
    ],
  },
];
