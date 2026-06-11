const [major] = process.versions.node.split(".").map(Number);

if (major < 20 || major >= 24) {
  console.error(
    `\nsync-server requires Node.js 20–23 (see .nvmrc).\n` +
      `Current: v${process.versions.node}\n\n` +
      `On Homebrew macOS:\n` +
      `  brew install node@20\n` +
      `  PATH="/opt/homebrew/opt/node@20/bin:$PATH" npm i\n`,
  );
  process.exit(1);
}
