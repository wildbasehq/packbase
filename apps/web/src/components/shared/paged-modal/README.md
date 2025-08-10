# PagedModal Component

A reusable modal component with sidebar navigation and content pages. This component allows for custom headers, sidebar items, and footers.

## Features

- Declarative API for defining pages
- Custom header and footer support
- Automatic page registration and navigation
- Support for icons, badges, and descriptions for sidebar items
- Fully typed with TypeScript
- Responsive design

## Installation

The component is part of the shared components library and can be imported directly:

```tsx
import PagedModal from '@/components/shared/paged-modal';
```

## Usage

### Basic Usage

```tsx
import PagedModal from '@/components/shared/paged-modal';
import { HomeIcon, CogIcon } from '@heroicons/react/24/outline';

const MyComponent = () => {
  return (
    <PagedModal>
      <PagedModal.Page 
        title="Home" 
        icon={HomeIcon}
        description="Dashboard and overview"
      >
        <div className="p-6">
          <h1>Home Page</h1>
          <p>This is the home page content.</p>
        </div>
      </PagedModal.Page>

      <PagedModal.Page 
        title="Settings" 
        icon={CogIcon}
        description="Configure your application settings"
      >
        <div className="p-6">
          <h1>Settings Page</h1>
          <p>This is the settings page content.</p>
        </div>
      </PagedModal.Page>
    </PagedModal>
  );
};
```

### With Custom Header and Footer

```tsx
import PagedModal from '@/components/shared/paged-modal';
import { Heading } from '@/components/shared/heading';
import { Text } from '@/components/shared/text';
import { UserIcon } from '@heroicons/react/24/outline';

const MyComponent = () => {
  // Custom header component
  const CustomHeader = (
    <div>
      <Heading className="text-lg font-medium">My Application</Heading>
      <Text className="text-sm text-gray-500 dark:text-gray-400">Configure your settings</Text>
    </div>
  );

  // Custom footer component
  const CustomFooter = (
    <div className="flex items-center">
      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
        <UserIcon className="h-5 w-5" />
      </div>
      <div className="ml-2">
        <Text className="text-sm font-medium">John Doe</Text>
        <Text className="text-xs text-alt">@johndoe</Text>
      </div>
    </div>
  );

  return (
    <PagedModal
      header={CustomHeader}
      footer={CustomFooter}
    >
      {/* Pages go here */}
    </PagedModal>
  );
};
```

## API Reference

### PagedModal

The main container component.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | The content of the modal, typically PagedModal.Page components |
| `className` | `string` | Optional additional CSS classes |
| `header` | `ReactNode` | Optional custom header for the sidebar |
| `footer` | `ReactNode` | Optional custom footer for the sidebar |

### PagedModal.Page

The component for defining individual pages.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | The content of the page |
| `id` | `string` | Optional unique identifier for the page (defaults to lowercase title with spaces replaced by hyphens) |
| `title` | `string` | The title of the page, displayed in the sidebar |
| `description` | `string \| ReactNode` | Optional description displayed under the title in the sidebar |
| `icon` | `React.ElementType` | Optional icon component to display next to the title |
| `badge` | `string` | Optional badge text to display next to the title |

## Examples

See the `example.tsx` file for a complete example of how to use the PagedModal component with various configurations.

## Styling

The component uses Tailwind CSS for styling. You can customize the appearance by:

1. Passing additional classes via the `className` prop
2. Modifying the component's internal styles in the source code
3. Overriding styles with more specific selectors in your CSS

## Accessibility

The component is designed with accessibility in mind:

- Proper focus management
- Semantic HTML structure
- Support for keyboard navigation
- ARIA attributes for screen readers