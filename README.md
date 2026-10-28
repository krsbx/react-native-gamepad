# react-native-gamepad

Gamepad input for React Native, built with [Nitro Modules](https://nitro.margelo.com/).

## Installation

```sh
npm install react-native-gamepad react-native-nitro-modules
```

## Usage

```js
import { multiply } from 'react-native-gamepad';

const result = multiply(3, 7);
```

## Development

```sh
bun install
bun nitrogen          # regenerate native specs after editing src/*.nitro.ts
bun example android   # or: bun example ios
```

## License

MIT
