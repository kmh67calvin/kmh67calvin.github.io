const input = document.querySelector(".input");
const squares = document.querySelectorAll(".square");
const machine = document.querySelector(".machineDiv");
const speedInput = document.getElementById("speedSlider");
let mainUpdate;
machine.style.left = "0px";

let editor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    value: '// Code goes here'
});

let cells = [];
let leftCells = [];
let currentCell = 0;
let speed = 1001 - speedInput.value;

setInputToTape = () => {
    for(let i = 0; i < input.value.length; i++) {
        cells.push(input.value[i]);
    }
}

displayTape = () => {
    let cellValue = "";
    for(let squareIdx = 0, cellIdx = (currentCell - 4); squareIdx < squares.length; squareIdx++, cellIdx++) {
        if(cellIdx < 0) {
            cellValue = leftCells[Math.abs(0 - (cellIdx + 1))];
        } else {
            cellValue = cells[cellIdx];
        }

        if(typeof cellValue != "undefined") {
            squares[squareIdx].innerHTML = cellValue;
        } else {
            squares[squareIdx].innerHTML = "";
        }
    }
}

clearCells = () => {
    cells = [];
    leftCells = [];
    currentCell = 0;
}

interpretEditor = () => {
    let lines = editor.getValue().split("\n");
    // lines.forEach(line => alert(line));
}

compile = () => {
    clearCells();
    setInputToTape();
    displayTape();
    interpretEditor();
    mainUpdate = setInterval(function() {
        moveTapeRight();
    }, speed);
}

moveTapeRight = () => {
    currentCell++;
    displayTape();
}

moveTapeLeft = () => {
    currentCell--;
    displayTape();
}

getCharAtCurrentCell = () => {
    let character;
    if(currentCell < 0) {
        character = leftCells[Math.abs(0 - (cellIdx + 1))];;
    } else {
        character = cells[currentCell];
    }

    if(typeof character != "undefined") {
        return character;
    }
    return ""; 
}

speedInput.addEventListener("mouseup", function() {
    speed = 1001 - speedInput.value;
}, false);

reset = () => {
    clearInterval(mainUpdate);
    clearCells();
    displayTape();
}

toggleDarkMode = () => {
    document.body.classList.toggle("darkMode")
}