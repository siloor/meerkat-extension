# Meerkat Extension

Build the project
```bash
npm run build
```

Build the project with watch mode
```bash
npm start
```

Run tests
```bash
npm test
```

Generate test coverage
```bash
npm run coverage
```

## Load your extension into Chrome
To load your extension in Chrome, open up chrome://extensions/ in your browser and click “Developer mode” in the top right. Now click “Load unpacked extension…” and select the extension’s directory (/build). You should now see your extension in the list.

When you change or add code in your extension, just come back to this page and reload the page. Chrome will reload your extension.

## Hot module reloading
The extension uses `crx-hotreload` to reload the extension if something changes in the build directory. It only does this in development mode.
