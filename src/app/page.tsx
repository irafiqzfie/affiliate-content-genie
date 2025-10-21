
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import AuthButton from './components/AuthButton';
import BodyAttrDebugger from './components/BodyAttrDebugger';

const API_URL = '/api';
const LOCAL_STORAGE_KEY = 'affteContentGenieilia_savedContent_v2';

interface ParsedContent {
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

interface SavedItem {
  id: number;
  title: string;
  productLink: string;
  content: {
    video: string;
    post: string;
  };
}

interface ScheduledPost {
  id: number;
  platform: 'Facebook' | 'Threads';
  scheduledTime: string; // ISO string
  imageUrl: string;
  caption: string;
  status: 'Scheduled';
}


const RichTextEditor = ({ value, onChange, onSave, onCancel }: { value: string, onChange: (value: string) => void, onSave: () => void, onCancel: () => void }) => {
    const [activeFormats, setActiveFormats] = useState(new Set());
    const editorRef = useRef<HTMLDivElement>(null);

    const updateToolbarState = useCallback(() => {
        const newFormats = new Set<string>();
        if (document.queryCommandState('bold')) newFormats.add('bold');
        if (document.queryCommandState('italic')) newFormats.add('italic');
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            let node = selection.getRangeAt(0).startContainer;
            while (node && node.parentNode) {
                if (node.nodeName === 'LI' || node.nodeName === 'UL') {
                    newFormats.add('ul');
                    break;
                }
                if (node === editorRef.current) break;
                node = node.parentNode;
            }
        }
        setActiveFormats(newFormats);
    }, []);

    const applyFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
        updateToolbarState();
    };

    useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            const handleSelectionChange = () => {
                updateToolbarState();
            };
            document.addEventListener('selectionchange', handleSelectionChange);
            return () => {
                document.removeEventListener('selectionchange', handleSelectionChange);
            };
        }
    }, [updateToolbarState]);

    useEffect(() => {
        editorRef.current?.focus();
    }, []);

    return (
        <div className="edit-area">
            <div className="rte-toolbar">
                <button type="button" onClick={() => applyFormat('bold')} className={`rte-button ${activeFormats.has('bold') ? 'active' : ''}`} aria-pressed={activeFormats.has('bold')} aria-label="Bold"><b>B</b></button>
                <button type="button" onClick={() => applyFormat('italic')} className={`rte-button ${activeFormats.has('italic') ? 'active' : ''}`} aria-pressed={activeFormats.has('italic')} aria-label="Italic"><i>I</i></button>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} className={`rte-button ${activeFormats.has('ul') ? 'active' : ''}`} aria-pressed={activeFormats.has('ul')} aria-label="Bulleted List">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    </svg>
                </button>
            </div>
            <div
                ref={editorRef}
                className="editable-div"
                contentEditable
                dangerouslySetInnerHTML={{ __html: value }}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onKeyUp={updateToolbarState}
                onFocus={updateToolbarState}
            />
             <div className="edit-actions">
                <button onClick={onCancel} className="cancel-edit-button">Cancel</button>
                <button onClick={onSave} className="save-edit-button">Save</button>
            </div>
        </div>
    );
};

const goalPresets = {
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


const initialAdvancedInputs = {
    category: '',
    audienceGender: 'Unisex',
    audienceAge: '20s',
    platform: 'TikTok',
    goal: 'Awareness',
    videoLength: '20 sec',
    language: 'Mixed (Eng + BM)',
    ...(goalPresets['Awareness'])
};

const sectionsConfigVideo = [
    { key: 'title', title: 'Title', icon: '🎬' },
    { key: 'script', title: 'Voiceover Script', icon: '📜' },
    { key: 'caption', title: 'Caption', icon: '📝' },
    { key: 'hashtags', title: 'Hashtags', icon: '🔖' },
    { key: 'idea', title: 'Video Idea', icon: '💡' },
    { key: 'broll', title: 'B-roll Suggestions', icon: '🎥' },
];

const sectionsConfigPost = [
    { key: 'hook', title: 'Hook', icon: '✍️' },
    { key: 'body', title: 'Post Body', icon: '📄' },
    { key: 'cta', title: 'Call to Action', icon: '🔗' },
    { key: 'hashtags', title: 'Hashtags', icon: '🔖' },
    { key: 'imagePrompt', title: 'Image Prompt', icon: '🖼️' },
];


export default function Home() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [productLink, setProductLink] = useState('');
  const [advancedInputs, setAdvancedInputs] = useState(initialAdvancedInputs);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{ video: string | null, post: string | null }>({ video: null, post: null });
  const [editableContent, setEditableContent] = useState<{ video: ParsedContent | null, post: ParsedContent | null }>({ video: null, post: null });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string | null>>({});
  const [videoLoadingStates, setVideoLoadingStates] = useState<Record<string, { status: string | false; message: string; }>>({});
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, string | null>>({});
  const [savedList, setSavedList] = useState<SavedItem[]>([]);
  const [selectedOptionIndexes, setSelectedOptionIndexes] = useState<Record<string, number>>({});
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  const [savedSortOrder, setSavedSortOrder] = useState('newest');
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('generator');
  const [activeOutputTab, setActiveOutputTab] = useState<'video' | 'post'>('video');
  const [trendscore, setTrendscore] = useState<number | null>(null);
  const [productSummary, setProductSummary] = useState<string | null>(null);
  const [productFeatures, setProductFeatures] = useState<string[] | null>(null);
  const [affiliatePotential, setAffiliatePotential] = useState<string | null>(null);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [schedulingPlatform, setSchedulingPlatform] = useState<'Facebook' | 'Threads' | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const sectionsConfig = useMemo(() => activeOutputTab === 'video' ? sectionsConfigVideo : sectionsConfigPost, [activeOutputTab]);

    // Helper to safely extract a message from an unknown error without using `any`.
    const extractErrorMessage = (err: unknown): string | null => {
        if (typeof err === 'object' && err !== null && 'message' in err) {
            const maybeMsg = (err as { message: unknown }).message;
            if (typeof maybeMsg === 'string') return maybeMsg;
        }
        return null;
    };

  const initializeOptionIndexes = useCallback(() => {
    const videoIndexes = sectionsConfigVideo.reduce((acc, sec) => ({ ...acc, [sec.key]: 0 }), {});
    const postIndexes = sectionsConfigPost.reduce((acc, sec) => ({ ...acc, [sec.key]: 0 }), {});
    setSelectedOptionIndexes({ ...videoIndexes, ...postIndexes });
  }, []);

  const parseContent = useCallback((content: string): ParsedContent => {
    const parsed: ParsedContent = {};
    const keyMap: Record<string, keyof ParsedContent> = {
        '🎬 Title:': 'title',
        '📜 Voiceover Script:': 'script',
        '📝 Caption:': 'caption',
        '🔖 Hashtags:': 'hashtags',
        '💡 Video Idea:': 'idea',
        '🎥 B-roll Suggestions:': 'broll',
        '✍️ Hook:': 'hook',
        '📄 Post Body:': 'body',
        '🔗 Call to Action:': 'cta',
        '🖼️ Image Prompt:': 'imagePrompt',
    };

    const paddedContent = '\n' + content;
    const sectionHeaders = Object.keys(keyMap).map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`\\n(${sectionHeaders})`, 'g');
    const matches = [...paddedContent.matchAll(regex)];
    
    if (matches.length === 0 && content.trim()) {
        return {};
    }

    matches.forEach((match, index) => {
        const header = match[1];
        const key = keyMap[header];
        const start = match.index! + match[0].length;
        const end = index + 1 < matches.length ? matches[index + 1].index : paddedContent.length;
        
        const sectionContent = paddedContent.substring(start, end).trim();

        if (sectionContent) {
            const options = sectionContent
                .split(/\n?\d+\.\s?/)
                .map(opt => opt.trim())
                .filter(Boolean);
            if (key) {
                parsed[key] = options;
            }
        }
    });

    return parsed;
  }, []);
  
  const reconstructContent = (content: ParsedContent | null, type: 'video' | 'post'): string => {
    if (!content) return '';
    const keyMap: Record<string, string> = {
        title: '🎬 Title:',
        script: '📜 Voiceover Script:',
        caption: '📝 Caption:',
        hashtags: '🔖 Hashtags:',
        idea: '💡 Video Idea:',
        broll: '🎥 B-roll Suggestions:',
        hook: '✍️ Hook:',
        body: '📄 Post Body:',
        cta: '🔗 Call to Action:',
        imagePrompt: '🖼️ Image Prompt:',
    };
    
    const config = type === 'video' ? sectionsConfigVideo : sectionsConfigPost;
    let result = '';
    config.forEach(({ key }) => {
        const typedKey = key as keyof ParsedContent;
        const header = keyMap[typedKey];
        const items = content[typedKey];
        if (header && items && items.length > 0) {
            result += `${header}\n`;
            items.forEach((item, index) => {
                result += `${index + 1}. ${item}\n`;
            });
            result += `\n`;
        }
    });

    return result.trim();
  };


  useEffect(() => {
    const loadInitialData = async () => {
        setIsInitialLoading(true);
        try {
            const [savedRes, scheduledRes] = await Promise.all([
                fetch(`${API_URL}/saved-items`),
                fetch(`${API_URL}/scheduled-posts`)
            ]);
            
            if (!savedRes.ok || !scheduledRes.ok) {
                 throw new Error('Failed to fetch initial data from server.');
            }

            const saved = await savedRes.json();
            const scheduled = await scheduledRes.json();
            
            setSavedList(Array.isArray(saved) ? saved.sort((a, b) => b.id - a.id) : []); 
            setScheduledPosts(Array.isArray(scheduled) ? scheduled.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()) : []);
        } catch (err) {
            console.error("Failed to load initial data", err);
            setError("Could not connect to the server to load your data. Please try again later.");
        } finally {
            setIsInitialLoading(false);
        }
    };
    
    loadInitialData();

    const savedContentRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedContentRaw) {
        try {
            const savedData = JSON.parse(savedContentRaw);
            if (savedData && typeof savedData === 'object' && ('video' in savedData || 'post' in savedData)) {
                const videoContent = savedData.video || '';
                const postContent = savedData.post || '';
                setGeneratedContent({ video: videoContent, post: postContent });
                setEditableContent({
                    video: parseContent(videoContent),
                    post: parseContent(postContent),
                });
                initializeOptionIndexes();
            } else {
                 localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        } catch {
            // If parsing fails or structure is wrong, clear the saved key.
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }
  }, [initializeOptionIndexes, parseContent]);

  useEffect(() => {
    initializeOptionIndexes();
  }, [initializeOptionIndexes]);

  const handleProductLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductLink(e.target.value);
    if (trendscore !== null || productSummary || affiliatePotential || productFeatures) {
        setTrendscore(null);
        setProductSummary(null);
        setProductFeatures(null);
        setAffiliatePotential(null);
    }
  };

  const handleAdvancedInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'goal') {
        const preset = goalPresets[value as keyof typeof goalPresets];
        setAdvancedInputs(prev => ({
            ...prev,
            goal: value,
            ...(preset || {})
        }));
    } else {
        setAdvancedInputs(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAnalyze = async () => {
    if (!productLink || isAnalyzing || isLoading) return;

    setIsAnalyzing(true);
    setError(null);
    setTrendscore(null);
    setProductSummary(null);
    setProductFeatures(null);
    setAffiliatePotential(null);

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productLink }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Analysis request failed' }));
            throw new Error(errorData.message);
        }

        const suggestions = await response.json();
        setAdvancedInputs(prev => ({
            ...prev,
            ...suggestions,
        }));
        setTrendscore(suggestions.trendscore);
        setProductSummary(suggestions.productSummary);
        setProductFeatures(suggestions.productFeatures);
        setAffiliatePotential(suggestions.affiliatePotential);
        setIsAnalysisCollapsed(false);

    } catch (err: unknown) {
        console.error('Analysis failed:', err);
    const message = extractErrorMessage(err);
    setError(message || 'Failed to analyze the product. Please fill details manually or try a different link.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productLink || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent({ video: null, post: null });
    setEditableContent({ video: null, post: null });
    setGeneratedImages({});
    setGeneratedVideos({});
    setVideoLoadingStates({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    try {
      const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productLink, advancedInputs }),
        });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Content generation request failed' }));
        throw new Error(errorData.message);
      }
      
      const data = await response.json();
      const content = data.content;
      
      const videoContentMatch = content.match(/---VIDEO START---([\s\S]*?)---VIDEO END---/);
      const postContentMatch = content.match(/---POST START---([\s\S]*?)---POST END---/);

      const videoContent = videoContentMatch ? videoContentMatch[1].trim() : '';
      const postContent = postContentMatch ? postContentMatch[1].trim() : '';
      
      const newGenerated = { video: videoContent, post: postContent };
      setGeneratedContent(newGenerated);
      setEditableContent({
          video: parseContent(videoContent),
          post: parseContent(postContent),
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGenerated));
      initializeOptionIndexes();

        } catch (err: unknown) {
            console.error(err);
            const message = extractErrorMessage(err);
            setError(message || 'Failed to generate content. Please check the link and try again.');
        } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateImage = useCallback(async (key: string, promptText: string) => {
    setImageLoadingStates(prev => ({ ...prev, [key]: true }));
    setError(null);
    try {
        const response = await fetch(`${API_URL}/visualize/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `A cinematic, high-quality visual for a short-form video based on this idea: ${promptText}` }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Image generation failed' }));
            throw new Error(errorData.message);
        }

        const { imageUrl } = await response.json();
        setGeneratedImages(prev => ({ ...prev, [key]: imageUrl }));

    } catch (err: unknown) {
        console.error('Image generation failed:', err);
    const message = extractErrorMessage(err);
    setError(message || 'Failed to generate image. Please try again.');
    } finally {
        setImageLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, []);
  
  const handleGenerateVideo = async (key: string, promptText: string) => {
    setVideoLoadingStates(prev => ({
        ...prev,
        [key]: { status: 'generating', message: '✅ Request sent! Waking up the video creation AI...' }
    }));
    setError(null);
    try {
        const startResponse = await fetch(`${API_URL}/visualize/video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `A short, cinematic, high-quality video clip for social media, based on this idea: ${promptText}` }),
        });

        if (!startResponse.ok) {
            const errorData = await startResponse.json().catch(() => ({ message: 'Failed to start video generation.'}));
            throw new Error(errorData.message);
        }

        const { operationId } = await startResponse.json();
        
        setVideoLoadingStates(prev => ({
            ...prev,
            [key]: { status: 'polling', message: 'Analyzing your prompt and preparing the scene...' }
        }));
        
        let pollCount = 0;
        const pollingMessages = [
            'Rendering initial frames... this is where the magic begins!',
            'Upscaling and adding final touches...',
            'Almost there! Compiling the final video.',
            'Still processing... High-quality video takes a moment!',
            'Thanks for your patience, the AI is working hard.'
        ];

        let isDone = false;
        while (!isDone) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const statusResponse = await fetch(`${API_URL}/visualize/video/status/${operationId}`);
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.done) {
                    isDone = true;
                    if (statusData.videoUrl) {
                        setGeneratedVideos(prev => ({ ...prev, [key]: statusData.videoUrl }));
                    } else {
                        throw new Error(statusData.error || 'Video generation completed, but no video URI was found.');
                    }
                }
            }

            const messageIndex = pollCount % pollingMessages.length;
            setVideoLoadingStates(prev => ({
                ...prev,
                [key]: { status: 'polling', message: pollingMessages[messageIndex] }
            }));
            pollCount++;
        }

    } catch (err: unknown) {
        console.error('Video generation failed:', err);
    const message = extractErrorMessage(err);
    setError(message || 'Failed to generate video. Please try again.');
    } finally {
        setVideoLoadingStates(prev => ({ ...prev, [key]: { status: false, message: '' } }));
    }
  };

  // Effect to automatically generate images for visualizable prompts
  useEffect(() => {
    const autoVisualize = (prompts: string[] | undefined, type: 'video' | 'post', sectionKey: string) => {
        if (!prompts) return;
        prompts.forEach((prompt, index) => {
            if (prompt) {
                const key = `${type}-${sectionKey}-${index}`;
                // Only generate if the image doesn't exist and isn't already loading.
                if (!generatedImages[key] && !imageLoadingStates[key]) {
                    handleGenerateImage(key, prompt);
                }
            }
        });
    };

    if (editableContent?.video) {
        autoVisualize(editableContent.video.idea, 'video', 'idea');
        autoVisualize(editableContent.video.broll, 'video', 'broll');
    }
    if (editableContent?.post) {
        autoVisualize(editableContent.post.imagePrompt, 'post', 'imagePrompt');
    }
  }, [editableContent, handleGenerateImage, generatedImages, imageLoadingStates]);

  const handleCopy = (key: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleOptionSelect = (key: string, index: number) => {
    setSelectedOptionIndexes(prev => ({ ...prev, [key]: index }));
    setEditingKey(null);
  };

  const stripHtml = (html: string): string => {
    if (typeof document === 'undefined') return html; // Guard for server-side
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html
        .replace(/<li>/gi, '\n- ')
        .replace(/<p>/gi, '\n')
        .replace(/<br>/gi, '\n');
    return tmp.textContent || tmp.innerText || "";
  };

  const formatContentForExport = () => {
    if (!editableContent) return '';
    let text = 'Affiliate Content Genie - Generated Content\n===========================================\n\n';
    const richTextFields = new Set(['body', 'caption']);
    
    const formatSection = (title: string, content: ParsedContent | null, config: {key: string, title: string}[]) => {
        let sectionText = `${title}\n-------------------------------------------\n\n`;
        let hasContent = false;
        config.forEach(({ key, title: itemTitle }) => {
            const items = content?.[key as keyof ParsedContent];
            if (items && items.length > 0) {
                hasContent = true;
                sectionText += `${itemTitle}\n`;
                let itemsToFormat = items;
                if (richTextFields.has(key)) {
                    itemsToFormat = items.map(option => stripHtml(option));
                }
                itemsToFormat.forEach((option, index) => {
                    sectionText += `${index + 1}. ${option.trim()}\n`;
                });
                sectionText += `\n`;
            }
        });
        return hasContent ? sectionText : '';
    }

    text += formatSection("VIDEO CONTENT", editableContent.video, sectionsConfigVideo);
    text += "\n";
    text += formatSection("POST CONTENT", editableContent.post, sectionsConfigPost);

    return text;
  };

  const handleDownloadTxt = () => {
    const content = formatContentForExport();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affiliate-content.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const content = formatContentForExport();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Affiliate Video Content',
          text: content,
        });
      } catch (error) {
        console.error('Error sharing content:', error);
      }
    }
  };

  const handleClear = () => {
    setGeneratedContent({ video: null, post: null });
    setEditableContent({ video: null, post: null });
    setEditingKey(null);
    setProductLink('');
    setAdvancedInputs(initialAdvancedInputs);
    setError(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setVideoLoadingStates({});
    setSelectedOptionIndexes({});
    setTrendscore(null);
    setProductSummary(null);
    setProductFeatures(null);
    setAffiliatePotential(null);
    setActiveOutputTab('video');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleSaveToList = async () => {
    if (!generatedContent.video && !generatedContent.post) return;
    const titleSource = editableContent.video?.title?.[0] || editableContent.post?.hook?.[0];
    const title = titleSource || `Saved Idea - ${new Date().toLocaleString()}`;

    const newItemPayload = {
      title,
      productLink,
      content: {
          video: generatedContent.video || '',
          post: generatedContent.post || '',
      },
    };

    try {
        const response = await fetch(`${API_URL}/saved-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItemPayload)
        });
        if (!response.ok) throw new Error('Failed to save item.');

        const savedItem = await response.json();
        setSavedList(prevList => [savedItem, ...prevList]);
        
    } catch (err) {
        console.error(err);
        setError('Could not save the item. Please try again.');
    }
  };

  const handleDeleteSavedItem = async (id: number) => {
    const originalList = [...savedList];
    const updatedList = savedList.filter(item => item.id !== id);
    setSavedList(updatedList);

    try {
        const response = await fetch(`${API_URL}/saved-items/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            setSavedList(originalList);
            throw new Error('Failed to delete item from server.');
        }
    } catch (err) {
        console.error(err);
        setError('Could not delete the item. Please try again.');
        setSavedList(originalList);
    }
  };

  const handleLoadSavedItem = (item: SavedItem) => {
    setProductLink(item.productLink);
    setGeneratedContent(item.content);
    setEditableContent({
        video: parseContent(item.content.video),
        post: parseContent(item.content.post),
    });
    setActiveOutputTab('video');
    setTrendscore(null);
    setProductSummary(null);
    setProductFeatures(null);
    setAffiliatePotential(null);
    initializeOptionIndexes();
    setCurrentPage('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleEdit = (optionKey: string, currentText: string) => {
    setEditingKey(optionKey);
    setEditText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditText('');
  };

  const handleSaveEdit = (sectionKey: string, index: number) => {
    if (!editableContent[activeOutputTab]) return;
    const newEditableContent = JSON.parse(JSON.stringify(editableContent));
    newEditableContent[activeOutputTab]![sectionKey as keyof ParsedContent]![index] = editText;
    setEditableContent(newEditableContent);

    const newMarkdown = reconstructContent(newEditableContent[activeOutputTab], activeOutputTab);
    const newGeneratedContent = {
        ...generatedContent,
        [activeOutputTab]: newMarkdown,
    };
    setGeneratedContent(newGeneratedContent);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGeneratedContent));

    setEditingKey(null);
    setEditText('');
  };

  const handleOpenSocialModal = () => {
    setSchedulingPlatform(null);
    setIsSocialModalOpen(true);
  };

  const handleCloseSocialModal = () => {
    setIsSocialModalOpen(false);
    setSchedulingPlatform(null);
  };

  const handleSchedulePost = async () => {
    if (!schedulingPlatform || !scheduleDate || !scheduleTime) {
        alert("Please select a date and time.");
        return;
    }

    const postContent = editableContent.post;
    const selectedImageIndex = selectedOptionIndexes['imagePrompt'] ?? 0;
    const imageKey = `post-imagePrompt-${selectedImageIndex}`;
    const imageUrl = generatedImages[imageKey];
    
    const selectedBodyIndex = selectedOptionIndexes['body'] ?? 0;
    const captionText = postContent?.body?.[selectedBodyIndex];

    if (!imageUrl || !captionText) {
        alert("A generated image and caption are required to schedule a post.");
        return;
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    const newPostPayload = {
        platform: schedulingPlatform,
        scheduledTime: scheduledDateTime,
        imageUrl: imageUrl,
        caption: stripHtml(captionText),
        status: 'Scheduled' as const,
    };

    try {
        const response = await fetch(`${API_URL}/scheduled-posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPostPayload)
        });
        if (!response.ok) throw new Error('Failed to schedule post.');

        const scheduledPost = await response.json();
        const updatedPosts = [...scheduledPosts, scheduledPost].sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
        setScheduledPosts(updatedPosts);
        
        handleCloseSocialModal();
    } catch (err) {
        console.error(err);
        setError('Could not schedule the post. Please try again.');
    }
  };
  
  const handleDeleteScheduledPost = async (id: number) => {
    if (window.confirm("Are you sure you want to cancel this scheduled post?")) {
        const originalPosts = [...scheduledPosts];
        const updatedPosts = scheduledPosts.filter(post => post.id !== id);
        setScheduledPosts(updatedPosts);

        try {
            const response = await fetch(`${API_URL}/scheduled-posts/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                setScheduledPosts(originalPosts);
                throw new Error('Failed to cancel scheduled post.');
            }
        } catch (err) {
            console.error(err);
            setError('Could not cancel the post. Please try again.');
            setScheduledPosts(originalPosts);
        }
    }
  };

  const processedSavedList = savedList
    .filter(item =>
        item.title.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
        item.productLink.toLowerCase().includes(savedSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
        if (savedSortOrder === 'newest') {
            return b.id - a.id;
        }
        return a.id - b.id; // oldest
    });

  const renderSocialModal = () => {
    if (!isSocialModalOpen) return null;

    const postContent = editableContent.post;
    const selectedImageIndex = selectedOptionIndexes['imagePrompt'] ?? 0;
    const selectedBodyIndex = selectedOptionIndexes['body'] ?? 0;
    
    const imageKey = `post-imagePrompt-${selectedImageIndex}`;
    const imageUrl = generatedImages[imageKey];
    const captionText = postContent?.body?.[selectedBodyIndex];
    
    const finalImageUrl = imageUrl;
    const finalCaption = captionText ? stripHtml(captionText) : "Generate content to create a post.";

    const handlePlatformSelect = (platform: 'Facebook' | 'Threads') => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        setScheduleDate(tomorrow.toISOString().split('T')[0]); // YYYY-MM-DD
        setScheduleTime('09:00');
        setSchedulingPlatform(platform);
    };

    return (
        <div className="modal-overlay" onClick={handleCloseSocialModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{schedulingPlatform ? `Schedule for ${schedulingPlatform}` : 'Schedule a Post'}</h3>
                    <button className="modal-close-button" onClick={handleCloseSocialModal} aria-label="Close modal">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="modal-preview">
                        <h4>Preview</h4>
                        {finalImageUrl ? (
                            <Image src={finalImageUrl} alt="Post preview" className="modal-preview-image" width={480} height={320} unoptimized />
                        ) : (
                            <div className="modal-preview-image-placeholder">No image generated</div>
                        )}
                        <p className="modal-preview-caption">{finalCaption}</p>
                    </div>

                    {schedulingPlatform && (
                        <div className="modal-scheduling-view">
                            <h4>Set Date & Time</h4>
                             <div className="schedule-form">
                                <div className="schedule-input-group">
                                    <label htmlFor="schedule-date">Date</label>
                                    <input id="schedule-date" className="schedule-input" type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                                </div>
                                <div className="schedule-input-group">
                                    <label htmlFor="schedule-time">Time</label>
                                    <input id="schedule-time" className="schedule-input" type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                     {!schedulingPlatform && !finalImageUrl && (
                        <div className="modal-info">
                            <p>Please generate content and an image for the &apos;Post&apos; format before scheduling.</p>
                        </div>
                     )}
                </div>
                <div className="modal-footer">
                    {schedulingPlatform ? (
                        <>
                            <button className="modal-footer-button secondary" onClick={() => setSchedulingPlatform(null)}>Back</button>
                            <button className="modal-footer-button primary" onClick={handleSchedulePost}>Confirm Schedule</button>
                        </>
                    ) : (
                        <>
                         <button className="social-platform-button facebook" onClick={() => handlePlatformSelect('Facebook')} disabled={!finalImageUrl}>Schedule on Facebook</button>
                         <button className="social-platform-button threads" onClick={() => handlePlatformSelect('Threads')} disabled={!finalImageUrl}>Schedule on Threads</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderGeneratorPage = () => {
    const visualizableKeys = new Set(
        activeOutputTab === 'video' 
        ? ['idea', 'broll'] 
        : ['imagePrompt']
    );

    const visualizableSections = sectionsConfig.filter(s => visualizableKeys.has(s.key));
    const nonVisualizableSections = sectionsConfig.filter(s => !visualizableKeys.has(s.key));

    const chunkedNonVisualizableSections = nonVisualizableSections
        .reduce((resultArray, item, index) => { 
            const chunkIndex = Math.floor(index / 2);
            if (!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = [];
            }
            if (item) {
                resultArray[chunkIndex].push(item);
            }
            return resultArray;
        }, [] as ({ key: string; title: string; icon: string; })[][]);

    const renderPromptCard = (section: {key: string; title: string; icon: string;}, isVisual = false) => {
        if (!section) return <div/>;
        
        const { key, title, icon } = section;
        const richTextFields = new Set(['body', 'caption']);
        const isRichText = richTextFields.has(key);
        const content = editableContent[activeOutputTab]?.[key as keyof ParsedContent];
        const selectedIndex = selectedOptionIndexes[key] ?? 0;
        const selectedOption = content?.[selectedIndex];
        const optionKey = `${activeOutputTab}-${key}-${selectedIndex}`;
        const isEditing = editingKey === optionKey;
        
        const textContentPanel = (
            <div className="card-content">
                {isLoading && !content && <div className="skeleton-loader"></div>}
                {!isLoading && (!content || content.length === 0) && <p className="placeholder-text">Content will appear here once generated.</p>}
                
                {content && content.length > 0 && selectedOption !== undefined && (
                    isEditing ? (
                        isRichText ? (
                            <RichTextEditor
                                value={editText}
                                onChange={setEditText}
                                onSave={() => handleSaveEdit(key, selectedIndex)}
                                onCancel={handleCancelEdit}
                            />
                        ) : (
                            <div className="edit-area">
                                <textarea
                                    className="editable-textarea"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                />
                                <div className="edit-actions">
                                    <button onClick={handleCancelEdit} className="cancel-edit-button">Cancel</button>
                                    <button onClick={() => handleSaveEdit(key, selectedIndex)} className="save-edit-button">Save</button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="option-display-area">
                            {isRichText ? (
                                <div className="prose" dangerouslySetInnerHTML={{ __html: selectedOption }} />
                            ) : (
                                <p>{selectedOption}</p>
                            )}
                            <div className="option-actions">
                                 <button 
                                    className="edit-button"
                                    onClick={() => handleEdit(optionKey, selectedOption)}
                                    aria-label="Edit this option"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                        <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                    </svg>
                                </button>
                                <button 
                                    className="copy-button" 
                                    onClick={(e) => { e.stopPropagation(); handleCopy(optionKey, isRichText ? stripHtml(selectedOption) : selectedOption); }}
                                    aria-label={`Copy option ${selectedIndex + 1}`}
                                >
                                    <svg fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5-.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                    </svg>
                                    <span className="copy-tooltip">{copiedStates[optionKey] ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        );

        const cardHeader = (
            <div className="card-header">
                <h3>{icon} {title}</h3>
                {content && content.length > 0 && (
                    <div className="option-selector">
                        {[0, 1, 2].map(index => (
                            <button
                                key={index}
                                className={`option-number ${selectedIndex === index ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleOptionSelect(key, index); }}
                                aria-label={`Select option ${index + 1}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );

        if (isVisual) {
            const isLoadingImage = imageLoadingStates[optionKey];
            const generatedImage = generatedImages[optionKey];
            const videoLoadingInfo = videoLoadingStates[optionKey];
            const generatedVideo = generatedVideos[optionKey];
            const hasContent = selectedOption && !isLoadingImage && !generatedImage && !videoLoadingInfo?.status && !generatedVideo;

            const visualizationPanel = (
                <div className="visualization-panel">
                    {isLoadingImage && (
                        <div className="image-loading-indicator">
                            <div className="spinner image-spinner"></div>
                            <span>Generating Image...</span>
                        </div>
                    )}
                            {generatedImage && (
                        <div className="image-result-container">
                            <Image
                                src={generatedImage}
                                alt={`Generated visual for ${title}, option ${selectedIndex + 1}`}
                                className="generated-image"
                                width={480}
                                height={270}
                                unoptimized
                                onError={() => { /* next/image doesn't expose event target easily; fallback link still provided */ }}
                            />
                            <div className="image-fallback" style={{ position: 'absolute', bottom: 8, left: 8, right: 48, color: 'var(--secondary-text-color)', fontSize: '0.8rem' }}>
                                <a href={generatedImage} target="_blank" rel="noreferrer">Open image in new tab</a>
                            </div>
                            <a href={generatedImage} download={`${optionKey}-visualization.jpg`} className="download-media-button" aria-label="Download Image">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                </svg>
                            </a>
                        </div>
                    )}
                    {videoLoadingInfo?.status && (
                        <div className="video-loading-indicator">
                            <div className="spinner video-spinner"></div>
                            <p>{videoLoadingInfo.message}</p>
                        </div>
                    )}
                    {generatedVideo && (
                        <div className="video-result-container">
                            <video src={generatedVideo} controls muted playsInline loop className="generated-video" />
                            <a href={generatedVideo} download={`${optionKey}-video.mp4`} className="download-media-button" aria-label="Download Video">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                </svg>
                            </a>
                        </div>
                    )}
                     {hasContent && (
                        <div className="visualization-actions">
                            <button 
                                className="visualize-button"
                                onClick={() => handleGenerateImage(optionKey, selectedOption)}
                                disabled={isLoadingImage || (activeOutputTab === 'video' && !!videoLoadingInfo?.status)}
                            >
                                {isLoadingImage ? 'Generating...' : '🎨 Visualize Image'}
                            </button>
                            {activeOutputTab === 'video' && (
                                 <button 
                                    className="generate-video-button"
                                    onClick={() => handleGenerateVideo(optionKey, selectedOption)}
                                    disabled={!!videoLoadingInfo?.status || isLoadingImage}
                                >
                                    {videoLoadingInfo?.status ? 'Creating Video...' : '🎬 Generate Video'}
                                </button>
                            )}
                        </div>
                     )}
                     {!selectedOption && (
                         <div className="visualization-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                            </svg>
                            <p>Visuals will appear here</p>
                         </div>
                     )}
                </div>
            );
            
            return (
                 <div className={`output-card section-${key} visual-card`}>
                    {cardHeader}
                    <div className="visual-card-body">
                        {textContentPanel}
                        {visualizationPanel}
                    </div>
                </div>
            );
        }

        return (
            <div className={`output-card section-${key}`}>
                {cardHeader}
                {textContentPanel}
            </div>
        )
    };

    return (
    <>
      <div className="form-card">
        <button className="accordion-header" onClick={() => setIsFormCollapsed(!isFormCollapsed)} aria-expanded={!isFormCollapsed}>
            <h3>Generation Settings</h3>
            <span className={`accordion-icon ${!isFormCollapsed ? 'open' : ''}`} aria-hidden="true"></span>
        </button>
        <div className={`accordion-content ${!isFormCollapsed ? 'open' : ''}`}>
            <div className="accordion-content-inner">
                <form className="input-form" onSubmit={handleGenerate}>
                    <div className="form-group">
                        <div className="label-with-action">
                            <label htmlFor="productLink" className="input-label">Shopee Product Link</label>
                            <button 
                                type="button" 
                                className="analyze-button" 
                                onClick={handleAnalyze} 
                                disabled={!productLink || isAnalyzing || isLoading}
                            >
                                {isAnalyzing ? 'Analyzing...' : '🤖 AI Analyze & Fill'}
                            </button>
                        </div>
                        <input
                        id="productLink"
                        name="productLink"
                        type="url"
                        className="input-field"
                        value={productLink}
                        onChange={handleProductLinkChange}
                        placeholder="Paste your Shopee product link here..."
                        aria-label="Shopee Product Link"
                        required
                        />
                    </div>
                    
                    <fieldset className="advanced-options-fieldset" disabled={isAnalyzing}>
                        <div className="advanced-options-grid">
                            <div className="form-group full-width">
                                <label htmlFor="goal" className="input-label">Content Goal</label>
                                <select id="goal" name="goal" className="select-field" value={advancedInputs.goal} onChange={handleAdvancedInputChange}>
                                    <option>Awareness</option>
                                    <option>Engagement</option>
                                    <option>Conversion</option>
                                    <option>Review / Testimonial</option>
                                    <option>Educational</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="platform" className="input-label">Platform</label>
                                <select id="platform" name="platform" className="select-field" value={advancedInputs.platform} onChange={handleAdvancedInputChange}>
                                    <option>TikTok</option>
                                    <option>Shopee Video</option>
                                    <option>Instagram Reels</option>
                                    <option>YouTube Shorts</option>
                                    <option>Facebook</option>
                                    <option>Threads</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="audienceBuyerType" className="input-label">Buyer Type</label>
                                <input type="text" id="audienceBuyerType" name="audienceBuyerType" className="input-field" value={advancedInputs.audienceBuyerType} onChange={handleAdvancedInputChange} placeholder="e.g., Budget-conscious"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="audienceGender" className="input-label">Target Gender</label>
                                <select id="audienceGender" name="audienceGender" className="select-field" value={advancedInputs.audienceGender} onChange={handleAdvancedInputChange}>
                                    <option>Unisex</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                             <div className="form-group">
                                <label htmlFor="audienceAge" className="input-label">Target Age Group</label>
                                <select id="audienceAge" name="audienceAge" className="select-field" value={advancedInputs.audienceAge} onChange={handleAdvancedInputChange}>
                                    <option>Teen</option>
                                    <option>20s</option>
                                    <option>30s</option>
                                    <option>40s+</option>
                                </select>
                            </div>

                            <div className="form-group subtitle full-width">
                                <h4>Creative Direction</h4>
                                <p>Auto-filled based on your Content Goal. Feel free to customize!</p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="toneAndStyle" className="input-label">Tone & Style</label>
                                <select id="toneAndStyle" name="toneAndStyle" className="select-field" value={advancedInputs.toneAndStyle} onChange={handleAdvancedInputChange}>
                                    <option>Fun / Casual</option>
                                    <option>Professional</option>
                                    <option>Minimalist</option>
                                    <option>Trendy / Gen-Z</option>
                                    <option>Luxury / Premium</option>
                                    <option>Emotional / Heartwarming</option>
                                    <option>Friendly & Informative</option>
                                    <option>Trustworthy & Direct</option>
                                    <option>Mix (English + Malay)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="format" className="input-label">Video Format</label>
                                <select id="format" name="format" className="select-field" value={advancedInputs.format} onChange={handleAdvancedInputChange}>
                                    <option>Unboxing</option>
                                    <option>Problem–Solution</option>
                                    <option>Tutorial / Demo</option>
                                    <option>Before–After</option>
                                    <option>Lifestyle B-roll</option>
                                    <option>Product comparison</option>
                                    <option>Storytelling / Review</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="contentIntent" className="input-label">Content Intent</label>
                                <input type="text" id="contentIntent" name="contentIntent" className="input-field" value={advancedInputs.contentIntent} onChange={handleAdvancedInputChange} placeholder="e.g., Genuine recommendation"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="narrativeStyle" className="input-label">Narrative Style</label>
                                <input type="text" id="narrativeStyle" name="narrativeStyle" className="input-field" value={advancedInputs.narrativeStyle} onChange={handleAdvancedInputChange} placeholder="e.g., First-person experience"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="callToActionStyle" className="input-label">Call to Action Style</label>
                                <input type="text" id="callToActionStyle" name="callToActionStyle" className="input-field" value={advancedInputs.callToActionStyle} onChange={handleAdvancedInputChange} placeholder="e.g., Soft suggestion"/>
                            </div>
                             <div className="form-group">
                                <label htmlFor="category" className="input-label">Product Category</label>
                                <input type="text" id="category" name="category" className="input-field" value={advancedInputs.category} onChange={handleAdvancedInputChange} placeholder="e.g., Tech, Beauty, Kitchen"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="videoLength" className="input-label">Video Length</label>
                                <select id="videoLength" name="videoLength" className="select-field" value={advancedInputs.videoLength} onChange={handleAdvancedInputChange}>
                                    <option>10 sec</option>
                                    <option>20 sec</option>
                                    <option>30 sec</option>
                                    <option>1 min</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="language" className="input-label">Language</label>
                                <select id="language" name="language" className="select-field" value={advancedInputs.language} onChange={handleAdvancedInputChange}>
                                    <option>English</option>
                                    <option>Malay</option>
                                    <option>Mixed (Eng + BM)</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <button type="submit" className="generate-button" disabled={isLoading || isAnalyzing || !productLink}>
                      {isLoading ? 'Generating...' : '✨ Generate Content'}
                    </button>
                </form>
            </div>
        </div>
      </div>
       {(productSummary || affiliatePotential || trendscore !== null) && (
        <div className="form-card">
            <button className="accordion-header" onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)} aria-expanded={!isAnalysisCollapsed}>
                <h3>🤖 AI Analysis Preview</h3>
                <span className={`accordion-icon ${!isAnalysisCollapsed ? 'open' : ''}`} aria-hidden="true"></span>
            </button>
            <div className={`accordion-content ${!isAnalysisCollapsed ? 'open' : ''}`}>
                 <div className="accordion-content-inner">
                    <div className="preview-grid">
                        <div className="preview-section">
                            <h5>Product Summary</h5>
                            <p>{productSummary}</p>
                            {productFeatures && productFeatures.length > 0 && (
                                <>
                                    <h5 style={{marginTop: '1.25rem'}}>Specifications & Features</h5>
                                    <ul className="features-list">
                                        {productFeatures.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                        <div className="preview-section">
                            <h5>🔥 Trend Score</h5>
                            {trendscore !== null && (
                                <div className="trendscore-bar">
                                    <div className="trendscore-bar-fill" style={{ width: `${trendscore}%` }}></div>
                                    <span className="trendscore-label">{trendscore} / 100</span>
                                </div>
                            )}
                        </div>
                        <div className="preview-section">
                            <h5>📈 Affiliate Potential</h5>
                            {affiliatePotential && (
                                <span className={`potential-badge potential-${affiliatePotential.toLowerCase()}`}>
                                    {affiliatePotential}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )}

      {isLoading && !generatedContent.video && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Generating your content...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      
      {(generatedContent.video || generatedContent.post || (!isLoading && !error)) && (
        <>
        {(generatedContent.video || generatedContent.post) && (
            <>
            <div className="output-controls">
                <div className="segmented-control">
                    <button type="button" className={activeOutputTab === 'video' ? 'active' : ''} onClick={() => setActiveOutputTab('video')}>🎬 Short-form Video</button>
                    <button type="button" className={activeOutputTab === 'post' ? 'active' : ''} onClick={() => setActiveOutputTab('post')}>✍️ Threads / FB Post</button>
                </div>
                <div className="export-actions">
                    <button onClick={handleSaveToList} className="export-button save-button">💾 Save</button>
                    <button onClick={handleOpenSocialModal} className="export-button social-button">🗓️ Schedule Post</button>
                    <button onClick={handleDownloadTxt} className="export-button">Download .txt</button>
                    {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <button onClick={handleShare} className="export-button">Share</button>}
                    <button onClick={handleClear} className="export-button clear-button">Clear</button>
                </div>
            </div>
            </>
        )}
        <div className="output-container">
            {visualizableSections.map(section => 
                 React.cloneElement(renderPromptCard(section, true), { key: section.key })
            )}
            {chunkedNonVisualizableSections.map((pair, index) => (
                <div key={index} className="standard-section-row">
                    {renderPromptCard(pair[0])}
                    {pair[1] ? renderPromptCard(pair[1]) : <div />}
                </div>
            ))}
        </div>
        </>
      )}
      {renderSocialModal()}
    </>
  );
  }

  const renderSavedPage = () => (
    <div className="saved-page">
        {savedList.length > 0 ? (
            <div className="saved-list-container">
                <div className="saved-list-header">
                    <h2>Saved Ideas</h2>
                    <div className="saved-list-controls">
                        <input
                            type="search"
                            placeholder="Search by title or link..."
                            className="search-input"
                            value={savedSearchTerm}
                            onChange={(e) => setSavedSearchTerm(e.target.value)}
                            aria-label="Search saved ideas"
                        />
                        <select
                            className="sort-select"
                            value={savedSortOrder}
                            onChange={(e) => setSavedSortOrder(e.target.value)}
                            aria-label="Sort saved ideas"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {processedSavedList.length > 0 ? (
                    <ul className="saved-list">
                        {processedSavedList.map(item => (
                            <li key={item.id} className="saved-item">
                                <div className="saved-item-info">
                                    <span className="saved-item-type">🎬 Video + ✍️ Post</span>
                                    <span className="saved-item-title">{item.title}</span>
                                    <span className="saved-item-link">{item.productLink}</span>
                                </div>
                                <div className="saved-item-actions">
                                    <button onClick={() => handleLoadSavedItem(item)} className="saved-item-button load-button">Load</button>
                                    <button onClick={() => handleDeleteSavedItem(item.id)} className="saved-item-button delete-button" aria-label="Delete saved item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-results-message">No saved ideas match your search.</p>
                )}
            </div>
        ) : (
             <div className="empty-saved-page">
                <h2>No Saved Ideas Yet</h2>
                <p>Generate some content and click the &quot;💾 Save&quot; button to see your ideas here.</p>
            </div>
        )}
    </div>
  );
  
  const renderSchedulerPage = () => (
    <div className="scheduler-page">
        {scheduledPosts.length > 0 ? (
            <div className="scheduled-list-container">
                <div className="scheduled-list-header">
                    <h2>Scheduled Posts</h2>
                </div>
                <ul className="scheduled-list">
                    {scheduledPosts.map(post => (
                        <li key={post.id} className="scheduled-item">
                            <div className="scheduled-item-preview">
                                <Image src={post.imageUrl} alt="Scheduled post preview" width={120} height={80} unoptimized />
                            </div>
                            <div className="scheduled-item-details">
                                <div className="scheduled-item-header">
                                    <span className={`platform-tag ${post.platform.toLowerCase()}`}>{post.platform}</span>
                                    <span className="scheduled-time">
                                        {new Date(post.scheduledTime).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                </div>
                                <p className="scheduled-item-caption">{post.caption}</p>
                            </div>
                            <div className="scheduled-item-actions">
                                <button onClick={() => handleDeleteScheduledPost(post.id)} className="scheduled-item-button cancel-button" aria-label="Cancel scheduled post">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                    </svg>
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        ) : (
            <div className="empty-saved-page">
                <h2>No Posts Scheduled</h2>
                <p>Use the &quot;🗓️ Schedule Post&quot; button on the generator page to plan your content.</p>
            </div>
        )}
    </div>
  );

  if (isInitialLoading) {
    return (
        <div className="loading-indicator-full-page">
            <div className="spinner"></div>
            <p>Loading your creative space...</p>
        </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
                <div className="header-content">
                        <h1>Affiliate Content Genie</h1>
                        <p>Your AI assistant for viral Shopee & TikTok content</p>
                                    <div className="auth-area">
                                        <AuthButton />
                                        <BodyAttrDebugger />
                                    </div>
                </div>
        <nav className="header-nav">
            <button 
                className={`nav-button ${currentPage === 'generator' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('generator')}
                aria-label="Generator"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a.5.5 0 0 1 .5.5v2h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1h.5v-2A.5.5 0 0 1 8 1zm3.5 4.004a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5zM.5 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 .5 8zm11.5 6.5a.5.5 0 0 1-.5-.5v-2h-.5a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1h-.5v2a.5.5 0 0 1-.5.5z"/>
                    <path d="M4.5 5.032A.5.5 0 0 1 5 5.5c.328 0 .618.108.852.295l.001.001.034.027c.27.213.495.493.65.827.122.26.19.553.19.883s-.068.623-.19.883c-.155.334-.38.614-.65.827l-.034.027-.001.001A1.734 1.734 0 0 1 5 10.5a.5.5 0 0 1 0-1c.54 0 1.053-.224 1.414-.586.36-.36.586-.874.586-1.414s-.226-1.054-.586-1.414A1.998 1.998 0 0 0 5 5.5a.5.5 0 0 1-.5-.468z"/>
                </svg>
                <span>Generator</span>
            </button>
            <button 
                className={`nav-button ${currentPage === 'saved' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('saved')}
                aria-label="Saved Ideas"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
                </svg>
                <span>Saved</span>
                {savedList.length > 0 && <span className="saved-count-badge">{savedList.length}</span>}
            </button>
            <button 
                className={`nav-button ${currentPage === 'scheduler' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('scheduler')}
                aria-label="Scheduler"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    <path d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5-.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                </svg>
                <span>Scheduler</span>
                {scheduledPosts.length > 0 && <span className="saved-count-badge">{scheduledPosts.length}</span>}
            </button>
        </nav>
      </header>

      <main className="main-content">
        {currentPage === 'generator' && renderGeneratorPage()}
        {currentPage === 'saved' && renderSavedPage()}
        {currentPage === 'scheduler' && renderSchedulerPage()}
      </main>
      
    </div>
  );
};
