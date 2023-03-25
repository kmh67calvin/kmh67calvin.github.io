const input = document.querySelector(".input");
const squares = document.querySelectorAll(".square");
const machine = document.querySelector(".machineDiv");
const speedInput = document.getElementById("speedSlider");
let mainUpdate;
machine.style.left = "0px";

let editor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    value: '\
ATM // Specify start\n\
EXAMPLE: Bitstrings that start with 0 // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 // Tape Alphabet\n\
1 // WIP! Number of Tapes\n\
1 // WIP! Numbers of Tracks on Tape 0\n\
2 // Tape 0 is 2-way infinite\n\
s0 // Initial State\n\
s1 // Final State(s)\n\
s0 0 s1 1 R // Transitions <state> <cell value> <next state> <next cell value> <next direction>\n\
end // Specify end\
'
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

compile = () => {
    if(interpretEditor()) {
        reset();
        setInputToTape();
        displayTape();
        mainUpdate = setInterval(function() {
            doNext(currentState, getCharAtCurrentCell());
        }, speed);
    }
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
        character = leftCells[Math.abs(0 - (currentCell + 1))];;
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
    inputAlphabet = [];
    tapeAlphabet = [];
    numberOfTapes = 0;
    numberOfTracksOnTape0 = 0;
    infiniteDirections = 0;
    startState = "";
    finalStates = "";
    transitions = Object.create(null);
    currentState = "";
}

toggleDarkMode = () => {
    document.body.classList.toggle("darkMode")
}

// Interpretation
let inputAlphabet = [];
let tapeAlphabet = [];
let numberOfTapes = 0;
let numberOfTracksOnTape0 = 0;
let infiniteDirections = 0;
let startState = "";
let finalStates = "";
let transitions = Object.create(null);
let currentState = "";

interpretEditor = () => {
    let lines = editor.getValue().split("\n");
    // Bounding check
    if(removeComment(lines[0]) != "ATM") {
        alert("First line must specify that the program is a Turing Machine file (ATM)!");
        return false;
    }
    if(removeComment(lines[lines.length - 1]).toLowerCase() != "end") {
        alert("Last line must specify the end of the program (END)!");
        return false;
    }

    inputAlphabet = removeComment(lines[2]).split(" ");
    tapeAlphabet = removeComment(lines[3]).split(" ");
    numberOfTapes = removeComment(lines[4]).split(" ");
    numberOfTracksOnTape0 = removeComment(lines[5]).split(" ");
    infiniteDirections = removeComment(lines[6]).split(" ");
    startState, currentState = removeComment(lines[7]).split(" ");
    finalStates = removeComment(lines[8]).split(" ");
    // Remove the first 9 lines, leaving only the transitions
    lines.splice(0, 9);
    
    lines.forEach(line => interpretTransitions(line));
    return true;
}

interpretTransitions = (transitionToInterpret) => {
    if(transitionToInterpret.toLowerCase() == "end") {
        return true;
    }

    let transitionInfo = removeComment(transitionToInterpret).split(" ");
    if(transitionInfo.length != 5) {
        return false;
    }
    // Check if the next character is part of the tape alphabet
    if(!tapeAlphabet.includes(transitionInfo[3])) {
        return false;
    }
    transitions[transitionInfo[0] + "," + transitionInfo[1]] = {nextState: transitionInfo[2], nextCellValue: transitionInfo[3], nextDirection: transitionInfo[4]};
    return true;
}

removeComment = (lineToParse) => {
    return lineToParse.split("//")[0].trim();
}

// Executing the machine
doNext = (state, cellValue) => {
    let instructions = transitions[state + "," + cellValue];
    if(typeof instructions != "undefined") {
        currentState = instructions.nextState;
        
        if(currentCell < 0) {
            leftCells[Math.abs(0 - (currentCell + 1))] = instructions.nextCellValue;
        } else {
            cells[currentCell] = instructions.nextCellValue;
        }

        if(instructions.nextDirection.toLowerCase() == "r") {
            moveTapeRight();
        } else {
            moveTapeLeft();
        }
    } else {
        // Machine has halted
        if(finalStates.includes(currentState)) {
            recognized();
        } else {
            notRecognized();
        }
    }
}

recognized = () => {
    clearInterval(mainUpdate);
    alert("recognized");
}

notRecognized = () => {
    clearInterval(mainUpdate);
    alert("not recognized");
}