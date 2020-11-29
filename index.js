function getCanvas() {
    return document.getElementById("canvas");
}

function getCtx() {
    return getCanvas().getContext('2d');
}

function clear() {
    const ctx = getCtx();

    ctx.clearRect(0, 0, 1000, 1000);
    ctx.beginPath();
}

const boardWidth = 1000;
const boardHeight = 1000;

const widthInCells = 100;
const heightInCells = 100;

const cellWidth = boardWidth/widthInCells;
const cellHeight = boardHeight/heightInCells;

class LinkedListNode {
  constructor() {
    this.visited = false;
    this.painted = false;

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

  paint() {
    const ctx = getCtx();

    ctx.rect(this.x, this.y, cellWidth, cellHeight);
    ctx.fill();
  }

  nextVisited() {
    if (this.right && this.right.visited) {
      return this.right;
    }

    if (this.down && this.down.visited) {
      return this.down;
    }

    if (this.left && this.left.visited) {
      return this.left;
    }

    if (this.up && this.up.visited) {
      return this.up;
    }

    return null;
  }
}

class LinkedList {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    const totalLength = width * height;
    this.nodes = Array(totalLength).fill().map(() => new LinkedListNode());

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const index = Math.abs((j * height) + i);

        const node = this.nodes[index];

        let leftIndex = index - 1; 
        let rightIndex = index + 1;

        let upIndex = ((j - 1) * height) + i;
        let downIndex = ((j + 1) * height) + i;

        if (leftIndex >= 0 && (leftIndex % width) != (width - 1)) {
          node.left = this.nodes[leftIndex];
        } else {
          node.left = this.nodes[j * height + width - 1];
        }

        if (rightIndex < totalLength && (rightIndex % width) != 0) {
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


const leftShip = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 1]
];

const rightShip = [
  [2, 0],
  [2, 1],
  [2, 2],
  [1, 2],
  [0, 1]
];

let list;
let filledCells;

filledCells = [];

/**
for (let i = 0; i < 100; i++) {
  const randomX = Math.floor(Math.random() * 80);
  const randomY = Math.floor(Math.random() * 80);

  const ship = !!Number(Math.round(Math.random())) ? leftShip : rightShip;

  const newElem = ship.map(p => {
    return [
      p[0] + randomX,
      p[1] + randomY
    ];
  });

  filledCells.push(...newElem);
}
**/

function setup(options = {resetGrid: true} ) {
  if (options.resetGrid) {
    list = new LinkedList(widthInCells, heightInCells);
  }
  
  filledCells.forEach(point => {
    const node = list.getNode(point[0], point[1]);

    node.fillNext = true;
  })

  for (const node of list.nodes) {
    node.visited = true;
  }

  paintNextStep();
}

function calculateNextStep() {
  let node = list.getNode(0,0);

  while (true) {
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
      if (neigh === 3) {
        node.fillNext = true;
      } else {
        node.fillNext = false;
      }
    }

    let found = false;

    ['left', 'up', 'right', 'down'].forEach(d => {
        if (!found && !!node[d] && !node[d].visited) {
          node = node[d];
          found = true;
        }
    });

    if (!found) {
      break;
    }
  }
}

function paintNextStep() {
  const ctx = getCtx();
  const canvas = getCanvas();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  canvas.width = canvas.width;

  ctx.fillStyle = "navy";

  let current = list.getNode(0,0);

  while(current) {
    current.fill = current.fillNext;

    if (current.fill) {
      current.paint();
    } 

    current.visited = false;

    current = current.nextVisited()
  }
}

window.onload = function () {
  function step() {
      calculateNextStep();
      paintNextStep();
  }

  setup();

  const playButton = document.getElementById("button-play");
  const stepButton = document.getElementById("button-step");
  const resetButton = document.getElementById("button-reset");

  let running = false;

  function run() {
    if (running) {
      step();
    }

    if (running) {
      playButton.firstChild.data = "Pause";
      stepButton.disabled = true;
      resetButton.disabled = true;
    } else {
      playButton.firstChild.data = "Play";
      stepButton.disabled = false;
      resetButton.disabled = false;
    }

    setTimeout(run, 16);
  }

  run();

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
  
  getCanvas().addEventListener('click', evt => {
    const x = evt.offsetX;
    const y = evt.offsetY;

    let targetNode;

    for (const n of list.nodes) {
      if (
        (x >= n.x && x <= (n.x + cellWidth)) &&
        (y >= n.y && y <= (n.y + cellHeight))
      ) {
        targetNode = n;
        break;
      }
    }

    const ship = !!Number(Math.round(Math.random())) ? leftShip : rightShip;

    const newElem = ship.map(p => {
      return [
        p[0] + targetNode.xIndex,
        p[1] + targetNode.yIndex 
      ];
    });

    filledCells = [];

    filledCells.push(...newElem);

    setup({resetGrid: false});
  });
}
