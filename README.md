# SEE (Standard Extensible Elements)

**SEE** is a modern, lightweight [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) library. It provides a set of highly customizable UI components that follow the [Material Design 3](https://m3.material.io/) guidelines out of the box, while being designed for easy extension and restyling.

Visit the [official website](https://see.v9.nz/) for documentation and demos.

## Features

- **Material Design 3**: Ready-to-use components following the latest Material guidelines.
- **Web Components**: Framework-agnostic. Works with vanilla HTML or any framework.
- **Extensible**: Built to be extended. Create your own design system on top of SEE's logic.
- **Lightweight**: Built on [Lit](https://lit.dev/) and [floating-ui](https://floating-ui.com/) only, ensuring fast performance and small bundle sizes.
- **Accessible**: Designed with accessibility in mind (using `ElementInternals` and standard ARIA patterns).

## Installation

Install SEE using your preferred package manager:

```bash
# npm
npm install @vollowx/see

# pnpm
pnpm add @vollowx/see

# yarn
yarn add @vollowx/see

# bun
bun add @vollowx/see
```

## Usage

### Importing Components

You can import the entire library or individual components to keep your bundle size small.

```javascript
// Import all components
import '@vollowx/see';

// OR Import specific components (Recommended)
import '@vollowx/see/m3/button/common-button.js';
import '@vollowx/see/m3/checkbox.js';
```

### Using Components

Once imported, use the components just like standard HTML tags.

```html
<md-button variant="filled">Filled Button</md-button>
<md-button variant="outlined">Outlined Button</md-button>

<label>
  <md-checkbox checked></md-checkbox>
  Labelled Checkbox
</label>
```

### Theming

SEE components use CSS variables for styling. Currently, the global Material Design 3 token variables are not included in the JavaScript bundle.

To style the components correctly, you need to define the necessary CSS variables in your project. You can find reference implementations in [vollowx/see-website](https://github.com/vollowx/see-website/) or the `dev` folder of this repository.

## Browser Support

SEE relies on modern web standards like `ElementInternals`.

- **Chromium**: `>= 125.0`
- **Firefox**: `>= 126.0`

## Resources

- [Roadmap](./ROADMAP.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [License](./LICENSE)
