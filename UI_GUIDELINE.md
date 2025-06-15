# Wildbase UI/UX Styleguide

This document serves as a comprehensive guide for UI/UX design in the Wildbase project. It establishes consistent standards for design elements, components, and patterns to ensure a cohesive user experience across the application. This guide is intended for both developers implementing the UI and designers creating mockups in Figma.

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing and Layout](#spacing-and-layout)
4. [Components](#components)
5. [Animations](#animations)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)
8. [Dark Mode](#dark-mode)
9. [Design Principles](#design-principles)
10. [Figma Guidelines](#figma-guidelines)

## Colors

### Primary Colors

These colors form the foundation of our brand identity:

- **Ice White**: `rgb(245 246 252)` - Used for backgrounds in light mode
- **Cosmos**: `oklch(40% 0.275 282)` - Primary brand color, used for buttons, links, and accents
- **Midnight**: `rgb(20 20 26)` - Used for backgrounds in dark mode
- **Lime**: `rgb(206 255 28)` - Secondary brand color, used for highlights and accents

### Accent Colors

- **Accent 1**: `rgb(216 76 16)` - Used for call-to-action elements
- **Accent 5**: `rgb(221 167 63)` - Used for secondary accents

### Neutral Colors

Our neutral palette provides a range of grays for UI elements:

- **N-1**: `rgb(237 239 247)` - Lightest neutral, used for subtle backgrounds
- **N-2**: `rgb(211 214 224)` - Used for light borders and dividers
- **N-3**: `rgb(188 191 204)` - Used for disabled elements
- **N-4**: `rgb(164 169 187)` - Used for secondary text
- **N-5**: `rgb(110 113 128)` - Used for placeholder text
- **N-6**: `rgb(64 66 77)` - Used for secondary text in dark mode
- **N-7**: `rgb(38 38 40)` - Used for card backgrounds in dark mode
- **N-8**: `rgb(30 30 32)` - Used for elevated surfaces in dark mode
- **N-9**: `var(--color-primary-midnight)` - Darkest neutral, used for text in light mode

### Semantic Colors

- **Destructive**: `rgb(233 38 58)` - Used for error states and destructive actions
- **Destructive Foreground**: `hsl(0 0% 98%)` - Text color on destructive backgrounds

### Component Colors

- **Background**: Light mode: `hsl(0 0% 100%)`, Dark mode: `hsl(240 10% 3.9%)`
- **Foreground**: Light mode: `hsl(240 10% 3.9%)`, Dark mode: `hsl(0 0% 98%)`
- **Card**: Light mode: `hsl(0 0% 100%)`, Dark mode: `hsl(240 10% 3.9%)`
- **Card Foreground**: Light mode: `hsl(240 10% 3.9%)`, Dark mode: `hsl(0 0% 98%)`
- **Popover**: Light mode: `hsl(0 0% 100%)`, Dark mode: `hsl(240 10% 3.9%)`
- **Popover Foreground**: Light mode: `hsl(240 10% 3.9%)`, Dark mode: `hsl(0 0% 98%)`
- **Muted**: Light mode: `hsl(240 4.8% 95.9%)`, Dark mode: `hsl(240 3.7% 15.9%)`
- **Muted Foreground**: Light mode: `hsl(240 3.8% 46.1%)`, Dark mode: `hsl(240 5% 64.9%)`
- **Accent**: Light mode: `hsl(240 4.8% 95.9%)`, Dark mode: `hsl(240 3.7% 15.9%)`
- **Accent Foreground**: Light mode: `hsl(240 5.9% 10%)`, Dark mode: `hsl(0 0% 98%)`
- **Border**: Light mode: `hsl(240 5.9% 90%)`, Dark mode: `hsl(240 3.7% 15.9%)`
- **Input**: Light mode: `hsl(240 5.9% 90%)`, Dark mode: `hsl(240 3.7% 15.9%)`
- **Ring**: Light mode: `hsl(240 10% 3.9%)`, Dark mode: `hsl(240 4.9% 83.9%)`

### Color Usage Guidelines

1. **Text Contrast**: Ensure text has sufficient contrast against its background (minimum 4.5:1 for normal text, 3:1 for large text)
2. **Color Meaning**: Use colors consistently to convey meaning (e.g., destructive for delete actions)
3. **Accent Sparingly**: Use accent colors sparingly to highlight important elements
4. **Neutral Base**: Build interfaces primarily with neutral colors, using brand colors for emphasis

## Typography

### Font Families

- **Primary Font**: Lexend (`var(--font-lexend)`)
- **Secondary Font**: Wildbase (`var(--font-wildbase)`)

### Font Sizes

- **XXS**: `0.6rem` - Used for very small labels and metadata
- **XS**: `0.7rem` - Used for small labels and metadata
- **SM**: `0.8rem` - Used for secondary text and labels
- **Base**: `0.95rem` - Default text size for body content
- **LG**: `1.05rem` - Used for emphasized body text
- **XL**: `1.15rem` - Used for subheadings
- **2XL**: `1.4rem` - Used for section headings
- **3XL**: `1.75rem` - Used for page headings
- **4XL**: `2.1rem` - Used for major headings
- **5XL**: `2.8rem` - Used for hero headings

### Font Weights

- **Normal**: `400` - Used for body text
- **Medium**: `500` - Used for semi-emphasized text
- **Semibold**: `600` - Used for headings and emphasized text
- **Bold**: `700` - Used for strong emphasis and primary headings

### Line Heights

- **None**: `1` - Used for headings where tight spacing is needed
- **Tight**: `1.25` - Used for headings
- **Snug**: `1.375` - Used for short paragraphs
- **Normal**: `1.5` - Default for body text
- **Relaxed**: `1.625` - Used for longer paragraphs
- **Loose**: `2` - Used for content that needs more vertical spacing

### Letter Spacing

- **Tighter**: `-0.05em` - Used for large headings
- **Tight**: `-0.025em` - Used for headings
- **Normal**: `0em` - Default for body text
- **Wide**: `0.025em` - Used for small caps and some UI elements
- **Wider**: `0.05em` - Used for emphasis in UI elements
- **Widest**: `0.1em` - Used for all-caps text

### Typography Usage Guidelines

1. **Hierarchy**: Establish clear hierarchy with font sizes and weights
2. **Consistency**: Use consistent text styles for similar elements
3. **Readability**: Ensure text is readable with appropriate line height and spacing
4. **Responsive Sizing**: Adjust font sizes for different screen sizes

## Spacing and Layout

### Spacing Scale

Our spacing system uses a consistent scale based on 0.25rem (4px) increments:

- **0**: `0px`
- **px**: `1px`
- **0.5**: `0.125rem` (2px)
- **1**: `0.25rem` (4px)
- **1.5**: `0.375rem` (6px)
- **2**: `0.5rem` (8px)
- **2.5**: `0.625rem` (10px)
- **3**: `0.75rem` (12px)
- **3.5**: `0.875rem` (14px)
- **4**: `1rem` (16px)
- **5**: `1.25rem` (20px)
- **6**: `1.5rem` (24px)
- **7**: `1.75rem` (28px)
- **8**: `2rem` (32px)
- **9**: `2.25rem` (36px)
- **10**: `2.5rem` (40px)
- **11**: `2.75rem` (44px)
- **12**: `3rem` (48px)
- **14**: `3.5rem` (56px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)
- **24**: `6rem` (96px)
- **28**: `7rem` (112px)
- **32**: `8rem` (128px)
- **36**: `9rem` (144px)
- **40**: `10rem` (160px)
- **44**: `11rem` (176px)
- **48**: `12rem` (192px)
- **52**: `13rem` (208px)
- **56**: `14rem` (224px)
- **60**: `15rem` (240px)
- **64**: `16rem` (256px)
- **72**: `18rem` (288px)
- **80**: `20rem` (320px)
- **96**: `24rem` (384px)

### Border Radius

- **Default**: `0.375rem` - Used for most UI elements

### Breakpoints

- **XS**: `20rem` (320px) - Small mobile devices
- **SM**: `36rem` (576px) - Mobile devices
- **MD**: `48rem` (768px) - Tablets
- **LG**: `62rem` (992px) - Laptops
- **XL**: `75rem` (1200px) - Desktops
- **2XL**: `87.5rem` (1400px) - Large desktops

### Aspect Ratios

- **Banner**: `3 / 1` - Used for header images
- **Video**: `16 / 9` - Used for video content
- **Square**: `1 / 1` - Used for profile pictures and thumbnails

### Layout Guidelines

1. **Consistent Spacing**: Use the spacing scale consistently for margins and padding
2. **Responsive Containers**: Use the container utility for responsive page widths
3. **Grid System**: Use Tailwind's grid system for complex layouts
4. **Whitespace**: Use ample whitespace to improve readability and focus

## Components

### Buttons

Buttons follow a consistent style with variants for different purposes:

#### Primary Button
```html
<Button>
    Save
</Button>
```

#### Secondary Button
```html
<Button outline>
    Cancel
</Button>
```

#### Destructive Button
```html
<Button color="red">
    Delete
</Button>
```

#### Ghost Button
```html
<Button plain>
    More Options
</Button>
```

### Form Elements

Form elements use consistent styling for inputs, labels, and validation:

#### Input Field
```html
<Field>
    <Label>Display Name</Label>
    <Input name="display_name" />
</Field>
```

#### Textarea
```html
<Field>
    <Label>About Me</Label>
    <Textarea name="bio" />
</Field>
```

#### File Upload
```html
<div className="relative mt-2 flex aspect-banner items-center justify-center overflow-hidden rounded border-2 border-dashed bg-card px-6 py-10">
    <div className="items-center justify-center text-center">
        <PhotoIcon className="text-alt mx-auto h-12 w-12" aria-hidden="true" />
        <div className="text-alt mt-4 flex select-none text-sm leading-6">
            <p className="pl-1">Upload a file</p>
        </div>
        <p className="text-alt select-none text-xs leading-5">PNG, JPG, GIF up to 10MB</p>
    </div>
</div>
<input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" />
```

### Cards

Cards are used to group related content:

```html
<div className="rounded-lg border bg-card p-4 shadow-sm">
    <h3 className="text-lg font-semibold">Card Title</h3>
    <p className="text-muted-foreground">Card content goes here.</p>
</div>
```

### Navigation

Navigation elements follow consistent patterns:

#### User Dropdown
```html
<UserButton>
    <UserButton.MenuItems>
        <UserButton.Action label="Your Profile" labelIcon={<UserIcon />} onClick={() => setLocation(`/@${user.username}`)} />
    </UserButton.MenuItems>
</UserButton>
```

## Animations

### Animation Durations

- **75ms**: Very fast, used for micro-interactions
- **100ms**: Fast, used for simple transitions
- **150ms**: Quick, used for hover effects
- **200ms**: Standard, used for most UI transitions
- **300ms**: Medium, used for more noticeable transitions
- **500ms**: Slow, used for emphasis
- **700ms**: Very slow, used for dramatic effects
- **1000ms**: Extended, used for major transitions

### Animation Easings

- **Linear**: `linear` - Consistent speed from start to finish
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` - Starts slow, ends fast
- **Ease Out**: `cubic-bezier(0, 0, 0.2, 1)` - Starts fast, ends slow
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - Starts and ends slow, fast in the middle
- **Snapper**: `cubic-bezier(0, 1.25, 0, 1)` - Overshoots slightly before settling

### Animation Presets

- **Fade Up**: Elements fade in while moving up
- **Fade Down**: Elements fade in while moving down
- **Slide Up Fade**: Elements slide up and fade in
- **Slide Down Fade**: Elements slide down and fade in
- **Shimmer**: Creates a shimmering effect for loading states
- **Accordion**: Smooth height transitions for accordion elements

### Animation Usage Guidelines

1. **Purpose**: Use animations purposefully to enhance the user experience
2. **Subtlety**: Keep animations subtle and not distracting
3. **Performance**: Optimize animations for performance (prefer transforms and opacity)
4. **Reduced Motion**: Provide alternatives for users who prefer reduced motion

## Responsive Design

### Responsive Principles

1. **Mobile First**: Design for mobile first, then enhance for larger screens
2. **Fluid Layouts**: Use fluid layouts that adapt to different screen sizes
3. **Breakpoints**: Use consistent breakpoints for responsive adjustments
4. **Testing**: Test designs across multiple devices and screen sizes

### Responsive Utilities

#### Container
```css
.container {
    margin-inline: auto;
    padding-inline: var(--spacing-8);
    
    @media (min-width: 87.5rem) {
        max-width: 87.5rem;
    }
}
```

#### Responsive Padding
```css
.p-responsive {
    padding: var(--spacing-4);
    
    @media (min-width: 48rem) {
        padding: var(--spacing-6);
    }
    
    @media (min-width: 62rem) {
        padding: var(--spacing-8);
    }
}
```

## Accessibility

### Accessibility Guidelines

1. **Color Contrast**: Ensure sufficient contrast between text and background
2. **Keyboard Navigation**: Make all interactive elements accessible via keyboard
3. **Screen Readers**: Provide appropriate ARIA labels and roles
4. **Focus States**: Design clear focus states for interactive elements
5. **Alternative Text**: Include alt text for all images
6. **Reduced Motion**: Respect user preferences for reduced motion

## Dark Mode

### Dark Mode Implementation

Our application supports both light and dark modes with consistent styling:

```css
:root {
    /* Light mode variables */
    --background: hsl(0 0% 100%);
    --foreground: hsl(240 10% 3.9%);
    /* Other light mode variables */
}

.dark {
    /* Dark mode variables */
    --background: hsl(240 10% 3.9%);
    --foreground: hsl(0 0% 98%);
    /* Other dark mode variables */
}
```

### Dark Mode Guidelines

1. **Contrast**: Maintain appropriate contrast in both modes
2. **Color Shifts**: Adjust colors appropriately for dark mode (not just inverting)
3. **User Preference**: Respect user's system preference for color scheme
4. **Testing**: Test all UI components in both light and dark modes

## Design Principles

### Core Principles

1. **Consistency**: Maintain consistent design patterns throughout the application
2. **Simplicity**: Keep designs simple and focused on user goals
3. **Hierarchy**: Establish clear visual hierarchy to guide users
4. **Feedback**: Provide clear feedback for user actions
5. **Accessibility**: Design for all users, regardless of abilities

## Figma Guidelines

### Figma Setup

1. **Color Styles**: Use Figma color styles that match our CSS variables
2. **Text Styles**: Create text styles for all typography combinations
3. **Component Library**: Build and maintain a component library in Figma
4. **Grid System**: Use a consistent grid system that matches our implementation
5. **Naming Convention**: Follow consistent naming for all design elements

### Design Handoff

1. **Specs**: Include detailed specs for spacing, sizing, and positioning
2. **Assets**: Export all necessary assets in appropriate formats
3. **Interactions**: Document interactive behaviors and animations
4. **Responsive Variants**: Provide designs for different breakpoints
5. **Documentation**: Include notes for complex components or interactions

---

This styleguide is a living document and will be updated as our design system evolves. For questions or suggestions, please contact the design team.