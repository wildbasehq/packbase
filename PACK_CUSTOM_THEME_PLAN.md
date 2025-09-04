# Pack Custom Theme Implementation Plan

## Overview

This plan outlines the implementation of custom CSS theming for Packs, similar to the existing profile theming system. Pack owners will be able to customize the appearance of their Pack when users are viewing it.

## Current Profile Theme System Analysis

The existing profile theming system consists of:

### Frontend Components
- **CustomTheme Component** (`apps/web/src/pages/user/[...slug]/page.tsx:20-49`)
  - Fetches theme data via `vg.user({ username }).theme.get()`
  - Renders combined CSS and HTML using `dangerouslySetInnerHTML`
  - Handles loading states and error cases

### API Layer
- **Theme API Service** (`apps/web/src/lib/api/theme.ts`)
  - CRUD operations for themes
  - Validation endpoint for theme content
  - React hook for theme management

### Backend Implementation
- **Theme Model** (`apps/server/src/models/themes.model.ts`)
  - Schema: `id`, `name`, `html`, `css`, `is_active`
- **User Theme Endpoint** (`apps/server/src/routes/user/[username]/theme.ts`)
  - Fetches active theme for a specific user from `user_themes` table
- **Theme Routes** (`apps/server/src/routes/themes/`)
  - Full CRUD API for theme management
  - Content validation functionality

## Proposed Pack Theme System Architecture

### 1. Database Schema Changes

Create new tables to support Pack themes:

```sql
-- Pack themes table (similar to user_themes)
CREATE TABLE pack_themes (
    id VARCHAR(255) PRIMARY KEY,
    pack_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    html TEXT NOT NULL,
    css TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
    INDEX idx_pack_active_theme (pack_id, is_active)
);
```

### 2. Backend Implementation

#### New API Endpoints
- `GET /pack/[id]/theme` - Get active theme for a pack
- `POST /pack/[id]/theme` - Create new theme for pack (owner only)
- `PUT /pack/[id]/theme/[theme_id]` - Update pack theme (owner only)
- `DELETE /pack/[id]/theme/[theme_id]` - Delete pack theme (owner only)
- `GET /pack/[id]/themes` - List all themes for pack (owner only)
- `POST /pack/[id]/theme/validate` - Validate theme content

#### Permission System
- Extend existing pack permissions to include theme management
- Only pack owners (users with `owner_id === userId`) can manage themes
- Public read access for active themes

#### Models
```typescript
// apps/server/src/models/pack-themes.model.ts
export const PackTheme = t.Object({
    id: t.Optional(t.String()),
    pack_id: t.String(),
    name: t.String(),
    html: t.String(),
    css: t.String(),
    is_active: t.Optional(t.Boolean())
})
```

### 3. Frontend Implementation

Rewrite <CustomTheme /> to also support Pack IDs.

#### Pack Layout Integration
Modify `apps/web/src/pages/pack/[slug]/layout.tsx` to include theme component:
```typescript
// Add after line 165, before children
{currentResource && (
    <CustomTheme packId={currentResource.id} />
)}
{children}
```

#### API Integration
Extend `vg.pack` SDK methods:
```typescript
// Add to VoyageSDK pack methods
vg.pack({ id }).theme.get()
vg.pack({ id }).theme.create(themeData)
vg.pack({ id }).theme.update(id, themeData)
vg.pack({ id }).theme.delete(id)
vg.pack({ id }).themes.get() // List all themes
```

#### Theme Management UI
Create pack settings page for theme management:
```typescript
// apps/web/src/pages/pack/[slug]/settings/themes/page.tsx
// Similar to existing theme management but for pack owners
// Include theme editor, preview, and activation controls
```

### 4. Security Considerations

#### Content Validation
- Reuse existing theme validation system (`apps/server/src/lib/themes/validateThemeContent.ts`)
- Sanitize HTML content to prevent XSS attacks
- Restrict dangerous CSS properties and external resources
- Validate CSS syntax and prevent malicious injections

#### Access Control
- Verify pack ownership before allowing theme modifications
- Rate limiting on theme updates to prevent abuse
- Content size limits for HTML and CSS

#### Scope Isolation
- Ensure pack themes only affect the pack's content area
- Prevent themes from modifying global site navigation or user interface
- CSS scoping to prevent conflicts with main site styles

### 5. Implementation Steps

1. **Database Migration**
   - Create `pack_themes` table
   - Add necessary indexes

2. **Backend API Development**
   - Create pack theme routes and controllers
   - Implement permission checks
   - Add theme validation

3. **Frontend Components**
   - Create `CustomPackTheme` component
   - Integrate into pack layout
   - Extend API client methods

4. **Theme Management UI**
   - Pack settings page for theme management
   - Theme editor with preview functionality
   - Theme activation/deactivation controls

5. **Testing & Validation**
   - Unit tests for API endpoints
   - Integration tests for theme rendering
   - Security testing for content validation

6. **Documentation & Migration**
   - Update API documentation
   - Create user guides for pack owners
   - Plan rollout strategy

### 6. Technical Considerations

#### Performance
- Cache active themes to reduce database queries
- Implement theme preloading for faster rendering
- Consider CDN storage for theme assets

#### Backwards Compatibility
- Ensure existing packs continue to work without themes
- Graceful fallback when theme loading fails
- Progressive enhancement approach

#### Maintenance
- Theme version history for rollback capability
- Bulk theme operations for administrators
- Analytics on theme usage and performance

## Conclusion

This implementation will provide pack owners with powerful customization capabilities while maintaining security and performance standards. The system leverages the proven profile theme architecture while extending it specifically for pack-based theming needs.

Key benefits:
- Consistent with existing profile theming patterns
- Secure content validation and access control
- Owner-controlled customization
- Scalable architecture for future enhancements

The implementation should be done incrementally, starting with backend infrastructure and moving to frontend integration, ensuring thorough testing at each stage.