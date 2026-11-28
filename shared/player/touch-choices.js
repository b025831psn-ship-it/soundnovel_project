export function hitChoice(rows, x, y) {
  return rows.find(row => x >= row.x && x < row.x + row.width && y >= row.y && y < row.y + row.height)?.index ?? null;
}

export function canvasPoint(canvas, event, width, height) {
  const box = canvas.getBoundingClientRect();
  return {x: (event.clientX - box.left) * width / box.width, y: (event.clientY - box.top) * height / box.height};
}

export function wireTouchChoices(canvas, state, select, confirm) {
  const onPointer = event => {
    event.preventDefault();
    const point = canvasPoint(canvas, event, canvas.width, canvas.height);
    const index = hitChoice(state().touchRows ?? [], point.x, point.y);
    if (index === null) confirm();
    else select(index);
  };
  canvas.addEventListener('pointerdown', onPointer);
  return () => canvas.removeEventListener('pointerdown', onPointer);
}
