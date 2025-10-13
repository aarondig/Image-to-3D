# Smooth Transitions - Figma Smart Animate Style

This document describes the smooth transition system implemented across all screens, inspired by Figma's Smart Animate feature.

## Overview

The app now features polished, Figma-like transitions with:
- **Smooth page transitions** with slide and scale effects
- **Shared element animations** (layoutId) for continuous image flow
- **Staggered content animations** for a progressive reveal
- **Interactive button animations** with hover and tap states
- **Custom easing curves** for natural motion

## Transition System

### Core Utilities ([src/utils/transitions.ts](src/utils/transitions.ts))

#### Easing Curves
- `smooth` - Smooth deceleration (default)
- `spring` - Bouncy spring-like curve
- `sharp` - Sharp acceleration/deceleration
- `gentle` - Gentle ease in and out

#### Transition Presets
- `screenTransition` - 450ms smooth page transitions
- `quickTransition` - 250ms for subtle animations
- `springTransition` - Spring physics for playful animations
- `layoutTransition` - 400ms for shared layout animations

#### Animation Variants

**Page Variants** (`pageVariants`)
- Directional slide (forward/backward)
- Subtle scale (0.98 → 1)
- Opacity fade
- Used on all screen containers

**Card Variants** (`cardVariants`)
- Vertical slide (20px)
- Scale animation (0.96 → 1)
- Opacity fade
- Used for card containers

**Stagger Variants** (`staggerContainer`, `staggerItem`)
- Sequential reveal of child elements
- 80ms delay between items
- 100ms initial delay
- Vertical slide + opacity

**Image Variants** (`imageVariants`)
- Scale + opacity
- Perfect for image transitions

## Implementation Details

### Screen Transitions

All screens now use directional variants:

```tsx
<motion.div
  custom="forward"  // or "backward"
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={screenTransition}
>
```

### Shared Element Animation

The uploaded image smoothly transitions from UploadScreen to ProcessingScreen using `layoutId`:

**UploadScreen:**
```tsx
<motion.img
  layoutId="uploadImage"
  // ... image appears in upload preview
/>
```

**ProcessingScreen:**
```tsx
<motion.img
  layoutId="uploadImage"
  // ... same image morphs into processing thumbnail
/>
```

### Staggered Content

Content reveals progressively using stagger animations:

```tsx
<motion.div variants={staggerContainer} initial="initial" animate="animate">
  <motion.div variants={staggerItem}>First item</motion.div>
  <motion.div variants={staggerItem}>Second item</motion.div>
  <motion.div variants={staggerItem}>Third item</motion.div>
</motion.div>
```

### Interactive Animations

All buttons include hover and tap states:

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

## Updated Screens

### [HomeScreen.tsx](src/screens/HomeScreen.tsx)
- ✅ Page slide transition
- ✅ Staggered content reveal
- ✅ Button hover/tap animations

### [UploadScreen.tsx](src/screens/UploadScreen.tsx)
- ✅ Page slide transition
- ✅ Card scale animation
- ✅ Image preview with AnimatePresence
- ✅ Shared layoutId for image
- ✅ Button interactions

### [ProcessingScreen.tsx](src/screens/ProcessingScreen.tsx)
- ✅ Page slide transition
- ✅ Staggered card reveal
- ✅ Shared layoutId for image continuity
- ✅ Progress bar animation

### [MeshViewerScreen.tsx](src/screens/MeshViewerScreen.tsx)
- ✅ Fade-in transition (no exit animation)
- ✅ Card scale animation
- ✅ 3D canvas fade-in with delay
- ✅ Button hover/tap animations
- ⚠️ **Note:** Exit animation removed to prevent WebGL context loss during screen transitions

### [ErrorScreen.tsx](src/screens/ErrorScreen.tsx)
- ✅ Page slide transition (backward direction)
- ✅ Card scale animation with delay
- ✅ Button interactions

## Animation Flow

### Upload → Processing
1. Page slides left with fade
2. Upload image morphs from preview to thumbnail (layoutId)
3. Processing card staggers in
4. Progress indicators animate

### Processing → 3D Viewer
1. Page slides left with fade
2. Controls card scales in
3. 3D canvas fades in with 200ms delay
4. Smooth transition to interactive model

### Error States
1. Page slides right (backward) with fade
2. Error content staggers in
3. Card emphasizes with scale animation

## Performance

- All animations use GPU-accelerated properties (transform, opacity)
- Framer Motion's optimized layout animations
- No layout thrashing
- Smooth 60fps transitions

### WebGL Context Preservation

The MeshViewerScreen uses a special approach to prevent WebGL context loss:

**Problem:** When AnimatePresence unmounts components during exit animations, the Three.js Canvas loses its WebGL context, causing the 3D model to disappear.

**Solution:** The MeshViewerScreen wraps its content in two layers:
```tsx
<div className="...">  {/* Outer non-animated container */}
  <motion.div>  {/* Inner animated content */}
    {/* Canvas and UI */}
  </motion.div>
</div>
```

The outer `div` is not part of Framer Motion's animation tree, so it stays mounted even when other screens transition. This keeps the WebGL context alive and prevents the blank screen issue.

## Customization

To adjust transition timing, edit [src/utils/transitions.ts](src/utils/transitions.ts):

```tsx
export const screenTransition: Transition = {
  duration: 0.45,  // Adjust speed
  ease: easing.smooth,  // Change easing curve
};
```

To add new animation variants, follow the existing pattern in the transitions file.
