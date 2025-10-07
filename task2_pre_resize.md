
# Task 2 — Pre-Resize Large Images (Up to 50MB)

## Objective
Allow users to upload large image files (up to 50MB), but downscale them client-side before uploading to the API.

## Requirements
- Max upload size: 50MB.
- Resize **before** any API call.
- Fast mode → 512px max dimension.
- High mode → 768px max dimension.
- Use JPEG q=0.8 or WebP for output.
- Optionally offload to a Web Worker for smoother UX.

## Implementation Steps
1. Create helper `toDataUrlAndResize(file, maxDim)`.
2. Use `createImageBitmap()` + `OffscreenCanvas` to scale images.
3. Convert to Blob → base64 Data URL.
4. Integrate this step before `/api/create-mesh`.

## Example
```ts
export async function toDataUrlAndResize(file, maxDim=512, mime='image/jpeg', q=0.8) {
  const blob = file.size > 50*1024*1024 ? file.slice(0, 50*1024*1024) : file;
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = new OffscreenCanvas(bitmap.width * scale, bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const resized = await canvas.convertToBlob({ type: mime, quality: q });
  return blobToDataURL(resized);
}
```

## Claude Code Prompt
> Implement client-side downscaling for uploaded images (max 50MB input). Add `toDataUrlAndResize(file, maxDim)` using OffscreenCanvas + createImageBitmap. Use 512px (fast) or 768px (high). Perform this before sending to `/api/create-mesh`. Optionally offload to a Web Worker and show a progress indicator “Optimizing image…”.
