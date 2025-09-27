# @reporunner/ui

A comprehensive UI component library with flexible and reusable components for building modern web applications.

## Features

- 🎨 Flexible styling system based on Tailwind CSS
- 🔧 Highly customizable components with variants and states
- 📦 Modern React patterns and hooks
- 🛡️ Written in TypeScript with complete type definitions
- 🧩 Composable component system with HOC utilities
- 📚 Comprehensive documentation and examples

## Installation

```bash
# Using npm
pnpm add @reporunner/ui

# Using yarn
yarn add @reporunner/ui

# Using pnpm
pnpm add @reporunner/ui
```

## Basic Usage

```tsx
import { Button, FormField } from '@reporunner/ui';

function MyComponent() {
  return (
    <div>
      <FormField
        name="email"
        label="Email"
        type="email"
        required
        placeholder="Enter your email"
      />
      <Button
        color="primary"
        size="md"
        variant="filled"
        onClick={() => console.log('Clicked!')}
      >
        Submit
      </Button>
    </div>
  );
}
```

## Components

### Base Components

- `Button` - Multi-purpose button component with variants and states
- `FormField` - Form input component with validation and states
- `Dialog` - Modal dialog component with animations

### Hooks

- `useDisclosure` - Manage show/hide states
- `useDebounce` - Debounce value changes
- `usePrevious` - Track previous values
- `useEventListener` - Handle DOM events
- `useAsync` - Manage async operations

### HOC Utilities

The library includes several HOC utilities for composing components:

```tsx
import { withProps, withStyles, withLoading, withError, withAsync } from '@reporunner/ui';

// Create a button with default props
const PrimaryButton = withProps({
  color: 'primary',
  variant: 'filled',
})(Button);

// Add custom styles
const StyledButton = withStyles('px-6 py-3 rounded-full')(Button);

// Add loading state
const LoadingButton = withLoading()(Button);

// Compose multiple HOCs
const EnhancedButton = composeHOCs(
  withProps({ color: 'primary' }),
  withStyles('rounded-full'),
  withLoading(),
  withError()
)(Button);
```

### Styling

The library uses Tailwind CSS for styling. Components accept className props for customization:

```tsx
<Button
  className="hover:shadow-lg transform hover:-translate-y-1 transition-all"
  color="primary"
>
  Animated Button
</Button>
```

### Advanced Usage

#### Form Fields with Validation

```tsx
<FormField
  name="email"
  label="Email"
  type="email"
  required
  helperText="We'll never share your email"
  errorMessage={errors.email}
  startAdornment={<EmailIcon />}
  endAdornment={<ValidIcon />}
/>
```

#### Dialog with Custom Animation

```tsx
const variants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  content: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  }
};

<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Welcome"
  description="This is a custom animated dialog"
  variants={variants}
  maxWidth="md"
  footer={
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  }
>
  Dialog content here
</Dialog>
```

#### Using Hooks

```tsx
function SearchInput() {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 500);
  const prevValue = usePrevious(value);

  useEffect(() => {
    if (debouncedValue !== prevValue) {
      // Perform search
    }
  }, [debouncedValue]);

  return (
    <FormField
      name="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

## Contributing

Contributions are welcome! Please read our contributing guide to learn about our development process.

## License

This project is licensed under the MIT License - see the LICENSE file for details.