const getLines = (ctx, text, maxWidth) => {
  // split text on either spaces, slashes, underscores or dashes
  const words = text.split(/([\s/\\_-])/);
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + word).width;
    if (width < maxWidth) {
      currentLine += word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export { getLines };