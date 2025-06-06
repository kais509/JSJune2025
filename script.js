const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const UNIT = 10;
let pieces = [];

const colors = [
  { name: "LightBlue", color: "#ADD8E6", size: 9 },
  { name: "Brown", color: "#8B4513", size: 8 },
  { name: "Yellow", color: "#FFFF00", size: 7 },
  { name: "MidBlue", color: "#87CEFA", size: 6 },
  { name: "Pink", color: "#FFC0CB", size: 5 },
  { name: "DarkBlue", color: "#00008B", size: 4 },
  { name: "Orange", color: "#FFA500", size: 3 },
  { name: "Green", color: "#008000", size: 2 },
];

const sidebar = document.getElementById("sidebar");
let dragging = null;

// Create sidebar buttons
colors.forEach(({ color, size }) => {
  const btn = document.createElement("div");
  btn.style.width = `${size * UNIT}px`;
  btn.style.height = `${size * UNIT}px`;
  btn.style.background = color;
  btn.style.border = "1px solid #333";
  btn.style.cursor = "grab";
  btn.draggable = true;

  btn.addEventListener("dragstart", (e) => {
    dragging = { color, size };
  });

  sidebar.appendChild(btn);
});

// Canvas drop handling
canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / UNIT) * UNIT;
  const y = Math.floor((e.clientY - rect.top) / UNIT) * UNIT;

  if (dragging) {
    pieces.push({
      x,
      y,
      size: dragging.size,
      color: dragging.color,
    });
    dragging = null;
  }
});

// Drag pieces back to sidebar to delete
sidebar.addEventListener("dragover", (e) => e.preventDefault());
sidebar.addEventListener("drop", (e) => {
  if (dragging && dragging.onBoardIndex != null) {
    pieces.splice(dragging.onBoardIndex, 1);
    dragging = null;
  }
});

// Redraw loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw gridlines
  ctx.strokeStyle = "#ccc";
  for (let i = 0; i <= canvas.width; i += UNIT) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Draw board pieces
  pieces.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size * UNIT, p.size * UNIT);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(p.x, p.y, p.size * UNIT, p.size * UNIT);
  });

  // Draw currently dragged piece
  if (dragging) {
    ctx.fillStyle = dragging.color;
    ctx.fillRect(dragging.x, dragging.y, dragging.size * UNIT, dragging.size * UNIT);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(dragging.x, dragging.y, dragging.size * UNIT, dragging.size * UNIT);
  }

  requestAnimationFrame(draw);
}
draw();

// Enable dragging board pieces
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    if (
      mouseX >= p.x &&
      mouseX < p.x + p.size * UNIT &&
      mouseY >= p.y &&
      mouseY < p.y + p.size * UNIT
    ) {
      dragging = { ...p, onBoardIndex: i, offsetX: mouseX - p.x, offsetY: mouseY - p.y };
      pieces.splice(i, 1); // Temporarily remove
      break;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (dragging && dragging.onBoardIndex != null) {
    const rect = canvas.getBoundingClientRect();
    dragging.x = Math.floor((e.clientX - rect.left - dragging.offsetX) / UNIT) * UNIT;
    dragging.y = Math.floor((e.clientY - rect.top - dragging.offsetY) / UNIT) * UNIT;
  }
});

canvas.addEventListener("mouseup", () => {
  if (dragging && dragging.onBoardIndex != null) {
    pieces.push(dragging);
    dragging = null;
  }
});

// Right-click to delete pieces
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // Prevent default right-click menu
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    if (
      mouseX >= p.x &&
      mouseX < p.x + p.size * UNIT &&
      mouseY >= p.y &&
      mouseY < p.y + p.size * UNIT
    ) {
      pieces.splice(i, 1);
      break;
    }
  }
});

// Backspace to delete last piece
document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && pieces.length > 0) {
    pieces.pop();
  }
  
  // Arrow key movement for last piece
  if (pieces.length > 0) {
    const lastPiece = pieces[pieces.length - 1];
    switch (e.key) {
      case "ArrowLeft":
        lastPiece.x = Math.max(0, lastPiece.x - UNIT);
        break;
      case "ArrowRight":
        lastPiece.x = Math.min(canvas.width - lastPiece.size * UNIT, lastPiece.x + UNIT);
        break;
      case "ArrowUp":
        lastPiece.y = Math.max(0, lastPiece.y - UNIT);
        break;
      case "ArrowDown":
        lastPiece.y = Math.min(canvas.height - lastPiece.size * UNIT, lastPiece.y + UNIT);
        break;
    }
  }
});
