const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const UNIT = 10;
let pieces = [];

const colors = [
  { name: "LightBlue", color: "#ADD8E6", size: 9 },
  { name: "Brown", color: "#8B4513", size: 8 },
  { name: "Yellow", color: "#FFFF00", size: 7 },
  { name: "Blue", color: "#1c8cd1", size: 6 },
  { name: "Maroon", color: "#8b0037", size: 5 },
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

// Save/Load functionality
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const statusMessage = document.getElementById("statusMessage");

function showStatus(message) {
  statusMessage.textContent = message;
  // Clear the message after 2 seconds
  setTimeout(() => {
    statusMessage.textContent = "";
  }, 2000);
}

saveBtn.addEventListener("click", () => {
  const saveData = JSON.stringify(pieces);
  localStorage.setItem("puzzleBoard", saveData);
  showStatus("Board saved successfully!");
});

loadBtn.addEventListener("click", () => {
  const savedData = localStorage.getItem("puzzleBoard");
  if (savedData) {
    pieces = JSON.parse(savedData);
    showStatus("Board loaded successfully!");
  } else {
    showStatus("No saved board found!");
  }
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
    // Convert hex color to rgba for transparency
    const r = parseInt(p.color.slice(1, 3), 16);
    const g = parseInt(p.color.slice(3, 5), 16);
    const b = parseInt(p.color.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.fillRect(p.x, p.y, p.size * UNIT, p.size * UNIT);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(p.x, p.y, p.size * UNIT, p.size * UNIT);
  });

  // Draw currently dragged piece
  if (dragging) {
    const r = parseInt(dragging.color.slice(1, 3), 16);
    const g = parseInt(dragging.color.slice(3, 5), 16);
    const b = parseInt(dragging.color.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.fillRect(dragging.x, dragging.y, dragging.size * UNIT, dragging.size * UNIT);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(dragging.x, dragging.y, dragging.size * UNIT, dragging.size * UNIT);
  }

  requestAnimationFrame(draw);
}
draw();

// Add mouse position tracking
let mouseX = 0;
let mouseY = 0;

function snapToGrid(x, y, size) {
  // Calculate the maximum allowed positions
  const maxX = canvas.width - size * UNIT;
  const maxY = canvas.height - size * UNIT;
  
  // Snap to grid and ensure within bounds
  const snappedX = Math.min(Math.max(0, Math.floor(x / UNIT) * UNIT), maxX);
  const snappedY = Math.min(Math.max(0, Math.floor(y / UNIT) * UNIT), maxY);
  
  return { x: snappedX, y: snappedY };
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  
  // Update mouse position for number key placement
  const snapped = snapToGrid(rawX, rawY, 1);
  mouseX = snapped.x;
  mouseY = snapped.y;

  if (dragging && dragging.onBoardIndex != null) {
    // Calculate grid position while maintaining offset
    const gridPos = snapToGrid(rawX - dragging.offsetX, rawY - dragging.offsetY, dragging.size);
    dragging.x = gridPos.x;
    dragging.y = gridPos.y;
  }
});

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
      dragging = { 
        ...p, 
        onBoardIndex: i, 
        offsetX: mouseX - p.x, 
        offsetY: mouseY - p.y 
      };
      pieces.splice(i, 1); // Temporarily remove
      break;
    }
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

// Add keyboard shortcuts for pieces
document.addEventListener("keydown", (e) => {
  // Handle existing backspace and arrow key functionality
  if (e.key === "Backspace" && pieces.length > 0) {
    pieces.pop();
    showStatus("Last piece removed!");
    return;
  }
  
  if (pieces.length > 0) {
    const lastPiece = pieces[pieces.length - 1];
    const currentPos = snapToGrid(lastPiece.x, lastPiece.y, lastPiece.size);
    lastPiece.x = currentPos.x;
    lastPiece.y = currentPos.y;
    
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

  // Add number key shortcuts (1-8)
  const numKey = parseInt(e.key);
  if (numKey >= 1 && numKey <= 8) {
    const pieceIndex = numKey - 1;
    if (pieceIndex < colors.length) {
      const { color, size } = colors[pieceIndex];
      const gridPos = snapToGrid(mouseX, mouseY, size);
      
      pieces.push({
        x: gridPos.x,
        y: gridPos.y,
        size,
        color
      });
      showStatus(`Added ${colors[pieceIndex].name} piece`);
    }
  }
});
