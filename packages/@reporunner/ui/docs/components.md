# Component Documentation

## Button

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Button size |
| color | 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info' | 'primary' | Button color theme |
| variant | 'filled' \| 'outlined' \| 'ghost' \| 'text' | 'filled' | Button variant style |
| disabled | boolean | false | Whether the button is disabled |
| loading | boolean | false | Whether to show loading state |
| fullWidth | boolean | false | Whether the button takes full width |
| showSpinner | boolean | true | Whether to show loading spinner |
| startIcon | ReactNode | undefined | Icon to show before content |
| endIcon | ReactNode | undefined | Icon to show after content |

### Examples

```tsx
// Basic button
<Button>Click me</Button>

// Primary button with loading state
<Button
  color="primary"
  loading={true}
  onClick={() => console.log('clicked')}
>
  Loading
</Button>

// Ghost button with icon
<Button
  variant="ghost"
  color="secondary"
  startIcon={<Icon />}
>
  With Icon
</Button>
```

## FormField

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | required | Field name |
| label | string | undefined | Field label |
| type | 'text' \| 'password' \| 'email' \| 'number' \| 'tel' \| 'url' \| 'search' | 'text' | Input type |
| helperText | string | undefined | Helper text below field |
| errorMessage | string | undefined | Error message |
| required | boolean | false | Whether the field is required |
| disabled | boolean | false | Whether the field is disabled |
| readOnly | boolean | false | Whether the field is read-only |
| placeholder | string | undefined | Input placeholder |
| multiline | boolean | false | Whether to render as textarea |
| rows | number | 3 | Number of textarea rows |
| startAdornment | ReactNode | undefined | Content before input |
| endAdornment | ReactNode | undefined | Content after input |

### Examples

```tsx
// Basic text input
<FormField
  name="username"
  label="Username"
  placeholder="Enter username"
/>

// Email input with validation
<FormField
  name="email"
  type="email"
  label="Email"
  required={true}
  helperText="We'll never share your email"
  errorMessage={errors.email}
/>

// Textarea with custom rows
<FormField
  name="description"
  label="Description"
  multiline={true}
  rows={5}
/>
```

## Dialog

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | required | Whether dialog is visible |
| onOpenChange | (open: boolean) => void | undefined | Open state change handler |
| title | ReactNode | undefined | Dialog title |
| description | ReactNode | undefined | Dialog description |
| children | ReactNode | undefined | Dialog content |
| footer | ReactNode | undefined | Dialog footer content |
| showCloseButton | boolean | true | Whether to show close button |
| maxWidth | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' | 'md' | Maximum dialog width |
| variants | Record<string, any> | defaultVariants | Animation variants |

### Examples

```tsx
// Basic dialog
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Welcome"
>
  <p>Dialog content here</p>
</Dialog>

// Dialog with footer and custom width
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirmation"
  maxWidth="sm"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button color="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  Are you sure you want to continue?
</Dialog>

// Dialog with custom animation
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  variants={{
    overlay: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    content: {
      hidden: { y: -50, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    }
  }}
>
  Custom animated content
</Dialog>
```

## Hooks

### useDisclosure

Hook for managing show/hide states.

```tsx
const { isOpen, open, close, toggle } = useDisclosure({
  defaultIsOpen: false,
  onOpen: () => console.log('opened'),
  onClose: () => console.log('closed')
});
```

### useDebounce

Hook that debounces a value.

```tsx
const searchTerm = 'example';
const debouncedTerm = useDebounce(searchTerm, 500);
```

### usePrevious

Hook that tracks previous value of a variable.

```tsx
const value = 'current';
const previousValue = usePrevious(value);
```

### useEventListener

Hook for managing event listeners.

```tsx
useEventListener(
  'keydown',
  (event) => {
    if (event.key === 'Escape') {
      // Handle escape key
    }
  },
  document
);
```

### useAsync

Hook for managing async operations.

```tsx
const { isLoading, isError, error, data, execute } = useAsync(
  async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  },
  { immediate: true }
);
```

## Higher-Order Components

### withProps

```tsx
const PrimaryButton = withProps({
  color: 'primary',
  variant: 'filled'
})(Button);
```

### withStyles

```tsx
const RoundedButton = withStyles('rounded-full shadow-lg')(Button);
```

### withLoading

```tsx
const LoadingButton = withLoading(
  () => <span>Loading...</span>
)(Button);
```

### withError

```tsx
const ErrorButton = withError(
  ({ error }) => <span>Error: {error}</span>
)(Button);
```

### withAsync

```tsx
const AsyncButton = withAsync(
  async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  },
  {
    LoadingComponent: () => <span>Loading...</span>,
    ErrorComponent: ({ error }) => <span>Error: {error.message}</span>
  }
)(Button);
```

### withPolymorphic

```tsx
const PolymorphicButton = withPolymorphic(Button, 'button');

// Can now be rendered as different elements
<PolymorphicButton as="a" href="#">Link Button</PolymorphicButton>
<PolymorphicButton as="div">Div Button</PolymorphicButton>
```

## Styling

All components support Tailwind CSS classes through the `className` prop:

```tsx
<Button
  className="
    bg-gradient-to-r from-purple-500 to-pink-500
    hover:from-purple-600 hover:to-pink-600
    transform hover:-translate-y-1
    transition-all duration-200
  "
>
  Gradient Button
</Button>

<FormField
  className="
    focus-within:ring-2 focus-within:ring-blue-500
    hover:bg-gray-50
    transition-colors
  "
/>

<Dialog
  className="
    backdrop-blur-sm
    bg-white/80
    dark:bg-gray-800/80
  "
/>
```