# Carousel Component Usage Guide

## Overview

The new comprehensive Carousel component supports multiple layout types, indicator styles, and advanced configuration options. It's fully integrated into the section editor system.

## Features

### Layout Types

1. **Single** - One item visible at a time (default)
2. **Multi** - Multiple items visible (configurable per breakpoint)
3. **Centered** - Active item centered with partial previous/next slides visible
4. **Full Width** - Slide occupies entire viewport width
5. **Thumbnail** - Main carousel synced with a thumbnail navigation strip

### Indicator Types

1. **Dots** - Dot indicators (default)
2. **Progress** - Progress bar indicator
3. **Numbered** - Numbered indicators (e.g., 1 / 5)
4. **Arrows Only** - No indicators, navigation arrows only

### Additional Features

- ✅ Responsive breakpoints (mobile, tablet, desktop)
- ✅ Smooth CSS transitions
- ✅ Touch/swipe gesture support
- ✅ Mouse drag support
- ✅ Keyboard navigation (arrow keys, tab focus)
- ✅ Lazy loading ready
- ✅ Auto-play with pause on hover/focus
- ✅ Infinite loop support
- ✅ Configurable gap between items
- ✅ Customizable transition duration

## Usage in Section Editor

### Step 1: Select Carousel Layout

1. Open a section in the Section Editor
2. Select **CAROUSEL** from the Layout Type dropdown
3. Navigate to the **Settings** tab in the Content Editor

### Step 2: Configure Carousel

In the Settings tab, you'll find the **Carousel Configuration** panel with the following options:

#### Layout Type
- Choose from: Single, Multi, Centered, Full Width, or Thumbnail

#### Items Per View (for Multi/Centered layouts)
- **Desktop**: Number of items visible on desktop (1-6)
- **Tablet**: Number of items visible on tablet (1-4)
- **Mobile**: Number of items visible on mobile (1-2)

#### Indicator Type
- Choose from: Dots, Progress, Numbered, or Arrows Only

#### Auto-Play Settings
- **Enable Auto-Play**: Toggle automatic slide advancement
- **Interval**: Time between slides in milliseconds (minimum: 1000ms)
- **Pause on Hover**: Pause auto-play when hovering over carousel

#### Navigation Settings
- **Show Navigation Arrows**: Toggle left/right arrow buttons
- **Show Indicators**: Toggle indicator display
- **Infinite Loop**: Enable/disable looping through slides

#### Advanced Settings
- **Transition Duration**: Animation duration in milliseconds (100-2000ms)
- **Gap Between Items**: Spacing between items in pixels (0-48px)
- **Center Slides** (Centered layout only): Center the active slide
- **Show Partial Previous/Next** (Centered layout only): Show partial visibility of adjacent slides

## Code Usage

### Direct Component Usage

```tsx
import { Carousel } from '../ui/carousel';
import type { CarouselConfig } from '../../types';

const items = [
  <div>Slide 1</div>,
  <div>Slide 2</div>,
  <div>Slide 3</div>,
];

const config: CarouselConfig = {
  layoutType: 'multi',
  indicatorType: 'dots',
  itemsPerView: 3,
  itemsPerViewTablet: 2,
  itemsPerViewMobile: 1,
  autoPlay: true,
  interval: 5000,
  pauseOnHover: true,
  loop: true,
  showArrows: true,
  showIndicators: true,
  transitionDuration: 500,
  gap: 16,
};

<Carousel items={items} config={config} />
```

### With Custom Item Rendering

```tsx
<Carousel
  items={items}
  config={config}
  renderItem={(item, index, isActive) => (
    <div className={isActive ? 'active' : ''}>
      {item}
    </div>
  )}
/>
```

## Configuration Examples

### Single Item Carousel with Dots
```tsx
{
  layoutType: 'single',
  indicatorType: 'dots',
  itemsPerView: 1,
  autoPlay: true,
  interval: 5000,
}
```

### Multi-Item Carousel with Progress Bar
```tsx
{
  layoutType: 'multi',
  indicatorType: 'progress',
  itemsPerView: 3,
  itemsPerViewTablet: 2,
  itemsPerViewMobile: 1,
  autoPlay: false,
  gap: 24,
}
```

### Centered Carousel with Numbered Indicators
```tsx
{
  layoutType: 'centered',
  indicatorType: 'numbered',
  itemsPerView: 1,
  centeredSlides: true,
  partialVisible: true,
  autoPlay: true,
  interval: 4000,
}
```

### Thumbnail Carousel
```tsx
{
  layoutType: 'thumbnail',
  indicatorType: 'arrows-only',
  itemsPerView: 1,
  showIndicators: false,
  autoPlay: false,
}
```

### Full-Width Hero Carousel
```tsx
{
  layoutType: 'full-width',
  indicatorType: 'dots',
  itemsPerView: 1,
  autoPlay: true,
  interval: 6000,
  pauseOnHover: true,
}
```

## Accessibility

The carousel component includes:

- **Keyboard Navigation**: Arrow keys (← →) to navigate, Tab to focus indicators
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus Management**: Focus indicators on interactive elements
- **Touch Support**: Swipe gestures for mobile devices

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Touch and mouse input support

## Performance Considerations

- Uses CSS transforms for smooth animations (GPU accelerated)
- Lazy loading ready (items can be loaded on demand)
- Efficient re-renders with React hooks
- Responsive breakpoints calculated once per resize

## Troubleshooting

### Carousel not showing
- Ensure items array is not empty
- Check that `itemsPerView` is less than or equal to items.length

### Auto-play not working
- Verify `autoPlay` is set to `true`
- Check that `interval` is at least 1000ms
- Ensure there are more items than `itemsPerView`

### Transitions not smooth
- Increase `transitionDuration` (default: 500ms)
- Check browser support for CSS transforms

### Indicators not showing
- Verify `showIndicators` is `true`
- Check that `indicatorType` is not `'arrows-only'`

## Integration with Section System

The carousel configuration is stored in `SectionContent.carouselConfig` and is automatically:

1. Saved when section is saved
2. Loaded when section is edited
3. Applied when section is rendered
4. Backward compatible with legacy `autoPlay` and `interval` settings

## Migration from Legacy Carousel

Existing sections with `autoPlay` and `interval` settings will continue to work. The new carousel component will:

1. Use `carouselConfig` if present
2. Fall back to `autoPlay` and `interval` if `carouselConfig` is missing
3. Apply default settings for other options

To migrate:
1. Edit the section
2. Go to Settings tab
3. Configure carousel settings (this will create `carouselConfig`)
4. Save the section

