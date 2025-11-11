import { GoalPreset, GoalType, SectionConfig } from '../types';

export const API_URL = '/api';
export const LOCAL_STORAGE_KEY = 'affteContentGenieilia_savedContent_v2';

export const goalPresets: Record<GoalType, GoalPreset> = {
  'Awareness': {
    toneAndStyle: 'Trendy / Gen-Z',
    format: 'Lifestyle B-roll',
    audienceBuyerType: 'Early Adopters, Trend Seekers',
    contentIntent: 'Showcase a cool new find, generate buzz.',
    narrativeStyle: 'Excited, energetic, first-person discovery.',
    callToActionStyle: 'Encourage sharing, comments, and saves.'
  },
  'Engagement': {
    toneAndStyle: 'Fun / Casual',
    format: 'Problem–Solution',
    audienceBuyerType: 'People seeking solutions, Community members',
    contentIntent: 'Start a conversation, solve a common problem.',
    narrativeStyle: 'Relatable, conversational, "we" focused.',
    callToActionStyle: 'Ask a question, invite users to share their experience.'
  },
  'Conversion': {
    toneAndStyle: 'Trustworthy & Direct',
    format: 'Tutorial / Demo',
    audienceBuyerType: 'Ready-to-buy shoppers, Comparison shoppers',
    contentIntent: 'Highlight value, benefits, and create urgency.',
    narrativeStyle: 'Authoritative, benefits-focused, clear.',
    callToActionStyle: 'Direct call to action (e.g., "Link in bio!", "Shop now").'
  },
  'Review / Testimonial': {
    toneAndStyle: 'Friendly & Informative',
    format: 'Storytelling / Review',
    audienceBuyerType: 'Curious Shoppers or People looking for practical solutions',
    contentIntent: 'Provide a genuine recommendation and build trust.',
    narrativeStyle: 'First-person experience, authentic and honest.',
    callToActionStyle: 'Soft suggestion (e.g., "Check it out if you\'re curious").'
  },
  'Educational': {
    toneAndStyle: 'Friendly & Informative',
    format: 'Tutorial / Demo',
    audienceBuyerType: 'Learners, DIY enthusiasts, Problem-solvers',
    contentIntent: 'Teach something useful, demonstrate expertise.',
    narrativeStyle: 'Clear, step-by-step, teacher-like.',
    callToActionStyle: 'Suggest trying it out, ask for questions in comments.'
  }
};

export const initialAdvancedInputs = {
  category: '',
  audienceGender: 'Unisex',
  audienceAge: '20s',
  platform: 'TikTok',
  goal: 'Awareness',
  videoLength: '20 sec',
  language: 'Mixed (Eng + BM)',
  ...(goalPresets['Awareness'])
};

export const sectionsConfigVideo: SectionConfig[] = [
  { key: 'title', title: 'Title', icon: '🎬' },
  { key: 'script', title: 'Voiceover Script', icon: '📜' },
  { key: 'caption', title: 'Caption', icon: '📝' },
  { key: 'hashtags', title: 'Hashtags', icon: '🔖' },
  { key: 'idea', title: 'Video Idea', icon: '💡' },
  { key: 'broll', title: 'B-roll Suggestions', icon: '🎥' },
];

export const sectionsConfigPost: SectionConfig[] = [
  { key: 'body', title: 'Post Body', icon: '📄' },
  { key: 'imagePrompt', title: 'Image Prompt', icon: '🖼️' },
  { key: 'hook', title: 'Hook', icon: '✍️' },
  { key: 'hashtags', title: 'Hashtags', icon: '🔖' },
  { key: 'cta', title: 'Call to Action', icon: '🔗' },
];
