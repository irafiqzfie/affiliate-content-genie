
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import AuthButton from './components/AuthButton';
import { SavedItemsList } from '@/app/components/SavedContent';
import { ScheduledPostsList, PostHistory } from '@/app/components/Scheduler';
import PostConfirmationModal, { PostOptions } from './components/PostConfirmationModal';
// import { useDebounce } from '@/app/hooks/useDebounce'; // Ready for future use

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
  'body-long'?: string[];
  'body-hook'?: string[];
  cta?: string[];
}

interface SavedItem {
  id: number;
  title: string;
  productLink: string | null;
  video: string;
  post: string;
  info: string;
  imageUrl?: string | null;
  createdAt?: string;
}

interface ScheduledPost {
  id: number;
  platform: 'Facebook' | 'Threads';
  scheduledTime: string; // ISO string
  imageUrl: string | null;
  caption: string;
  affiliateLink?: string;
  status: 'Scheduled' | 'Posted';
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
];


export default function Home() {
  const { data: session } = useSession();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [productLink, setProductLink] = useState('');
  // New fields for manual product input
  const [productTitle, setProductTitle] = useState('');
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  // Future optimization: Apply debouncing to productLink for better performance
  // const debouncedProductLink = useDebounce(productLink, 500);
  const [advancedInputs, setAdvancedInputs] = useState(initialAdvancedInputs);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{ video: string | null, post: string | null, info: string | null }>({ video: null, post: null, info: null });
  const [editableContent, setEditableContent] = useState<{ video: ParsedContent | null, post: ParsedContent | null, info: ParsedContent | null }>({ video: null, post: null, info: null });
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
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<'generator' | 'saved' | 'scheduler'>('generator');
  const [activeOutputTab, setActiveOutputTab] = useState<'info' | 'post' | 'video'>('info');
  const [trendscore, setTrendscore] = useState<number | null>(null);
  const [productSummary, setProductSummary] = useState<string | null>(null);
  const [productFeatures, setProductFeatures] = useState<string[] | null>(null);
  const [affiliatePotential, setAffiliatePotential] = useState<string | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [postedPosts, setPostedPosts] = useState<ScheduledPost[]>([]);
  const [schedulingPlatform, setSchedulingPlatform] = useState<'Facebook' | 'Threads' | null>(null);
  const [showPostConfirmation, setShowPostConfirmation] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<'Facebook' | 'Threads' | null>(null);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [saveButtonState, setSaveButtonState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [hasGeneratedAttempt, setHasGeneratedAttempt] = useState(false);
  const [isShopeeImportOpen, setIsShopeeImportOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<'Threads' | 'Facebook'>>(new Set(['Threads']));

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
        '📄 Post Body (Long-Form):': 'body-long',
        '🎯 Post Body (Hook/Short):': 'body-hook',
        '📄 Post Body:': 'body',
        '🔗 Call to Action:': 'cta',
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
        'body-long': '📄 Post Body (Long-Form):',
        'body-hook': '🎯 Post Body (Hook/Short):',
        cta: '🔗 Call to Action:',
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
            
            // Separate scheduled and posted posts
            const allPosts = Array.isArray(scheduled) ? scheduled : [];
            const scheduledOnly = allPosts.filter(post => post.status === 'Scheduled').sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
            const postedOnly = allPosts.filter(post => post.status === 'Posted').sort((a, b) => new Date(b.createdAt || b.scheduledTime).getTime() - new Date(a.createdAt || a.scheduledTime).getTime());
            
            setScheduledPosts(scheduledOnly);
            setPostedPosts(postedOnly);
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
                const infoContent = savedData.info || '';
                setGeneratedContent({ video: videoContent, post: postContent, info: infoContent });
                setEditableContent({
                    video: parseContent(videoContent),
                    post: parseContent(postContent),
                    info: parseContent(infoContent),
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (productLink && !isLoading && !isAnalyzing) {
          const fakeEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
          } as React.FormEvent;
          handleGenerate(fakeEvent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productLink, isLoading, isAnalyzing]);

  // Auto-collapse form when output is generated
  useEffect(() => {
    if (generatedContent.video || generatedContent.post) {
      setIsFormCollapsed(true);
    }
  }, [generatedContent]);

  const handleProductLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductLink(e.target.value);
    if (trendscore !== null || productSummary || affiliatePotential || productFeatures) {
        setTrendscore(null);
        setProductSummary(null);
        setProductFeatures(null);
        setAffiliatePotential(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5; // Maximum 5 images
    
    // Check if adding these files would exceed the limit
    if (productImages.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images`);
      return;
    }
    
    const validFiles: File[] = [];
    const previews: string[] = [];
    
    for (const file of files) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload JPG, PNG, or WEBP only.`);
        continue;
      }
      
      // Validate file size
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }
      
      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setProductImagePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (validFiles.length > 0) {
      setProductImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const maxFiles = 5;
    if (productImages.length >= maxFiles) {
      setError(`You can only upload up to ${maxFiles} images`);
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (productImages.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images`);
      return;
    }

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload JPG, PNG, or WEBP only.`);
        continue;
      }

      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setProductImagePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setProductImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleAddImageFromUrl = async () => {
    if (!imageUrlInput.trim()) return;

    const maxFiles = 5;
    if (productImages.length >= maxFiles) {
      setError(`You can only upload up to ${maxFiles} images`);
      setImageUrlInput('');
      return;
    }

    try {
      // Validate URL
      const url = new URL(imageUrlInput.trim());
      
      // Fetch the image
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }

      const blob = await response.blob();
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(blob.type)) {
        setError('Invalid image type. Please use JPG, PNG, or WEBP.');
        return;
      }

      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (blob.size > maxSize) {
        setError('Image too large. Maximum size is 5MB.');
        return;
      }

      // Create File from blob
      const file = new File([blob], `image-${Date.now()}.${blob.type.split('/')[1]}`, { type: blob.type });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);

      setProductImages(prev => [...prev, file]);
      setImageUrlInput('');
      setError(null);

    } catch (err) {
      console.error('Error loading image from URL:', err);
      setError('Failed to load image from URL. Please check the URL and try again.');
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
    // Require at least one input: productLink, productTitle, or customDescription
    if ((!productLink && !productTitle && !customDescription) || isAnalyzing || isLoading) return;

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
            body: JSON.stringify({ 
              productLink,
              productTitle: productTitle || undefined,
              customDescription: customDescription || undefined
            }),
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

    } catch (err: unknown) {
        console.error('Analysis failed:', err);
    const message = extractErrorMessage(err);
    setError(message || 'Failed to analyze the product. Please fill details manually or try a different link.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Either productLink OR (productTitle + productImages) must be provided
    const hasManualInput = productTitle.trim() && productImagePreviews.length > 0;
    const hasProductLink = productLink.trim();
    
    if (!hasProductLink && !hasManualInput) {
      setError('Please provide either a Shopee product link, or both product title and images');
      return;
    }
    
    if (isLoading) return;

    // mark that user attempted generation so UI shows output area (even if empty/loading)
    setHasGeneratedAttempt(true);

    setIsLoading(true);
    
    // Auto-analyze before generating content
    const analyzePayload: { productLink?: string; productTitle?: string; productImages?: string[] } = {};
    
    if (productLink) {
      analyzePayload.productLink = productLink;
    } else if (productTitle || productImagePreviews.length > 0) {
      // Use title and/or images if no product link
      if (productTitle) analyzePayload.productTitle = productTitle;
      if (productImagePreviews.length > 0) analyzePayload.productImages = productImagePreviews;
    }
    
    if (Object.keys(analyzePayload).length > 0) {
      try {
        console.log('🔍 Starting auto-analyze with:', analyzePayload);
        const analyzeResponse = await fetch(`${API_URL}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analyzePayload),
        });
        
        if (analyzeResponse.ok) {
          const analysisData = await analyzeResponse.json();
          console.log('✅ Analysis data received:', analysisData);
          setTrendscore(analysisData.trendscore ?? null);
          setProductSummary(analysisData.productSummary || '');
          setAffiliatePotential(analysisData.affiliatePotential || '');
          setProductFeatures(analysisData.productFeatures || []);
        } else {
          console.warn('⚠️ Analysis response not OK:', analyzeResponse.status);
        }
      } catch (err) {
        console.warn('❌ Analysis failed, continuing with generation:', err);
        // Don't stop generation if analysis fails
      }
    } else {
      console.log('ℹ️ No product data provided for analysis');
    }
    setError(null);
    setGeneratedContent({ video: null, post: null, info: null });
    setEditableContent({ video: null, post: null, info: null });
    setGeneratedImages({});
    setGeneratedVideos({});
    setVideoLoadingStates({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    try {
      const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              productLink: productLink || productTitle, // Use title as fallback
              productTitle: productTitle || undefined,
              advancedInputs,
              productImages: productImagePreviews // Send base64 encoded images
            }),
        });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Content generation request failed' }));
        console.error('❌ Generate API Error:', errorData);
        
        // Show user-friendly error message
        let userMessage = errorData.message || 'Content generation failed';
        if (errorData.suggestion) {
          userMessage += ` ${errorData.suggestion}`;
        }
        
        throw new Error(userMessage);
      }
      
      const data = await response.json();
      const content = data.content;
      
      if (!content) {
        throw new Error('No content was generated. Please try again with a different product link.');
      }
      
      const videoContentMatch = content.match(/---VIDEO START---([\s\S]*?)---VIDEO END---/);
      const postContentMatch = content.match(/---POST START---([\s\S]*?)---POST END---/);

      const videoContent = videoContentMatch ? videoContentMatch[1].trim() : '';
      const postContent = postContentMatch ? postContentMatch[1].trim() : '';
      
      if (!videoContent && !postContent) {
        throw new Error('Generated content was in an unexpected format. Please try again.');
      }
      
      const newGenerated = { video: videoContent, post: postContent, info: infoContent };
      setGeneratedContent(newGenerated);
      setEditableContent({
          video: parseContent(videoContent),
          post: parseContent(postContent),
          info: parseContent(infoContent),
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGenerated));
      initializeOptionIndexes();

        } catch (err: unknown) {
            console.error('❌ Content generation error:', err);
            const message = extractErrorMessage(err);
            
            // Provide helpful error message with retry suggestion
            let errorMessage = message || 'Failed to generate content. Please try again.';
            
            // Add specific suggestions based on error type
            if (errorMessage.toLowerCase().includes('overloaded') || errorMessage.toLowerCase().includes('high demand')) {
              errorMessage = '🚦 The AI service is busy right now. Please wait 30-60 seconds and try again.';
            } else if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('limit')) {
              errorMessage = '📊 API usage limit reached. Please try again in a few minutes.';
            } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
              errorMessage = '🌐 Connection issue detected. Please check your internet and try again.';
            }
            
            setError(errorMessage);
        } finally {
      setIsLoading(false);
    }
  }, [productLink, productTitle, productImagePreviews, isLoading, advancedInputs, initializeOptionIndexes, parseContent]);
  
  const handleGenerateImage = useCallback(async (key: string, promptText: string) => {
    console.log('🎨 Generating image for key:', key, 'with prompt:', promptText.substring(0, 100) + '...');
    setImageLoadingStates(prev => ({ ...prev, [key]: true }));
    setError(null);
    try {
        // Check if we have uploaded product images to use as conditioning
        const hasUploadedImages = productImagePreviews.length > 0;
        const conditionImage = hasUploadedImages ? productImagePreviews[0] : null; // Use first image as primary
        
        if (hasUploadedImages) {
          console.log('🖼️ Using uploaded image as reference for image generation');
        }
        
        // Use standardized prompt for all image generations
        const standardizedPrompt = 'Extract the product from the reference image and preserve it exactly as-is — same shape, same angles, same materials, same logo, no redesigning or enhancing the product. Place the extracted product in a minimalist studio lighting setup: soft diffused white light, gentle ground shadow, clean neutral background (light grey), no reflections, no extra props, no text, no branding. Keep the product centered, sharp, and untouched. Only change the background and lighting style.';
        
        const requestBody = { 
          prompt: standardizedPrompt,
          conditionImage, // Include the uploaded image if available
          transformation: hasUploadedImages ? 'enhance' : 'generate' // Indicate transformation type
        };
        console.log('📡 Sending enhanced request to /api/visualize/image with body:', 
          { ...requestBody, conditionImage: conditionImage ? '[IMAGE_DATA]' : null });
        
        const response = await fetch(`${API_URL}/visualize/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        console.log('📥 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Image generation failed' }));
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.message);
        }

        const responseData = await response.json();
        console.log('✅ Enhanced API Response:', responseData);
        
        const { imageUrl, analysis } = responseData;
        
        // Log the analysis results for debugging
        if (analysis) {
            console.log('🎯 Image Analysis:', analysis);
        }
        
        if (!imageUrl) {
            throw new Error('No image URL returned from API');
        }
        
        console.log('🖼️ Setting image URL:', imageUrl);
        setGeneratedImages(prev => ({ ...prev, [key]: imageUrl }));

    } catch (err: unknown) {
        console.error('❌ Image generation failed:', err);
        const message = extractErrorMessage(err);
        setError(message || 'Failed to generate image. Please try again.');
    } finally {
        setImageLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [productImagePreviews]);
  
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
    
    // Auto-generate product image for post tab
    if (editableContent?.post) {
        const imageKey = 'post-image-generation';
        if (!generatedImages[imageKey] && !imageLoadingStates[imageKey] && productImagePreviews.length > 0) {
            handleGenerateImage(imageKey, '');
        }
    }
  }, [editableContent, handleGenerateImage, generatedImages, imageLoadingStates, productImagePreviews]);

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

  const handleRefreshSection = useCallback(async (sectionKey: string) => {
    // Check if we have the necessary data to regenerate
    if (isLoading) {
      console.warn('⚠️ Already loading, skipping refresh');
      return;
    }
    
    if (!productLink && !productTitle) {
      setError('Product link or title is required to refresh content');
      return;
    }
    
    console.log(`🔄 Refreshing section: ${sectionKey} for tab: ${activeOutputTab}`);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productLink: productLink || productTitle, // Use title as fallback
          advancedInputs,
          productImages: productImagePreviews
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Content regeneration failed' }));
        throw new Error(errorData.message || 'Failed to regenerate content');
      }
      
      const data = await response.json();
      const content = data.content;
      
      if (!content) {
        throw new Error('No content was generated. Please try again.');
      }
      
      const videoContentMatch = content.match(/---VIDEO START---([\s\S]*?)---VIDEO END---/);
      const postContentMatch = content.match(/---POST START---([\s\S]*?)---POST END---/);

      const videoContent = videoContentMatch ? videoContentMatch[1].trim() : '';
      const postContent = postContentMatch ? postContentMatch[1].trim() : '';
      
      // Parse the new content
      const newParsedVideo = parseContent(videoContent);
      const newParsedPost = parseContent(postContent);
      
      console.log(`🔍 Parsed content for ${sectionKey}:`, {
        videoSection: newParsedVideo[sectionKey as keyof ParsedContent],
        postSection: newParsedPost[sectionKey as keyof ParsedContent],
        activeTab: activeOutputTab
      });
      
      // Update only the specific section that was refreshed
      setEditableContent(prev => {
        console.log('📝 Previous state:', prev);
        
        if (activeOutputTab === 'video') {
          const updated = {
            ...prev,
            video: {
              ...(prev.video || {}),
              [sectionKey]: newParsedVideo[sectionKey as keyof ParsedContent]
            } as ParsedContent
          };
          console.log('📝 Updated state for video:', updated);
          return updated;
        } else if (activeOutputTab === 'post') {
          const updated = {
            ...prev,
            post: {
              ...(prev.post || {}),
              [sectionKey]: newParsedPost[sectionKey as keyof ParsedContent]
            } as ParsedContent
          };
          console.log('📝 Updated state for post:', updated);
          return updated;
        }
        return prev;
      });
      
      // Reset the selected option index for this section to show the first new option
      setSelectedOptionIndexes(prev => ({ ...prev, [sectionKey]: 0 }));
      
      console.log(`✅ Section ${sectionKey} refreshed successfully`);
      
    } catch (err: unknown) {
      console.error('❌ Section refresh error:', err);
      const message = extractErrorMessage(err);
      setError(message || 'Failed to refresh section. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [productLink, productTitle, advancedInputs, productImagePreviews, isLoading, activeOutputTab, parseContent]);

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
    let text = 'Inabiz Online - Generated Content\n===========================================\n\n';
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
    setGeneratedContent({ video: null, post: null, info: null });
    setEditableContent({ video: null, post: null, info: null });
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
    setHasGeneratedAttempt(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleSaveToList = async () => {
    if (!generatedContent.video && !generatedContent.post) return;
    
    setSaveButtonState('loading');
    
    const titleSource = editableContent.video?.title?.[0] || editableContent.post?.hook?.[0];
    const title = titleSource || `Saved Idea - ${new Date().toLocaleString()}`;

    // Ensure we always send non-empty strings for content
    const videoContent = generatedContent.video || '';
    const postContent = generatedContent.post || '';
    const infoContent = generatedContent.info || '';
    
    // Don't save if all are empty
    if (!videoContent && !postContent && !infoContent) {
      setError('No content to save. Please generate content first.');
      setSaveButtonState('error');
      setTimeout(() => setSaveButtonState('idle'), 2000);
      return;
    }

    try {
        // Get the first available generated image (from post sections)
        let blobImageUrl: string | null = null;
        for (const key in generatedImages) {
          if (generatedImages[key] && key.startsWith('post-')) {
            const imageData = generatedImages[key];
            
            // If it's already a blob URL (starts with https://), use it directly
            if (imageData && imageData.startsWith('https://')) {
              blobImageUrl = imageData;
              console.log('🖼️ Using existing blob URL:', blobImageUrl);
              break;
            }
            
            // If it's a base64 data URL, upload to Vercel Blob
            if (imageData && imageData.startsWith('data:image/')) {
              console.log('📤 Uploading image to Vercel Blob...');
              
              const uploadResponse = await fetch(`${API_URL}/upload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData })
              });
              
              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                blobImageUrl = uploadData.url;
                console.log('✅ Image uploaded to blob:', blobImageUrl);
              } else {
                console.warn('⚠️ Image upload failed, continuing without image');
              }
            }
            break;
          }
        }

        const newItemPayload = {
          title,
          productLink: productLink || '',
          content: {
              video: videoContent,
              post: postContent,
              info: infoContent,
          },
          imageUrl: blobImageUrl,
        };

        console.log('📤 Attempting to save item:', { ...newItemPayload, imageUrl: blobImageUrl ? 'included' : 'none' });
        
        const response = await fetch(`${API_URL}/saved-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItemPayload)
        });
        
        console.log('📥 Save response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('❌ Save failed:', errorData);
            throw new Error(errorData.message || `Failed to save item. Status: ${response.status}`);
        }

        const savedItem = await response.json();
        console.log('✅ Item saved successfully:', savedItem);
        
        setSavedList(prevList => [savedItem, ...prevList]);
        setSaveButtonState('success');
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveButtonState('idle'), 2000);
    } catch (err) {
        console.error('❌ Save error:', err);
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            console.error('Network error detected. Check CORS and API endpoint availability.');
            setError('Network error: Cannot reach the server. Please check your connection.');
        } else {
            const errorMessage = err instanceof Error ? err.message : 'Could not save the item. Please try again.';
            setError(errorMessage);
        }
        setSaveButtonState('error');
        
        // Reset to idle after 3 seconds
        setTimeout(() => setSaveButtonState('idle'), 3000);
    }
  };

  const handleDeleteSavedItem = async (id: number) => {
    const originalList = [...savedList];
    const updatedList = savedList.filter(item => item.id !== id);
    setSavedList(updatedList);

    try {
        console.log(`🗑️  Deleting saved item ${id}...`);
        const response = await fetch(`${API_URL}/saved-items/${id}`, { method: 'DELETE' });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('❌ Delete failed:', errorData);
            setSavedList(originalList);
            
            // Provide specific error messages
            if (response.status === 401) {
                throw new Error('You need to be signed in to delete items.');
            } else if (response.status === 404) {
                throw new Error('Item not found or already deleted.');
            } else {
                throw new Error(errorData.details || errorData.message || 'Failed to delete item from server.');
            }
        }
        
        console.log(`✅ Item ${id} deleted successfully`);
    } catch (err) {
        console.error('Delete error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Could not delete the item. Please try again.';
        setError(errorMsg);
        setSavedList(originalList);
    }
  };

  const handleLoadSavedItem = (item: SavedItem) => {
    setProductLink(item.productLink || '');
    setGeneratedContent({
      video: item.video,
      post: item.post,
      info: item.info,
    });
    setEditableContent({
        video: parseContent(item.video),
        post: parseContent(item.post),
        info: parseContent(item.info),
    });
    
    // Restore the saved image to generatedImages state
    if (item.imageUrl) {
      // Use 'post-image-generation' key to match UI expectations and prevent auto-regeneration
      setGeneratedImages({ 'post-image-generation': item.imageUrl });
    } else {
      setGeneratedImages({});
    }
    
    setActiveOutputTab('video');
    setTrendscore(null);
    setProductSummary(null);
    setProductFeatures(null);
    setAffiliatePotential(null);
    initializeOptionIndexes();
    setCurrentPage('generator');
    setHasGeneratedAttempt(true);
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
    if (activeOutputTab === 'info') return; // Info tab has no editable content
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

  const handleSchedulePost = async (platform: 'Facebook' | 'Threads') => {
    setPendingPlatform(platform);
    setShowPostConfirmation(true);
  };

  const handleConfirmPost = async (options: PostOptions) => {
    const platforms = options.selectedPlatforms;
    
    if (!platforms || platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    
    setShowPostConfirmation(false);

    const postContent = editableContent.post;
    
    // Get the first available generated image (from any section)
    let imageUrl: string | null = null;
    for (const key in generatedImages) {
      if (generatedImages[key] && key.startsWith('post-')) {
        imageUrl = generatedImages[key];
        break;
      }
    }
    
    // Determine caption based on user selection
    let captionText = '';
    const selectedBodyHookIndex = selectedOptionIndexes['body-hook'] ?? 0;
    const selectedBodyLongIndex = selectedOptionIndexes['body-long'] ?? 0;
    
    if (options.useHook && postContent?.['body-hook']?.[selectedBodyHookIndex]) {
      captionText = postContent['body-hook'][selectedBodyHookIndex];
    } else if (options.useLongForm && postContent?.['body-long']?.[selectedBodyLongIndex]) {
      captionText = postContent['body-long'][selectedBodyLongIndex];
    }

    if (!captionText) {
        alert("No caption text available. Please generate content first.");
        return;
    }

    // Check if image is required and available
    if (options.includeImage && !options.textOnly) {
      if (!imageUrl) {
        alert("Image was selected but no generated image is available.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
        let finalImageUrl = imageUrl;
        
        // Only process image if user wants to include it
        if (options.includeImage && !options.textOnly && imageUrl) {
          // Check if image URL is a data URL (base64) - upload to Vercel Blob
          const isDataUrl = imageUrl.startsWith('data:');
          
          if (isDataUrl) {
              console.log('📤 Uploading base64 image to Vercel Blob before scheduling...');
              
              const uploadResponse = await fetch(`${API_URL}/upload-image`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ imageData: imageUrl })
              });

              const uploadData = await uploadResponse.json();

              if (!uploadResponse.ok) {
                  throw new Error(uploadData.error || uploadData.details || 'Failed to upload image');
              }

              finalImageUrl = uploadData.url;
              console.log('✅ Image uploaded to:', finalImageUrl);
          } else {
              // Validate it's a proper HTTP/HTTPS URL
              const url = new URL(imageUrl);
              if (!url.protocol.startsWith('http')) {
                  throw new Error('Image URL is invalid. Please generate a new image.');
              }
          }
        }

        // Auto-schedule for immediate posting
        const scheduledDateTime = new Date().toISOString();

        // Post to each selected platform
        const postPromises = platforms.map(async (platform) => {
          setSchedulingPlatform(platform);
          
          const caption = stripHtml(captionText);
          const mediaUrl = (options.includeImage && !options.textOnly && finalImageUrl) ? finalImageUrl : null;
          
          // First, post to Threads API
          console.log('🚀 Posting to Threads with:', {
            text: caption.substring(0, 50) + '...',
            mediaUrl: mediaUrl || '(text-only)',
            mediaType: mediaUrl ? 'IMAGE' : 'TEXT'
          });
          
          const threadsResponse = await fetch(`${API_URL}/threads/post`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: caption,
              ...(mediaUrl && { mediaUrl, mediaType: 'IMAGE' })
            })
          });

          const threadsData = await threadsResponse.json();

          if (!threadsResponse.ok) {
            console.error('❌ Threads API error:', threadsData);
            throw new Error(threadsData.error || threadsData.details?.error?.message || `Failed to post to ${platform}`);
          }

          console.log('✅ Successfully posted to Threads!', { postId: threadsData.postId });

          // If there's an affiliate link, post it as a reply/comment with CTA
          const affiliateLinkToPost = options.affiliateLink || affiliateLink;
          if (affiliateLinkToPost && threadsData.postId) {
            console.log('💬 Posting affiliate link with CTA as comment...');
            
            // Get the CTA text from generated content
            const postContent = editableContent.post;
            const selectedCtaIndex = selectedOptionIndexes['cta'] ?? 0;
            const ctaText = postContent?.cta?.[selectedCtaIndex];
            
            // Build the comment text: CTA + affiliate link
            const commentText = ctaText 
              ? `${stripHtml(ctaText)}\n\n🔗 ${affiliateLinkToPost}`
              : `🔗 ${affiliateLinkToPost}`;
            
            try {
              const replyResponse = await fetch(`${API_URL}/threads/reply`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  postId: threadsData.postId,
                  text: commentText
                })
              });

              const replyData = await replyResponse.json();

              if (replyResponse.ok) {
                console.log('✅ Affiliate link with CTA posted as comment!');
              } else {
                console.warn('⚠️ Failed to post affiliate link:', replyData);
              }
            } catch (replyErr) {
              console.warn('⚠️ Error posting affiliate link comment:', replyErr);
            }
          }
          
          // Then save to database
          const newPostPayload = {
              platform: platform,
              scheduledTime: scheduledDateTime,
              imageUrl: mediaUrl,
              caption: caption,
              affiliateLink: affiliateLinkToPost || undefined,
              status: 'Posted' as const,
          };

          const response = await fetch(`${API_URL}/scheduled-posts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newPostPayload)
          });
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Failed to post to ${platform}: ${errorData.details || errorData.message}`);
          }

          return response.json();
        });

        const scheduledPostsResults = await Promise.all(postPromises);
        
        // Add all posts to posted posts
        const updatedPostedPosts = [...scheduledPostsResults, ...postedPosts];
        setPostedPosts(updatedPostedPosts);
        
        setSchedulingPlatform(null);
        setPendingPlatform(null);
        
        // Clear the preview after successful posting
        setGeneratedContent({ video: generatedContent.video, post: null, info: generatedContent.info });
        setEditableContent({ video: editableContent.video, post: null, info: editableContent.info });
        
        const platformNames = platforms.join(' and ');
        alert(`Post published to ${platformNames}!`);
    } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Could not schedule the post. Please try again.';
        setError(errorMsg);
        alert(errorMsg);
    } finally {
        setIsLoading(false);
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

  const handlePostNow = async (post: ScheduledPost) => {
    if (!session) {
      setError('Please sign in with Threads to post.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if image URL is a data URL (base64) - upload to Vercel Blob
      let mediaUrl: string | null = post.imageUrl;
      const isDataUrl = mediaUrl?.startsWith('data:');
      const isPicsumUrl = mediaUrl?.includes('picsum.photos');
      
      // Upload data URLs or picsum URLs (which Threads doesn't accept)
      if ((isDataUrl || isPicsumUrl) && mediaUrl) {
        if (isPicsumUrl) {
          console.warn('⚠️ Detected picsum.photos URL - fetching and converting to Vercel Blob...');
          
          try {
            // Fetch the picsum image
            const imageResponse = await fetch(mediaUrl);
            const imageBlob = await imageResponse.blob();
            
            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
            });
            reader.readAsDataURL(imageBlob);
            mediaUrl = await base64Promise;
          } catch (fetchErr) {
            console.error('Failed to fetch picsum image:', fetchErr);
            setError('Failed to fetch placeholder image. Please regenerate the content.');
            setIsLoading(false);
            return;
          }
        }
        
        console.log('📤 Uploading image to Vercel Blob...');
        
        const uploadResponse = await fetch(`${API_URL}/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: mediaUrl })
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload image');
        }

        mediaUrl = uploadData.url;
        console.log('✅ Image uploaded to:', mediaUrl);
      } else if (mediaUrl) {
        // Validate it's a proper HTTP/HTTPS URL
        try {
          const url = new URL(mediaUrl);
          if (!url.protocol.startsWith('http')) {
            throw new Error('Invalid URL protocol');
          }
        } catch {
          setError('Image URL is invalid. Cannot post to Threads.');
          setIsLoading(false);
          return;
        }
      }

      // Confirm before posting
      const confirmMessage = mediaUrl 
        ? "Post this content with image to Threads now?" 
        : "No image available. Post text-only to Threads?";
      
      if (!window.confirm(confirmMessage)) {
        setIsLoading(false);
        return;
      }

      // Post to Threads
      console.log('🚀 Posting to Threads with:', {
        text: post.caption?.substring(0, 50) + '...',
        mediaUrl: mediaUrl || '(text-only)',
        mediaType: mediaUrl ? 'IMAGE' : 'TEXT'
      });
      
      const response = await fetch(`${API_URL}/threads/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: post.caption,
          ...(mediaUrl && { mediaUrl, mediaType: 'IMAGE' })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Threads API error:', data);
        throw new Error(data.error || data.details?.error?.message || 'Failed to post to Threads');
      }

      console.log('✅ Successfully posted to Threads!', { postId: data.postId });

      // If there's an affiliate link, post it as a reply/comment with CTA
      if (post.affiliateLink && data.postId) {
        console.log('💬 Posting affiliate link with CTA as comment...');
        
        // Get the CTA text from generated content
        const postContent = editableContent.post;
        const selectedCtaIndex = selectedOptionIndexes['cta'] ?? 0;
        const ctaText = postContent?.cta?.[selectedCtaIndex];
        
        // Build the comment text: CTA + affiliate link
        const commentText = ctaText 
          ? `${stripHtml(ctaText)}\n\n🔗 ${post.affiliateLink}`
          : `🔗 ${post.affiliateLink}`;
        
        try {
          const replyResponse = await fetch(`${API_URL}/threads/reply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: data.postId,
              text: commentText
            })
          });

          const replyData = await replyResponse.json();

          if (replyResponse.ok) {
            console.log('✅ Affiliate link with CTA posted as comment!');
          } else {
            console.warn('⚠️ Failed to post affiliate link:', replyData);
            // Don't fail the whole operation if comment fails
          }
        } catch (replyErr) {
          console.warn('⚠️ Error posting affiliate link comment:', replyErr);
          // Continue even if comment fails
        }
      }

      // Remove from scheduled posts after successful posting
      const updatedPosts = scheduledPosts.filter(p => p.id !== post.id);
      setScheduledPosts(updatedPosts);

      // Delete from database
      await fetch(`${API_URL}/scheduled-posts/${post.id}`, { method: 'DELETE' });

      // Show success message using alert for now
      const successMsg = post.affiliateLink 
        ? 'Successfully posted to Threads with affiliate link! 🎉' 
        : 'Successfully posted to Threads! 🎉';
      alert(successMsg);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to post to Threads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneratorPage = () => {
    const nonVisualizableSections = sectionsConfig;

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

    const renderBodyCard = (section: {key: string; title: string; icon: string;}) => {
        const { key, title, icon } = section;
        
        // Info tab has no body content
        if (activeOutputTab === 'info') return null;
        
        // Get content for both body-long and body-hook separately
        const longFormContent = editableContent[activeOutputTab]?.['body-long'];
        const hookContent = editableContent[activeOutputTab]?.['body-hook'];
        
        const selectedIndex = selectedOptionIndexes[key] ?? 0;
        const selectedLongForm = longFormContent?.[selectedIndex];
        const selectedHook = hookContent?.[selectedIndex];
        
        // Define keys for both subsections
        const longFormKey = `${activeOutputTab}-body-long-${selectedIndex}`;
        const hookKey = `${activeOutputTab}-body-hook-${selectedIndex}`;
        const isEditingLongForm = editingKey === longFormKey;
        const isEditingHook = editingKey === hookKey;
        
        // Image generation state
        const imageKey = `post-image-generation`;
        const isLoadingImage = imageLoadingStates[imageKey];
        const generatedImage = generatedImages[imageKey];

        const renderSubsection = (subsectionTitle: string, subsectionKey: string, isEditing: boolean, subsectionContent: string[] | undefined, selectedOption: string | undefined) => {
            return (
                <div className="body-subsection">
                    <div className="subsection-header">
                        <h4>{subsectionTitle}</h4>
                    </div>
                    <div className="subsection-content">
                        {isLoading && !subsectionContent && <div className="skeleton-loader"></div>}
                        {!isLoading && (!subsectionContent || subsectionContent.length === 0) && <p className="placeholder-text">Content will appear here once generated.</p>}
                        
                        {subsectionContent && subsectionContent.length > 0 && selectedOption !== undefined && (
                            isEditing ? (
                                <RichTextEditor
                                    value={editText}
                                    onChange={setEditText}
                                    onSave={() => handleSaveEdit(subsectionKey.includes('body-long') ? 'body-long' : 'body-hook', selectedIndex)}
                                    onCancel={handleCancelEdit}
                                />
                            ) : (
                                <div className="option-display-area">
                                    <div className="prose" dangerouslySetInnerHTML={{ __html: selectedOption }} />
                                    <div className="option-actions">
                                        <button 
                                            className="edit-button"
                                            onClick={() => handleEdit(subsectionKey, selectedOption)}
                                            aria-label="Edit this option"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                            </svg>
                                        </button>
                                        <button 
                                            className="copy-button" 
                                            onClick={(e) => { e.stopPropagation(); handleCopy(subsectionKey, stripHtml(selectedOption)); }}
                                            aria-label="Copy content"
                                        >
                                            <svg fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5-.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                            </svg>
                                            <span className="copy-tooltip">{copiedStates[subsectionKey] ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            );
        };
        
        return (
            <div className="output-card">
                <div className="card-header">
                    <h3>{icon} {title}</h3>
                    <div className="card-header-actions">
                        {(longFormContent || hookContent) && (longFormContent?.length || hookContent?.length) && (
                            <>
                                <button
                                    className="refresh-button"
                                    onClick={(e) => { e.stopPropagation(); handleRefreshSection(key); }}
                                    disabled={isLoading}
                                    aria-label={`Refresh ${title}`}
                                    title={`Regenerate ${title}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                    </svg>
                                </button>
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
                            </>
                        )}
                    </div>
                </div>
                <div className="body-card-with-image">
                    {/* Product Image on the left */}
                    <div className="body-image-section">
                        {isLoadingImage && (
                            <div className="image-loading-indicator">
                                <div className="spinner image-spinner"></div>
                                <span>Generating...</span>
                            </div>
                        )}
                        {generatedImage && (
                            <div className="image-result-container">
                                <Image
                                    src={generatedImage}
                                    alt="Generated product image"
                                    className="generated-image"
                                    width={300}
                                    height={300}
                                    unoptimized
                                />
                                <div className="image-overlay-actions">
                                    <a href={generatedImage} target="_blank" rel="noreferrer" className="image-action-link">Open</a>
                                    <a href={generatedImage} download="product.jpg" className="image-action-link">Download</a>
                                </div>
                            </div>
                        )}
                        {!generatedImage && !isLoadingImage && (
                            <div className="image-placeholder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                                </svg>
                                <p>Product Image</p>
                            </div>
                        )}
                    </div>
                    {/* Text content on the right */}
                    <div className="body-card-content">
                        {renderSubsection("📝 Long-Form Content", longFormKey, isEditingLongForm, longFormContent, selectedLongForm)}
                        {renderSubsection("🎯 Hook / Short Version", hookKey, isEditingHook, hookContent, selectedHook)}
                    </div>
                </div>
            </div>
        );
    };

    const renderImageGenerationCard = () => {
        const imageKey = `post-image-generation`;
        const isLoadingImage = imageLoadingStates[imageKey];
        const generatedImage = generatedImages[imageKey];

        return (
            <div className="output-card visual-card">
                <div className="card-header">
                    <h3>🖼️ Product Image</h3>
                </div>
                <div className="visual-card-body">
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
                                    alt="Generated product image"
                                    className="generated-image"
                                    width={480}
                                    height={270}
                                    unoptimized
                                />
                                <div className="image-fallback" style={{ position: 'absolute', bottom: 8, left: 8, right: 48, color: 'var(--secondary-text-color)', fontSize: '0.8rem' }}>
                                    <a href={generatedImage} target="_blank" rel="noreferrer">Open image in new tab</a>
                                </div>
                                <a href={generatedImage} download="product-visualization.jpg" className="download-media-button" aria-label="Download Image">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                    </svg>
                                </a>
                            </div>
                        )}
                        {!generatedImage && !isLoadingImage && (
                            <div className="visualization-placeholder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                                </svg>
                                <p>Product image will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderPromptCard = (section: {key: string; title: string; icon: string;}, isVisual = false) => {
        if (!section) return <div/>;
        
        // Special handling for body section with two subsections
        if (section.key === 'body') {
            return renderBodyCard(section);
        }
        
        const { key, title, icon } = section;
        const richTextFields = new Set(['body', 'caption']);
        const isRichText = richTextFields.has(key);
        
        // Info tab has no prompt cards
        if (activeOutputTab === 'info') return null;
        
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
                <div className="card-header-actions">
                    {content && content.length > 0 && (
                        <>
                            <button
                                className="refresh-button"
                                onClick={(e) => { e.stopPropagation(); handleRefreshSection(key); }}
                                disabled={isLoading}
                                aria-label={`Refresh ${title}`}
                                title={`Regenerate ${title}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                </svg>
                            </button>
                            <div className="option-selector">
                                {[0, 1].map(index => (
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
                        </>
                    )}
                </div>
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
            <h3 className="input-title">
              <span className="pill-icon" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="url(#g2)" />
                  <defs>
                    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#ff7b00" />
                      <stop offset="1" stopColor="#00aaff" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="pill-text">Input Settings</span>
            </h3>
            <span className={`accordion-icon ${!isFormCollapsed ? 'open' : ''}`} aria-hidden="true"></span>
        </button>
        <div className={`accordion-content ${!isFormCollapsed ? 'open' : ''}`}>
            <div className="accordion-content-inner form-with-analysis">
                <div className="form-column">
                <form className="input-form" onSubmit={handleGenerate}>
                    {/* Product Info Block */}
                    <div className="input-section-group">
                      <div className="input-section-group-header">
                        <h3 className="input-section-group-title">Product Info</h3>
                        <p className="input-section-group-description">Describe the product you want content for</p>
                      </div>

                      <div className="form-grid-2col">
                        <div className="left-col-stack">
                          <div className="form-group">
                            <label htmlFor="productTitle" className="input-label">Product Title</label>
                            <input
                              id="productTitle"
                              name="productTitle"
                              type="text"
                              className="input-field"
                              value={productTitle}
                              onChange={(e) => setProductTitle(e.target.value)}
                              placeholder="Enter product name or title..."
                              aria-label="Product Title"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="customDescription" className="input-label">Custom Description <span className="optional-label">(Optional)</span></label>
                            <textarea
                              id="customDescription"
                              name="customDescription"
                              className="textarea-field compact-textarea"
                              value={customDescription}
                              onChange={(e) => setCustomDescription(e.target.value)}
                              placeholder="Add custom description or let AI auto-generate..."
                              aria-label="Custom Description"
                              rows={3}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="productLink" className="input-label">Shopee Product Link <span className="optional-label">(Optional)</span></label>
                            <input
                              id="productLink"
                              name="productLink"
                              type="url"
                              className="input-field"
                              value={productLink}
                              onChange={handleProductLinkChange}
                              placeholder="https://shopee.com/..."
                              aria-label="Shopee Product Link"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="productImage" className="input-label">
                            Product Images <span className="input-label-caption">(up to 5)</span>
                          </label>
                        <div className="image-upload-container compact">
                          <div className="image-preview-grid compact-gallery">
                            {productImagePreviews.map((preview, index) => (
                              <div key={index} className="image-preview-item gallery-tile">
                                <Image 
                                  src={preview} 
                                  alt={`Product preview ${index + 1}`} 
                                  className="image-preview"
                                  width={200}
                                  height={200}
                                  unoptimized
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="remove-image-button"
                                  aria-label={`Remove image ${index + 1}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                                  </svg>
                                </button>
                                {index === 0 && (
                                  <div className="primary-badge compact">Primary</div>
                                )}
                              </div>
                            ))}

                            {Array.from({ length: Math.max(0, 5 - productImagePreviews.length) }).map((_, idx) => (
                              <button
                                key={`placeholder-${idx}`}
                                type="button"
                                className="image-preview-item gallery-tile placeholder"
                                onClick={() => document.getElementById('productImage')?.click()}
                              >
                                <span className="placeholder-plus">+</span>
                                <span className="placeholder-label">Add</span>
                              </button>
                            ))}
                          </div>

                          {productImages.length < 5 && (
                            <div
                              className={`image-drop-zone subtle ${isDragging ? 'dragging' : ''}`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <label htmlFor="productImage" className="image-upload-label">
                                <div className="upload-placeholder">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 0 1-.708-.708l3-3z"/>
                                  </svg>
                                  <span className="upload-text">
                                    Drag & drop images here or click any tile
                                  </span>
                                  <span className="upload-hint">
                                    JPG, PNG, or WEBP · max 5MB each
                                  </span>
                                </div>
                                <input
                                  id="productImage"
                                  name="productImage"
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp"
                                  onChange={handleImageUpload}
                                  style={{ display: 'none' }}
                                  aria-label="Product Image Upload"
                                  multiple
                                />
                              </label>

                              <div className="image-url-input-container">
                                <div className="divider">
                                  <span>or</span>
                                </div>
                                <div className="url-input-group">
                                  <input
                                    type="url"
                                    className="url-input-field"
                                    placeholder="Paste image URL here..."
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddImageFromUrl();
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="url-add-button"
                                    onClick={handleAddImageFromUrl}
                                    disabled={!imageUrlInput.trim()}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Style Block */}
                    <div className="input-section-group">
                      <div className="input-section-group-header">
                        <h3 className="input-section-group-title">Content Style</h3>
                        <p className="input-section-group-description">Customize the tone, format, and narrative style</p>
                      </div>
                      <fieldset className="advanced-options-fieldset">
                        <div className="advanced-options-grid">
                            <div className="form-group featured">
                                <div className="tooltip-wrapper">
                                  <label htmlFor="goal" className="input-label">🎯 Content Goal</label>
                                  <span className="tooltip-icon" tabIndex={0}>?
                                    <span className="tooltip-content">Choose your primary objective - this will guide all other content decisions</span>
                                  </span>
                                </div>
                                <select id="goal" name="goal" className="select-field" value={advancedInputs.goal} onChange={handleAdvancedInputChange}>
                                    <option>Awareness</option>
                                    <option>Engagement</option>
                                    <option>Conversion</option>
                                    <option>Review / Testimonial</option>
                                    <option>Educational</option>
                                </select>
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
                    </div>

                    <button type="submit" className="generate-button" disabled={isLoading || (!productLink && !productTitle)}>
                      {isLoading ? 'Generating...' : '✨ Generate Content'}
                    </button>
                </form>
                </div>
            </div>
        </div>
      </div>

      {isLoading && !generatedContent.video && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div className="loading-progress">
            <p className="loading-title">✨ Creating your content...</p>
            <p className="loading-subtitle">This may take 20-40 seconds</p>
            <div className="loading-steps">
              <div className="step">🤖 Analyzing product...</div>
              <div className="step">📝 Crafting video script...</div>
              <div className="step">✍️ Writing social post...</div>
              <div className="step">🎨 Finalizing content...</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-content">
            <div className="error-text">{error}</div>
            <button 
              className="retry-button" 
              onClick={() => {
                setError(null);
                if (productLink) {
                  const fakeEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {},
                  } as React.FormEvent;
                  handleGenerate(fakeEvent);
                }
              }}
              disabled={isLoading || !productLink}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}

      {(hasGeneratedAttempt && (isLoading || generatedContent.video || generatedContent.post || error)) && (
        <div className="output-actions-section-top">
          <div className="output-actions-left">
            <span className="output-title">
              <span className="pill-icon" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="url(#g)" />
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#ff7b00" />
                      <stop offset="1" stopColor="#00aaff" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="pill-text">Output</span>
            </span>
            <div className="output-tab-selector">
              <button 
                type="button" 
                className={`output-tab-btn ${activeOutputTab === 'info' ? 'active' : ''}`} 
                onClick={() => setActiveOutputTab('info')}
                disabled={!generatedContent.video && !generatedContent.post}
              >
                📊 Info
              </button>
              <button 
                type="button" 
                className={`output-tab-btn ${activeOutputTab === 'post' ? 'active' : ''}`} 
                onClick={() => setActiveOutputTab('post')}
                disabled={!generatedContent.video && !generatedContent.post}
              >
                ✍️ Post
              </button>
              <button 
                type="button" 
                className={`output-tab-btn ${activeOutputTab === 'video' ? 'active' : ''}`} 
                onClick={() => setActiveOutputTab('video')}
                disabled={!generatedContent.video && !generatedContent.post}
              >
                🎬 Video
              </button>
            </div>
          </div>
          <div className="output-actions-group">
            {(generatedContent.post && editableContent.post) && (
              <button 
                onClick={() => {
                  setCurrentPage('scheduler');
                  // Scroll to top after navigation
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                }}
                className="output-action-btn primary"
              >
                📮 Send to Preview
              </button>
            )}
            <button 
              onClick={handleSaveToList} 
              className={`output-action-btn ${saveButtonState}`}
              disabled={saveButtonState === 'loading'}
            >
              💾 {saveButtonState === 'idle' && 'Save'}
              {saveButtonState === 'loading' && 'Saving...'}
              {saveButtonState === 'success' && 'Saved!'}
              {saveButtonState === 'error' && 'Failed'}
            </button>
            <button onClick={handleDownloadTxt} className="output-action-btn">
              ⬇️ Download
            </button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button onClick={handleShare} className="output-action-btn">
                🔗 Share
              </button>
            )}
            <button onClick={handleClear} className="output-action-btn clear">
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
      
      {(hasGeneratedAttempt && (isLoading || generatedContent.video || generatedContent.post || error)) && (
        <>
        <div className="output-container">
            {activeOutputTab === 'info' ? (
              <>
                {(trendscore !== null || productSummary || affiliatePotential || productFeatures) ? (
                  <>
                    {trendscore !== null && (
                      <div className="output-card">
                        <div className="card-header">
                          <h3 className="card-title">
                            <span className="card-icon">📈</span>
                            Trend Score
                          </h3>
                        </div>
                        <div className="card-content">
                          <div className="trend-score-display">
                            <div className="trend-score-fill" style={{ width: `${trendscore}%` }}></div>
                            <span className="trend-score-label">{trendscore}/100</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {affiliatePotential && (
                      <div className="output-card">
                        <div className="card-header">
                          <h3 className="card-title">
                            <span className="card-icon">💰</span>
                            Affiliate Potential
                          </h3>
                        </div>
                        <div className="card-content">
                          <span className={`potential-badge potential-${affiliatePotential.toLowerCase()}`}>
                            {affiliatePotential}
                          </span>
                        </div>
                      </div>
                    )}

                    {productSummary && (
                      <div className="output-card">
                        <div className="card-header">
                          <h3 className="card-title">
                            <span className="card-icon">📝</span>
                            Product Summary
                          </h3>
                        </div>
                        <div className="card-content">
                          <div className="analysis-content">{productSummary}</div>
                        </div>
                      </div>
                    )}

                    {productFeatures && productFeatures.length > 0 && (
                      <div className="output-card">
                        <div className="card-header">
                          <h3 className="card-title">
                            <span className="card-icon">✨</span>
                            Key Features
                          </h3>
                        </div>
                        <div className="card-content">
                          <ul className="features-list">
                            {productFeatures.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </>
            ) : activeOutputTab === 'post' ? (
                  <>
                    {/* Post Body with embedded image */}
                    {renderPromptCard(sectionsConfig.find(s => s.key === 'body')!)}
                    {/* Row 2: Hook + Hashtags + CTA */}
                    <div className="three-column-row">
                      {renderPromptCard(sectionsConfig.find(s => s.key === 'hook')!)}
                      {renderPromptCard(sectionsConfig.find(s => s.key === 'hashtags')!)}
                      {renderPromptCard(sectionsConfig.find(s => s.key === 'cta')!)}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Video tab: 2-column layout */}
                    {chunkedNonVisualizableSections.map((pair, index) => (
                        <div key={index} className="standard-section-row">
                            {renderPromptCard(pair[0])}
                            {pair[1] ? renderPromptCard(pair[1]) : <div />}
                        </div>
                    ))}
                  </>
                )}
        </div>
        </>
      )}
    </>
  );
  }

  const renderSavedPage = () => (
    <SavedItemsList 
      savedList={savedList}
      onLoadItem={handleLoadSavedItem}
      onDeleteItem={handleDeleteSavedItem}
    />
  );
  
  const renderSchedulerPage = () => (
    <>
      {/* Ready to Post - Dark Card Preview */}
      {generatedContent.post && editableContent.post && (
        <div className="scheduled-posts-section">
          <h2 className="section-title">Ready To Post</h2>

          <div className="scheduled-preview-card">
            {/* Image on Top */}
            {generatedImages['post-image-generation'] && (
              <div className="scheduled-preview-image">
                <Image 
                  src={generatedImages['post-image-generation']} 
                  alt="Post preview" 
                  width={320}
                  height={180}
                  className="scheduled-image"
                  unoptimized
                />
              </div>
            )}

            {/* Content Section */}
            <div className="scheduled-preview-content">
              {/* Platform Badge & Timestamp */}
              <div className="scheduled-preview-meta">
                <span className="scheduled-platform-badge">Threads</span>
                <span className="scheduled-preview-time">
                  {new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  })}
                </span>
              </div>

              {/* Post Text - Truncated */}
              <p className="scheduled-preview-text">
                {(() => {
                  const hook = editableContent.post.hook?.[selectedOptionIndexes['hook'] ?? 0];
                  const body = editableContent.post.body?.[selectedOptionIndexes['body'] ?? 0];
                  const cta = editableContent.post.cta?.[selectedOptionIndexes['cta'] ?? 0];
                  
                  const parts = [];
                  if (hook) parts.push(stripHtml(hook));
                  if (body) parts.push(stripHtml(body));
                  if (cta) parts.push(stripHtml(cta));
                  
                  const fullText = parts.join('\n\n');
                  // Truncate to ~100 chars for compact preview
                  return fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
                })()}
              </p>

              {/* Action Buttons */}
              <div className="scheduled-preview-actions">
                <button
                  className="scheduled-action-btn scheduled-btn-post"
                  onClick={() => {
                    setShowPostConfirmation(true);
                  }}
                  disabled={!session}
                >
                  📤 Post Now
                </button>
                <button
                  className="scheduled-action-btn scheduled-btn-cancel"
                  onClick={() => {
                    if (window.confirm('Discard this post preview?')) {
                      // Clear preview or navigate away
                    }
                  }}
                >
                  🗑️ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScheduledPostsList 
        scheduledPosts={scheduledPosts}
        onDeletePost={handleDeleteScheduledPost}
        onPostNow={handlePostNow}
      />
      <PostHistory posts={postedPosts} />
    </>
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
        <div className="branding">
          <div className="logo-container">
            <Image src="/logo.svg" alt="Inabiz Online Logo" className="logo-icon" width={52} height={52} />
            <h1>Inabiz Online</h1>
          </div>
          <p>a MASTER SERVE innovation</p>
        </div>
        
        <nav className="unified-tab-bar">
          <button 
            className={`unified-tab ${currentPage === 'generator' ? 'active' : ''}`} 
            onClick={() => setCurrentPage('generator')}
          >
            <span className="tab-icon">✨</span>
            <span className="tab-label">Generator</span>
          </button>
          {session && (
            <>
              <button 
                className={`unified-tab ${currentPage === 'saved' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('saved')}
              >
                <span className="tab-icon">💾</span>
                <span className="tab-label">Saved</span>
                {savedList.length > 0 && <span className="count-badge">{savedList.length}</span>}
              </button>
              <button 
                className={`unified-tab ${currentPage === 'scheduler' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('scheduler')}
              >
                <span className="tab-icon">📮</span>
                <span className="tab-label">Posts</span>
                {(() => {
                  const readyToPostCount = scheduledPosts.filter(p => p.status === 'Scheduled').length + 
                    (generatedContent.post && editableContent.post ? 1 : 0);
                  return readyToPostCount > 0 ? <span className="count-badge">{readyToPostCount}</span> : null;
                })()}
              </button>
            </>
          )}
        </nav>
        
        <div className="header-auth">
          <a href="/about" className="about-link">
            About Us
          </a>
          <a href="/contact" className="about-link">
            Contact Us
          </a>
          <AuthButton />
        </div>
      </header>

      <main className="main-content">
        {currentPage === 'generator' && renderGeneratorPage()}
        {currentPage === 'saved' && session && renderSavedPage()}
        {currentPage === 'scheduler' && session && renderSchedulerPage()}
        {currentPage === 'saved' && !session && (
          <div className="empty-saved-page">
            <h2>🔒 Login Required</h2>
            <p>Please sign in to access your saved content.</p>
          </div>
        )}
        {currentPage === 'scheduler' && !session && (
          <div className="empty-saved-page">
            <h2>🔒 Login Required</h2>
            <p>Please sign in to access scheduled posts.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-text">
            © {new Date().getFullYear()} Inabiz Online - MASTER SERVE ENTERPRISE. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
            <a href="/delete-data" className="footer-link">Delete My Data</a>
          </div>
        </div>
      </footer>
      
      {/* Post Confirmation Modal */}
      <PostConfirmationModal
        isOpen={showPostConfirmation}
        platform={'Threads'}
        onClose={() => {
          setShowPostConfirmation(false);
        }}
        onConfirm={handleConfirmPost}
        hasImage={!!Object.keys(generatedImages).find(key => key.startsWith('post-') && generatedImages[key])}
        hasLongForm={!!(editableContent.post?.['body-long'] && editableContent.post['body-long'].length > 0)}
        hasHook={!!(editableContent.post?.['body-hook'] && editableContent.post['body-hook'].length > 0)}
      />
    </div>
  );
};
