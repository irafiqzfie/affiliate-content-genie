export interface ParsedContent {
  title?: string[];
  script?: string[];
  caption?: string[];
  hashtags?: string[];
  idea?: string[];
  broll?: string[];
  hook?: string[];
  body?: string[];
  cta?: string[];
  imagePrompt?: string[];
}

export interface SavedItem {
  id: number;
  title: string;
  productLink: string | null;
  video: string;
  post: string;
  createdAt?: string;
}

export interface ShopeeProductInfo {
  title: string;
  price: string;
  image: string;
  description: string;
}

export interface ScheduledPost {
  id: number;
  platform: 'Facebook' | 'Threads';
  scheduledTime: string; // ISO string
  imageUrl: string | null;
  caption: string;
  affiliateLink?: string;
  status: 'Scheduled' | 'Posted';
  createdAt?: string;
}

export interface AdvancedInputs {
  category: string;
  audienceGender: string;
  audienceAge: string;
  platform: string;
  goal: string;
  videoLength: string;
  language: string;
  toneAndStyle?: string;
  format?: string;
  audienceBuyerType?: string;
  contentIntent?: string;
  narrativeStyle?: string;
  callToActionStyle?: string;
}

export interface SectionConfig {
  key: string;
  title: string;
  icon: string;
}

export interface GoalPreset {
  toneAndStyle: string;
  format: string;
  audienceBuyerType: string;
  contentIntent: string;
  narrativeStyle: string;
  callToActionStyle: string;
}

export type GoalType = 'Awareness' | 'Engagement' | 'Conversion' | 'Review / Testimonial' | 'Educational';

export interface VideoLoadingState {
  status: string | false;
  message: string;
}
