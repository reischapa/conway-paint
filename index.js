function getCanvas() {
  return document.getElementById("canvas");
}

function getCtx() {
  return getCanvas().getContext('2d');
}

function getBrushTypeSelect() {
  return document.getElementById("brushType");
}

const boardWidth = 1000;
const boardHeight = 1000;

const widthInCells = 100;
const heightInCells = 100;

const cellWidth = boardWidth/widthInCells;
const cellHeight = boardHeight/heightInCells;

const brushRadius = 3 * cellWidth;

class LinkedNode {
  constructor() {
    this.fill = false;
    this.fillNext = false;

    this.left = null;
    this.up = null;
    this.right = null;
    this.down = null;

    this.x = 0;
    this.y = 0;

    this.xIndex = 0;
    this.yIndex = 0;
  }

  paint(pixels) {
    const color = this.fillNext ? 255 : 0;

    const fillCellLine = (startY) => {
      let startX = (startY * boardWidth) + this.x;

      for (let i = 0; i < cellWidth; i++) {
        const index = startX + i;

        pixels[index * 4] = color;
        pixels[(index * 4) + 1] = color;
        pixels[(index * 4) + 2] = color;
        pixels[(index * 4) + 3] = 255;
      }
    }

    for (let startY = 0; startY < cellHeight; startY++) {
      fillCellLine(this.y + startY);
    }
  }
}

class LinkedList {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    const totalLength = width * height;
    this.nodes = Array(totalLength).fill().map(() => new LinkedNode());

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const index = Math.abs((j * height) + i);

        const node = this.nodes[index];

        let leftIndex = index - 1; 
        let rightIndex = index + 1;

        let upIndex = ((j - 1) * height) + i;
        let downIndex = ((j + 1) * height) + i;

        if (leftIndex >= 0 && (leftIndex % width) !== (width - 1)) {
          node.left = this.nodes[leftIndex];
        } else {
          node.left = this.nodes[j * height + width - 1];
        }

        if (rightIndex < totalLength && (rightIndex % width) !== 0) {
          node.right = this.nodes[rightIndex];
        } else {
          node.right = this.nodes[j * height];
        }

        if (upIndex >= 0) {
          node.up = this.nodes[upIndex];
        } else {
          node.up = this.nodes[totalLength + upIndex];
        }

        if (downIndex < totalLength) {
          node.down = this.nodes[downIndex];
        } else {
          node.down = this.nodes[downIndex - totalLength];
        }

        node.x = i * cellWidth;
        node.y = j * cellHeight;

        node.xIndex = i;
        node.yIndex = j;
      }
    }
  }

  getNode(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }


    return this.nodes[Math.abs((y * this.height) + x)]
  }
}

function getNeigh(node) {
  let neigh = ['left', 'up', 'right', 'down'].reduce((acc, val) => {
    if (!node[val]) {
      return acc;
    }

    return acc + Number(node[val].fill);
  }, 0);

  if (
    node.left && node.left.up && node.left.up.fill
  ) {
    neigh += 1;
  }

  if (
    node.right && node.right.up && node.right.up.fill
  ) {
    neigh += 1;
  }

  if (
    node.right && node.right.down && node.right.down.fill
  ) {
    neigh += 1;
  }

  if (
    node.left && node.left.down && node.left.down.fill
  ) {
    neigh += 1;
  }

  return neigh;
}

let list;
let filledCells;

filledCells = [];

function setup(options = {resetList: true, filledCells: []} ) {
  filledCells = options.filledCells;

  if (options.resetList) {
    list = new LinkedList(widthInCells, heightInCells);
  }

  for (const point of filledCells) {
    const node = list.getNode(point[0], point[1]);

    node.fillNext = true;
  }

  for (const node of list.nodes) {
    node.visited = true;
  }

  paintNextStep();
}

function calculateNextStep() {
  for (const node of list.nodes) {
    node.visited = true;
    node.fillNext = false;

    const neigh = getNeigh(node);

    if (node.fill) {
      if (neigh < 2) {
        node.fillNext = false;
      } else if (neigh === 2 || neigh === 3) {
        node.fillNext = true;
      } else if (neigh > 3) {
        node.fillNext = false;
      }
    } else {
      node.fillNext = neigh === 3;
    }
  }
}

function paintNextStep() {
  const ctx = getCtx();

  const imageData = ctx.getImageData(0, 0, boardWidth, boardHeight);

  const pixels = imageData.data;

  for (const current of list.nodes) {
    current.paint(pixels);

    current.fill = current.fillNext;
  }

  ctx.putImageData(imageData, 0, 0)

}

function drawSquare(nodes, targetNodes, x, y) {
  for (const n of nodes) {
    const xIndex = Math.floor(x / cellWidth);
    const yIndex = Math.floor(y / cellHeight);

    if (n.xIndex < xIndex - 1 || n.xIndex >= (xIndex + 2) || n.yIndex < yIndex - 1 || n.yIndex >= (yIndex + 2)) {
        continue;
    }

    targetNodes.push(n);
  }
}

function drawCircle(nodes, targetNodes, x, y) {
  for (const n of nodes) {
    const dist = Math.sqrt(((n.x + cellWidth/2) - x) ** 2 + ((n.y + cellHeight/2) - y) ** 2);
    if (dist < brushRadius) {
      targetNodes.push(n);
    }
  }
}

function drawLeftShip(nodes, targetNodes, x, y) {
  const xIndex = Math.floor(x / cellWidth);
  const yIndex = Math.floor(y / cellHeight);

  for (const n of nodes) {
    if (n.xIndex < xIndex - 1 || n.xIndex >= (xIndex + 2) || n.yIndex < yIndex - 1 || n.yIndex >= (yIndex + 2)) {
      continue;
    }

    if (n.xIndex === xIndex && n.yIndex === yIndex) {
      continue;
    }

    if (n.xIndex === xIndex && n.yIndex === yIndex - 1) {
      continue;
    }

    if (n.xIndex === xIndex + 1 && n.yIndex === yIndex - 1) {
      continue;
    }

    if (n.xIndex === xIndex + 1 && n.yIndex === yIndex + 1) {
      continue;
    }

    targetNodes.push(n);
  }
}

function drawRightShip(nodes, targetNodes, x, y) {
  const xIndex = Math.floor(x / cellWidth);
  const yIndex = Math.floor(y / cellHeight);

  for (const n of nodes) {
    if (n.xIndex < xIndex - 1 || n.xIndex >= (xIndex + 2) || n.yIndex < yIndex - 1 || n.yIndex >= (yIndex + 2)) {
      continue;
    }

    if (n.xIndex === xIndex && n.yIndex === yIndex) {
      continue;
    }

    if (n.xIndex === xIndex && n.yIndex === yIndex - 1) {
      continue;
    }

    if (n.xIndex === xIndex - 1 && n.yIndex === yIndex - 1) {
      continue;
    }

    if (n.xIndex === xIndex - 1 && n.yIndex === yIndex + 1) {
      continue;
    }

    targetNodes.push(n);
  }
}

function drawDot(nodes, targetNodes, x, y) {
  const xIndex = Math.floor(x / cellWidth);
  const yIndex = Math.floor(y / cellHeight);

  const targetNode = nodes.find(n => n.xIndex === xIndex && n.yIndex === yIndex);
  targetNodes.push(targetNode);
}

let selectedBrush;

const brushes = {
  dot: drawDot,
  circle: drawCircle,
  leftShip: drawLeftShip,
  rightShip: drawRightShip,
  square: drawSquare
}

function draw(x, y) {
  let targetNodes = [];

  const brush = brushes[selectedBrush] || drawDot;

  brush(list.nodes, targetNodes, x, y);

  filledCells = [];

  for (const targetNode of targetNodes) {
    filledCells.push([targetNode.xIndex, targetNode.yIndex]);
  }

  setup({resetList: false, filledCells});
}

window.onload = function () {
  function step() {
      calculateNextStep();
      paintNextStep();
  }

  setup();

  const canvas = getCanvas();
  const playButton = document.getElementById("button-play");
  const stepButton = document.getElementById("button-step");
  const resetButton = document.getElementById("button-reset");
  const brushTypeSelect = getBrushTypeSelect();

  let running = false;
  let drawing = false;

  let lastMouseOffsetX;
  let lastMouseOffsetY;

  function run() {
    if (running) {
      step();
      playButton.firstChild.data = "Pause";
      stepButton.disabled = true;
      resetButton.disabled = true;
      brushTypeSelect.disabled = true;

      canvas.style.cursor = 'wait';
    } else {
      playButton.firstChild.data = "Play";
      stepButton.disabled = false;
      resetButton.disabled = false;
      brushTypeSelect.disabled = false;

      canvas.style.cursor = 'crosshair';
    }

    setTimeout(run, 16);
  }

  run();

  function runPaint() {
    if (drawing) {
      draw(lastMouseOffsetX, lastMouseOffsetY);
    }

    setTimeout(runPaint, 16);
  }

  runPaint();

  playButton.addEventListener('click', evt => {
    running = !running;
  });

  stepButton.addEventListener('click', evt => {
    if (!running) {
      step();
    }
  });

  resetButton.addEventListener('click', evt => {
    filledCells = [];

    setup();
  });

  
  canvas.addEventListener('mousedown', evt => {
    if (!running) {
      drawing = true;
    }
  });

  canvas.addEventListener('mouseup', evt => {
    if (!running) {
      drawing = false;
    }
  });

  canvas.addEventListener('mousemove', evt => {
    lastMouseOffsetX = evt.offsetX;
    lastMouseOffsetY = evt.offsetY;
  });

  brushTypeSelect.addEventListener('change', evt => {
      selectedBrush = evt.target.value;
  })
}
