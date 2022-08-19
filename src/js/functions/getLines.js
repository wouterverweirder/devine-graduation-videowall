const getLines = (ctx, text, maxWidth) => {
  // split text on either spaces, slashes, underscores or dashes
  const words = text.split(/[\s/\\_-]+/);
  const lines = [];
  let currentLine = words[0];
  let tmpText = currentLine;

  for (let i = 1; i < words.length; i++) {
      const word = words[i];
      // figure out what character was splitted on
      const splitChar = text[tmpText.length];
      const width = ctx.measureText(currentLine + splitChar + word).width;
      if (width < maxWidth) {
          currentLine += splitChar + word;
      } else {
          lines.push(currentLine + splitChar);
          currentLine = word;
      }
      tmpText += splitChar + word;
  }
  lines.push(currentLine);
  return lines;
}

export { getLines };