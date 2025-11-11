# Component Reference Guide

## Overview
This document provides usage examples and API reference for the newly created modular components.

---

## ContentGeneration Components

### LazyImage
Optimized image component with loading states and error handling.

**Location**: `src/app/components/ContentGeneration/LazyImage.tsx`

**Props**:
```typescript
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}
```

**Usage Example**:
```tsx
import { LazyImage } from '@/app/components/ContentGeneration';

<LazyImage 
  src="/path/to/image.jpg"
  alt="Product image"
  width={400}
  height={300}
  className="product-thumbnail"
/>
```

**Features**:
- Automatic skeleton loading state
- Shimmer animation during load
- Error fallback UI
- Next.js Image optimization
- Lazy loading by default

---

### RichTextEditor
Rich text editing component with formatting toolbar.

**Location**: `src/app/components/ContentGeneration/RichTextEditor.tsx`

**Props**:
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}
```

**Usage Example**:
```tsx
import { RichTextEditor } from '@/app/components/ContentGeneration';

const [content, setContent] = useState('');

<RichTextEditor 
  value={content}
  onChange={setContent}
  onSave={() => console.log('Saved:', content)}
  onCancel={() => setContent('')}
/>
```

**Features**:
- Bold, italic, bullet list formatting
- Visual toolbar with active state indicators
- contentEditable-based editing
- Save/Cancel actions
- Keyboard shortcuts support

---

### ProductInfoCard
Display product information in a card layout.

**Location**: `src/app/components/ContentGeneration/ProductInfoCard.tsx`

**Props**:
```typescript
interface ProductInfoCardProps {
  productInfo: ShopeeProductInfo;
}

interface ShopeeProductInfo {
  title: string;
  price: string;
  image: string;
  description: string;
}
```

**Usage Example**:
```tsx
import { ProductInfoCard } from '@/app/components/ContentGeneration';

const productInfo = {
  title: "Wireless Earbuds",
  price: "RM 99.90",
  image: "/product.jpg",
  description: "High quality audio..."
};

<ProductInfoCard productInfo={productInfo} />
```

**Features**:
- Structured product display
- Image with details layout
- Responsive design
- Styled with existing CSS classes

---

## SavedContent Components

### SavedItemsList
Display and manage saved content items.

**Location**: `src/app/components/SavedContent/SavedItemsList.tsx`

**Props**:
```typescript
interface SavedItemsListProps {
  savedList: SavedItem[];
  onLoadItem: (item: SavedItem) => void;
  onDeleteItem: (id: number) => void;
}

interface SavedItem {
  id: number;
  title: string;
  productLink: string;
  video: string;
  post: string;
  createdAt?: string;
}
```

**Usage Example**:
```tsx
import { SavedItemsList } from '@/app/components/SavedContent';

<SavedItemsList 
  savedList={savedItems}
  onLoadItem={(item) => loadContent(item)}
  onDeleteItem={(id) => deleteItem(id)}
/>
```

**Features**:
- Built-in search functionality
- Sort by newest/oldest
- Load and delete actions
- Empty state handling
- Responsive list layout

---

## Scheduler Components

### ScheduledPostsList
Display scheduled social media posts.

**Location**: `src/app/components/Scheduler/ScheduledPostsList.tsx`

**Props**:
```typescript
interface ScheduledPostsListProps {
  scheduledPosts: ScheduledPost[];
  onDeletePost: (id: number) => void;
}

interface ScheduledPost {
  id: number;
  platform: 'Facebook' | 'Threads';
  scheduledTime: string; // ISO string
  imageUrl: string;
  caption: string;
  status: 'Scheduled';
  createdAt?: string;
}
```

**Usage Example**:
```tsx
import { ScheduledPostsList } from '@/app/components/Scheduler';

<ScheduledPostsList 
  scheduledPosts={posts}
  onDeletePost={(id) => cancelPost(id)}
/>
```

**Features**:
- Platform badges (Facebook/Threads)
- Formatted date/time display
- Preview images
- Cancel action
- Empty state handling

---

## Hooks

### useDebounce
Debounce rapidly changing values.

**Location**: `src/app/hooks/useDebounce.ts`

**Signature**:
```typescript
function useDebounce<T>(value: T, delay?: number): T
```

**Usage Example**:
```tsx
import { useDebounce } from '@/app/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // This only runs when user stops typing for 500ms
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

**Parameters**:
- `value`: The value to debounce
- `delay`: Milliseconds to wait (default: 500)

**Use Cases**:
- Search inputs
- API call triggers
- Form validation
- Auto-save functionality

---

## Utilities

### contentUtils
Content manipulation and formatting utilities.

**Location**: `src/app/utils/contentUtils.ts`

**Functions**:

#### parseContent
```typescript
parseContent(text: string, keyMap: Record<string, string>): Record<string, string[]>
```
Parse AI-generated content into structured sections.

#### reconstructContent
```typescript
reconstructContent(parsed: Record<string, string[]>, keyMap: Record<string, string>): string
```
Rebuild content from parsed sections.

#### copyToClipboard
```typescript
async copyToClipboard(text: string): Promise<boolean>
```
Copy text to clipboard with error handling.

#### downloadAsFile
```typescript
downloadAsFile(content: string, filename: string, mimeType?: string): void
```
Download content as a file.

#### formatDate
```typescript
formatDate(dateString: string): string
```
Format ISO date to relative time (e.g., "2 hours ago").

#### extractErrorMessage
```typescript
extractErrorMessage(err: unknown): string | null
```
Safely extract error message from unknown error types.

#### truncate
```typescript
truncate(text: string, maxLength?: number): string
```
Truncate text with ellipsis (default: 100 chars).

#### countWords
```typescript
countWords(text: string): number
```
Count words in text.

---

## Types

### Location
`src/app/types/index.ts`

### Available Types
- `ParsedContent` - Structured content sections
- `SavedItem` - Saved content item
- `ShopeeProductInfo` - Product information
- `ScheduledPost` - Scheduled social post
- `AdvancedInputs` - Advanced generation options
- `SectionConfig` - Section configuration
- `GoalPreset` - Goal-based presets
- `GoalType` - Content goal types
- `VideoLoadingState` - Video generation state

**Import Example**:
```tsx
import type { SavedItem, ScheduledPost } from '@/app/types';
```

---

## Constants

### Location
`src/app/constants/index.ts`

### Available Constants
- `API_URL` - API endpoint base URL
- `LOCAL_STORAGE_KEY` - Storage key for saved data
- `goalPresets` - Pre-configured goal settings
- `initialAdvancedInputs` - Default advanced inputs
- `sectionsConfigVideo` - Video section configuration
- `sectionsConfigPost` - Post section configuration

**Import Example**:
```tsx
import { goalPresets, sectionsConfigVideo } from '@/app/constants';
```

---

## Migration Guide

### Before (Old Code)
```tsx
// All in one file
const [savedList, setSavedList] = useState([]);
const [searchTerm, setSearchTerm] = useState('');

// Render inline
{savedList.map(item => (
  <div key={item.id}>{item.title}</div>
))}
```

### After (New Code)
```tsx
// Import component
import { SavedItemsList } from '@/app/components/SavedContent';

// Use component
<SavedItemsList 
  savedList={savedList}
  onLoadItem={handleLoad}
  onDeleteItem={handleDelete}
/>
```

---

## Best Practices

1. **Import from index files**: Use barrel exports for cleaner imports
   ```tsx
   // Good
   import { LazyImage, RichTextEditor } from '@/app/components/ContentGeneration';
   
   // Avoid
   import { LazyImage } from '@/app/components/ContentGeneration/LazyImage';
   ```

2. **Type safety**: Always use TypeScript types
   ```tsx
   import type { SavedItem } from '@/app/types';
   
   const items: SavedItem[] = [];
   ```

3. **Component composition**: Build larger features from smaller components
   ```tsx
   // Good - Reusable, testable
   <SavedItemsList savedList={items} onLoadItem={load} onDeleteItem={del} />
   
   // Avoid - Monolithic inline rendering
   {items.map(item => <div>...lots of JSX...</div>)}
   ```

4. **Utilities over duplication**: Use utility functions
   ```tsx
   import { formatDate, truncate } from '@/app/utils/contentUtils';
   
   const display = truncate(item.title, 50);
   const time = formatDate(item.createdAt);
   ```

---

## Testing Examples

### Component Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedItemsList } from '@/app/components/SavedContent';

test('renders saved items', () => {
  const items = [{ id: 1, title: 'Test', ... }];
  render(<SavedItemsList savedList={items} onLoadItem={jest.fn()} onDeleteItem={jest.fn()} />);
  
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Hook Testing
```tsx
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/app/hooks/useDebounce';

test('debounces value', async () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 500),
    { initialProps: { value: 'initial' } }
  );
  
  expect(result.current).toBe('initial');
  
  rerender({ value: 'updated' });
  
  await act(() => new Promise(resolve => setTimeout(resolve, 500)));
  
  expect(result.current).toBe('updated');
});
```

---

## Troubleshooting

### Import Errors
**Problem**: Module not found
**Solution**: Ensure `@/app` alias is configured in `tsconfig.json`

### Type Errors
**Problem**: Type mismatch
**Solution**: Import types from `@/app/types` and use proper interfaces

### Style Issues
**Problem**: Styles not applying
**Solution**: Component uses existing CSS classes from `globals.css`

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
