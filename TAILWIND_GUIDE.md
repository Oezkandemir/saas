# Tailwind CSS Style Guide

## Class Ordering

We use automatic tools to maintain consistent Tailwind CSS class ordering in our codebase. This makes the code more readable and reduces merge conflicts.

### Ordering Rules

The class order follows the official Tailwind CSS recommended ordering, which generally follows this pattern:

1. Layout (position, display, etc.)
2. Sizing (width, height, etc.)
3. Spacing (margin, padding, etc.)
4. Typography (font, text, etc.)
5. Backgrounds
6. Borders
7. Effects and filters
8. Transitions and animations
9. Interactivity

### Tools We Use

1. **eslint-plugin-tailwindcss**: ESLint plugin that checks and enforces proper class ordering
2. **prettier-plugin-tailwindcss**: Prettier plugin that automatically sorts classes during formatting

### How to Fix Class Order Issues

You have several options to fix class ordering issues:

1. **During development**:
   - VS Code should automatically highlight class ordering issues with ESLint
   - Use the "Format Document" command in VS Code to automatically fix ordering

2. **Command line**:
   - Run `npm run lint:tailwind` to check and fix Tailwind class ordering issues

3. **Manually**:
   - If you need to manually order classes, follow the pattern described above
   - Or refer to the order shown in ESLint error messages

### Example of Proper Class Ordering

```jsx
// Incorrect ordering
<div className="text-gray-700 p-4 flex rounded-lg">...</div>

// Correct ordering
<div className="flex p-4 rounded-lg text-gray-700">...</div>
```

### Common Issues

- Remember that responsive and state variants (like `md:` or `hover:`) don't affect the ordering of the actual utility classes
- Custom classes that aren't Tailwind utilities will be placed at the beginning
- When using the `cn()` or `clsx()` functions, the same ordering rules apply

## Using Shorthand Classes

The linter will suggest using shorthand classes when possible. Here are some common examples:

- Use `m-4` instead of `mx-4 my-4`
- Use `p-4` instead of `px-4 py-4` 
- Use `inset-0` instead of `top-0 right-0 bottom-0 left-0`
- Use `size-4` instead of `w-4 h-4`

## Questions?

If you have questions about Tailwind CSS class ordering, refer to the [Tailwind CSS documentation](https://tailwindcss.com/) or the [eslint-plugin-tailwindcss documentation](https://github.com/francoismassart/eslint-plugin-tailwindcss). 