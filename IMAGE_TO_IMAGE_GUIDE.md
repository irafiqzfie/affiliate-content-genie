# Image-to-Image AI Implementation Guide

## Overview

This application now supports **image-to-image AI transformations**, allowing users to upload product images and have the AI generate enhanced variations or modifications while preserving the original subject and context.

## Architecture

### 1. Image Upload (Frontend)
**Location:** `src/app/page.tsx`

- Users can upload up to **5 product images**
- Supported formats: JPG, PNG, WEBP (max 5MB each)
- First uploaded image is marked as "Primary"
- Images are converted to base64 data URLs for API transmission

**State Management:**
```typescript
const [productImages, setProductImages] = useState<File[]>([]);
const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
```

### 2. Content Generation with Images
**Location:** `src/app/api/generate/route.ts`

When generating content, uploaded images are sent to the API:

```typescript
body: JSON.stringify({ 
  productLink, 
  advancedInputs,
  productImages: productImagePreviews // Base64 encoded images
})
```

**System Instruction Update:**
The AI is instructed to:
- Use uploaded images as PRIMARY VISUAL REFERENCE
- Generate image prompts that describe enhancements/variations of uploaded images
- NOT generate prompts for completely different or unrelated images
- Maintain consistency with the product shown in uploaded images

### 3. Image-to-Image API Route
**Location:** `src/app/api/visualize/image-to-image/route.ts`

A dedicated endpoint for image-to-image transformations using Gemini Vision API.

**Features:**
- Accepts uploaded image data (base64)
- Optional transformation instructions
- Returns image analysis with structured data:
  - Subject description
  - Style details
  - Elements to preserve
  - Enhancement suggestions

**API Request:**
```typescript
POST /api/visualize/image-to-image

{
  "imageData": "data:image/jpeg;base64,...",
  "prompt": "Additional instructions",
  "transformation": "enhance" | "variation" | "style-transfer"
}
```

**API Response:**
```typescript
{
  "success": true,
  "originalImage": "data:image/jpeg;base64,...",
  "enhancedImage": "...",
  "analysis": {
    "subject": "Product description",
    "style": "Professional photography",
    "preserve": "Original subject and composition",
    "enhance": "Color vibrancy and clarity"
  }
}
```

### 4. Enhanced Image Generation
**Location:** `src/app/api/visualize/image/route.ts`

Modified to accept conditioning images:

```typescript
POST /api/visualize/image

{
  "prompt": "Image generation prompt",
  "conditionImage": "data:image/jpeg;base64,...", // Optional
  "transformation": "enhance" | "generate"
}
```

When `conditionImage` is provided:
- The uploaded image is used as a reference
- Generated content respects the original composition
- AI maintains subject consistency

## Image-to-Image Guidelines

### For AI Models

#### Prompts for Image-to-Image Generation:

1. **Basic Transformation:**
   ```
   Generate an image based on the content and style of the uploaded photo. 
   Do not use any unrelated or random elements.
   ```

2. **Style Preservation:**
   ```
   Use the uploaded image as the primary source. 
   The output should closely resemble or be derived from the uploaded image.
   ```

3. **Specific Modification:**
   ```
   Transform the uploaded image by [increase vibrancy/add product overlay], 
   but preserve its subject and context.
   ```

4. **Variation with Constraints:**
   ```
   Given the provided input image, generate a variation that maintains 
   its core content while [apply user-specified change, if any].
   ```

5. **Enhancement Only:**
   ```
   Edit or enhance this uploaded image according to the user's instructions, 
   keeping the main subject identical.
   ```

### For API Integration

To integrate with actual image-to-image APIs:

#### Stable Diffusion img2img
```typescript
const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${STABILITY_API_KEY}`
  },
  body: JSON.stringify({
    init_image: base64Image,
    text_prompts: [{ text: prompt }],
    cfg_scale: 7,
    image_strength: 0.35, // Lower = more faithful to original
    steps: 30
  })
});
```

#### OpenAI DALL-E Variations
```typescript
const response = await fetch('https://api.openai.com/v1/images/variations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image: base64Image,
    n: 1,
    size: "1024x1024"
  })
});
```

#### Replicate API (Various Models)
```typescript
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${REPLICATE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    version: "model-version-id",
    input: {
      image: base64Image,
      prompt: prompt,
      strength: 0.8 // Transformation strength
    }
  })
});
```

## Implementation Status

### ✅ Completed & Live
- Multiple image upload (up to 5 images)
- Image preview with grid layout
- Base64 encoding for API transmission
- Image data flow from frontend to backend
- System instruction updates for image awareness
- Gemini Vision API integration for image analysis
- Dedicated image-to-image API route
- Enhanced handleGenerateImage with conditioning support
- **🎉 Replicate API Integration (SDXL img2img) - LIVE!**

### 🎯 Currently Active
The application is now using **Replicate's Stable Diffusion XL** for real AI-powered image transformations!

**Model:** SDXL img2img  
**Processing Time:** ~15-30 seconds  
**Cost:** ~$0.003-0.01 per image  
**Status:** ✅ Production-ready

### 📝 Integration Points

To activate actual image-to-image generation:

1. **Choose your provider:**
   - Stability AI (Stable Diffusion)
   - OpenAI (DALL-E)
   - Replicate (multiple models)

2. **Update environment variables:**
   ```env
   STABILITY_API_KEY=your_key_here
   # or
   OPENAI_API_KEY=your_key_here
   # or
   REPLICATE_API_KEY=your_key_here
   ```

3. **Modify `/api/visualize/image-to-image/route.ts`:**
   - Replace placeholder logic with actual API calls
   - Handle API-specific request/response formats
   - Implement proper error handling and retries

4. **Update `/api/visualize/image/route.ts`:**
   - Integrate img2img API when `conditionImage` is present
   - Fall back to text-to-image when no conditioning image

## Best Practices

### Image Conditioning Strength
- **0.1-0.3**: Subtle enhancement (color correction, sharpness)
- **0.4-0.6**: Moderate changes (background, lighting)
- **0.7-0.9**: Major transformation (style transfer, composition)

### Prompt Engineering for img2img
- Start with "Based on the uploaded image..."
- Specify what to preserve: "keeping the product identical"
- Describe modifications: "enhance lighting and add lifestyle context"
- Avoid contradictory instructions

### Performance Optimization
- Compress images before base64 encoding
- Consider image size limits (512x512 or 1024x1024)
- Implement caching for repeated transformations
- Use background processing for heavy transformations

## Testing

### Manual Testing
1. Upload 1-5 product images
2. Click "Generate Content"
3. Verify that image prompts reference uploaded images
4. Check that generated content maintains consistency
5. Test image generation with conditioning

### API Testing
```bash
# Test image-to-image endpoint
curl -X POST http://localhost:3000/api/visualize/image-to-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,...",
    "prompt": "Enhance colors and add professional lighting",
    "transformation": "enhance"
  }'
```

## Future Enhancements

1. **Batch Processing**: Generate variations for all uploaded images
2. **Style Presets**: One-click style transfers (minimalist, vibrant, vintage)
3. **Advanced Controls**: Sliders for strength, CFG scale, steps
4. **Comparison View**: Side-by-side original vs. enhanced
5. **History**: Save and compare different transformations
6. **Auto-Enhancement**: AI decides best enhancements automatically

## Troubleshooting

### Images not being sent to API
- Check browser console for base64 encoding errors
- Verify productImagePreviews state is populated
- Confirm JSON.stringify doesn't truncate large payloads

### Image analysis not working
- Ensure Gemini API key has vision capabilities enabled
- Check that base64 prefix is correctly removed
- Verify mime type detection

### Poor transformation quality
- Adjust conditioning strength parameter
- Improve prompt specificity
- Try different img2img models
- Ensure source image quality is sufficient

## Resources

- [Stability AI Documentation](https://platform.stability.ai/docs)
- [OpenAI Image API](https://platform.openai.com/docs/guides/images)
- [Replicate API Docs](https://replicate.com/docs)
- [Gemini Vision API](https://ai.google.dev/gemini-api/docs/vision)
