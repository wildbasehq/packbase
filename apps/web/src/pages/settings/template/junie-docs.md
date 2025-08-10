# Themes API Documentation

This documentation provides a comprehensive guide to the `/src/routes/themes` functionality, which allows users to
create, manage, and customize themes for their profiles or applications.

## Overview

The Themes API enables users to:

- Create custom themes with HTML and CSS
- Retrieve all themes associated with their account
- Update existing themes
- Delete themes
- Validate theme content before saving
- Set a theme as active (only one theme can be active at a time)

## Theme Model

A theme consists of the following properties:

```typescript
{
    id: string(optional, auto - generated),
        name
:
    string,
        html
:
    string,
        css
:
    string,
        is_active
:
    boolean(optional)
}
```

## API Endpoints

### 1. Get All Themes

**Endpoint:** `GET /themes`

**Description:** Retrieves all themes belonging to the authenticated user.

**Authentication:** Required

**Response:**

- 200: Array of Theme objects
- 401: Unauthorized (user not logged in)
- 500: Server error

### 2. Create Theme

**Endpoint:** `POST /themes`

**Description:** Creates a new theme for the authenticated user.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "My Theme",
  "html": "<div class=\"container\">...</div>",
  "css": ".container { ... }",
  "is_active": true
}
```

**Response:**

- 200: Created Theme object
- 400: Bad request (invalid content)
- 401: Unauthorized (user not logged in)
- 500: Server error

**Note:** If `is_active` is set to true, all other themes will be automatically set to inactive.

### 3. Update Theme

**Endpoint:** `PUT /themes/[id]`

**Description:** Updates an existing theme.

**Authentication:** Required

**URL Parameters:**

- `id`: The ID of the theme to update

**Request Body:** Any combination of theme properties to update

```json
{
  "name": "Updated Theme Name",
  "html": "<div class=\"updated\">...</div>",
  "css": ".updated { ... }",
  "is_active": true
}
```

**Response:**

- 200: Updated Theme object
- 400: Bad request (invalid content)
- 401: Unauthorized (user not logged in)
- 404: Theme not found or doesn't belong to user
- 500: Server error

**Note:** If `is_active` is set to true, all other themes will be automatically set to inactive.

### 4. Delete Theme

**Endpoint:** `DELETE /themes/[id]`

**Description:** Deletes a theme.

**Authentication:** Required

**URL Parameters:**

- `id`: The ID of the theme to delete

**Response:**

- 200: `{ "success": true }`
- 401: Unauthorized (user not logged in)
- 404: Theme not found or doesn't belong to user
- 500: Server error

### 5. Validate Theme Content

**Endpoint:** `POST /themes/validate`

**Description:** Validates theme HTML and CSS without saving it. Useful for real-time validation in editors.

**Authentication:** Required

**Request Body:**

```json
{
  "html": "<div class=\"container\">...</div>",
  "css": ".container { ... }"
}
```

**Response:**

- 200: Validation result
  ```json
  {
    "isValid": true|false,
    "html": "sanitized HTML",
    "css": "sanitized CSS",
    "htmlIssue": "error message if any",
    "cssIssue": "error message if any"
  }
  ```
- 401: Unauthorized (user not logged in)

## Theme Content Validation

The API enforces strict validation and sanitization of theme content:

### HTML Validation

- Only allows specific HTML tags: `div`, `span`, `p`, `h1`-`h6`, `ul`, `ol`, `li`, `a`, `img`, `section`, `article`,
  `header`, `footer`, `nav`, `main`, `aside`, 'style'
- Only allows specific attributes: `id`, `class`, `style`, `src`, `alt`, `href`, `target`, `rel`
- Sanitizes HTML using DOMPurify
- Rejects content if too many unsafe elements are detected (more than 30% of content)

### CSS Validation

- Sanitizes CSS to prevent unsafe properties and values
- Rejects content if too many unsafe properties are detected (more than 30% of content)

## UI Implementation Guidelines

When implementing a UI for theme management, consider the following components:

1. **Theme List View**
    - Display all user themes with name and active status
    - Include options to edit, delete, and set as active
    - Add a "Create New Theme" button

2. **Theme Editor**
    - Provide separate editors for HTML and CSS with syntax highlighting
    - Implement real-time validation using the `/themes/validate` endpoint
    - Show a live preview of the theme
    - Include save and cancel buttons

3. **Theme Preview**
    - Display a rendered preview of the theme using the HTML and CSS
    - Update in real-time as the user edits

4. **Validation Feedback**
    - Show clear error messages for invalid HTML or CSS
    - Highlight problematic sections in the code

5. **Theme Activation**
    - Provide a toggle or radio button to set a theme as active
    - Clearly indicate which theme is currently active

## Example Usage

### Creating a Theme Editor Component

```jsx
function ThemeEditor() {
    const [theme, setTheme] = useState({name: '', html: '', css: '', is_active: false});
    const [validation, setValidation] = useState({isValid: true});

    // Validate theme content in real-time
    const validateContent = async () => {
        const response = await fetch('/themes/validate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({html: theme.html, css: theme.css})
        });

        if (response.ok) {
            const result = await response.json();
            setValidation(result);
        }
    };

    // Save theme
    const saveTheme = async () => {
        const response = await fetch('/themes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(theme)
        });

        if (response.ok) {
            // Handle success
        }
    };

    return (
        <div>
            {/* Theme form and editors */}
            {/* Live preview */}
            {/* Validation feedback */}
        </div>
    );
}
```

This documentation should provide a comprehensive guide for implementing the UI for theme management.