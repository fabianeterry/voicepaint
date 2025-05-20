let fondoImg;
let mic;
let fft;
let notes = [];
let grid = [];
let gridSize = 40;
let cols, rows;
let speedMultiplier = 1;

let nota3Img;

let longSoundDuration = 0;
let vibrationActive = false;
let bgRotationAngle = 0;
let estrellas = [];

let gradientRadius = 200;

function preload() {
  fondoImg = loadImage('data/fondo.png');
  nota3Img = loadImage('data/nota3.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
  mic.start();

  fft = new p5.FFT();
  fft.setInput(mic);

  cols = floor(width / gridSize);
  rows = floor(height / gridSize);

  for (let y = 0; y < rows; y++) {
    grid[y] = new Array(cols).fill(null);
  }
}

function draw() {
  let micLevel = mic.getLevel();
  drawCircularGradient(micLevel);

  if (micLevel > 0.05) {
    longSoundDuration++;
  } else {
    longSoundDuration = 0;
  }

  vibrationActive = longSoundDuration > 40;

  let bgSize = min(width, height) * 0.6;

  // Vibración del fondo
  let bgVibrationX = vibrationActive ? sin(frameCount * 0.4) * 5 : 0;
  let bgVibrationY = vibrationActive ? cos(frameCount * 0.4) * 5 : 0;

  push();
  translate(width / 2 + bgVibrationX, height / 2 + bgVibrationY);
  rotate(bgRotationAngle);
  imageMode(CENTER);
  image(fondoImg, 0, 0, bgSize, bgSize);
  pop();

  handleNotes();
  drawGrid();
  updateAndDrawEstrellas();

  if (micLevel > 0.01 && random(1) > 0.7) {
    estrellas.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      alpha: 255,
      maxSize: random(5, 8),
      birthFrame: frameCount
    });
  }
}

function drawCircularGradient(micLevel) {
  let baseColor = color(10, 20, 40);
  let highlightColor = color(40, 80, 150);

  let maxRadius = dist(0, 0, width / 2, height / 2) * 1.5;
  gradientRadius = lerp(gradientRadius, map(micLevel, 0, 0.1, 200, maxRadius), 0.05);

  noStroke();
  for (let r = gradientRadius; r > 0; r -= 4) {
    let inter = map(r, 0, gradientRadius, 0, 1);
    fill(lerpColor(highlightColor, baseColor, inter));
    ellipse(width / 2, height / 2, r * 2);
  }
}

function generateNote(micLevel) {
  let note = {
    x: floor(random(cols)) * gridSize,
    y: 0,
    size: gridSize,
    speed: map(micLevel, 0, 0.1, 1, 5) * speedMultiplier,
    image: nota3Img,
    direction: random([-1, 1]),
    moveCooldown: floor(random(30, 80))
  };
  notes.push(note);
}

function handleNotes() {
  for (let i = notes.length - 1; i >= 0; i--) {
    let note = notes[i];
    let gridY = floor(note.y / gridSize);
    let gridX = floor(note.x / gridSize);

    if (gridY < rows - 1 && !grid[gridY + 1][gridX]) {
      note.y += note.speed;

      if (note.moveCooldown <= 0) {
        let newX = gridX + note.direction;
        if (newX >= 0 && newX < cols && !grid[gridY][newX]) {
          note.x = newX * gridSize;
        }
        note.direction = random([-1, 1]);
        note.moveCooldown = floor(random(30, 80));
      } else {
        note.moveCooldown--;
      }
    } else {
      if (gridY >= 0) {
        grid[gridY][gridX] = { image: note.image };
        notes.splice(i, 1);
        checkForFullRows();
      }
    }

    let vibrationOffset = vibrationActive ? sin(frameCount * 0.3 + note.x * 0.2) * 3 : 0;
    image(note.image, note.x + vibrationOffset, note.y, note.size, note.size);
  }
}

function drawGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x]) {
        let vibrationOffset = vibrationActive ? sin(frameCount * 0.3 + x * 0.2) * 3 : 0;
        image(grid[y][x].image, x * gridSize + vibrationOffset, y * gridSize, gridSize, gridSize);
      }
    }
  }
}

function updateAndDrawEstrellas() {
  noStroke();
  for (let i = estrellas.length - 1; i >= 0; i--) {
    let estrella = estrellas[i];
    let age = frameCount - estrella.birthFrame;

    let flashFactor = constrain(1 - age / 10, 0, 1);
    let currentSize = estrella.size + (estrella.maxSize - estrella.size) * flashFactor;

    let vibrationOffsetX = vibrationActive ? sin(frameCount * 0.3 + i * 0.5) * 1.5 : 0;
    let vibrationOffsetY = vibrationActive ? cos(frameCount * 0.3 + i * 0.5) * 1.5 : 0;

    fill(255, estrella.alpha);
    ellipse(estrella.x + vibrationOffsetX, estrella.y + vibrationOffsetY, currentSize);

    estrella.alpha -= 0.5;
    if (estrella.alpha <= 0) {
      estrellas.splice(i, 1);
    }
  }
}

function checkForFullRows() {
  for (let y = rows - 1; y >= 0; y--) {
    if (grid[y].every(cell => cell !== null)) {
      grid.splice(y, 1);
      grid.unshift(new Array(cols).fill(null));
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cols = floor(width / gridSize);
  rows = floor(height / gridSize);
}
