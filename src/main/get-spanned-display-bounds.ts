export const getSpannedDisplayBounds = (screen:Electron.Screen) => {
  let displays = screen.getAllDisplays()

  // try to limit to 4K windows
  displays = displays.filter(o => o.bounds.height === 2160).sort();
  
  if (displays.length === 0) {
    // no 4K window? (eg developping locally) span over all displays
    displays = screen.getAllDisplays().sort((a, b) => (a.bounds.width > b.size.width) ? -1 : 1);
  }
  
  const spannedDisplay = displays.reduce((prev, curr) => ({ bounds: { x: Math.min(prev.bounds.x, curr.bounds.x), y: Math.min(prev.bounds.y, curr.bounds.y)}, size: { width: prev.size.width + curr.size.width, height: Math.max(prev.size.height, curr.size.height)}}), { size: { width: 0, height: 0 }, bounds: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }});

  return spannedDisplay;
};