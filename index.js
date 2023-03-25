const input = document.querySelector(".input");
const machine = document.querySelector(".machineDiv");
const squares = document.querySelectorAll(".square");
const speedInput = document.getElementById("speedSlider");
const showCurrentState = document.getElementById("currentState");
const loader = document.getElementById("loader");
const tapes = document.getElementById("tapes");
const fr = new FileReader();
let mainUpdate;

loader.addEventListener('change', (event) => {
    fr.readAsText(loader.files[0]);
});

fr.addEventListener('load', (event) => {
    editor.setValue(event.target.result);
});

let editor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    value: '\
ATM // Specify start\n\
EXAMPLE: Bitstrings that start with 0 // Machine Name\n\
0 1 // Input Alphabet, blank is _\n\
0 1 // Tape Alphabet, blank is _\n\
1 // WIP! Number of Tapes\n\
1 // WIP! Numbers of Tracks on Tape 0\n\
2 // Tape 0 is 2-way infinite\n\
s0 // Initial State, states are seperated by spaces\n\
s1 // Accepting State(s)\n\
s0 0 s1 0 R // Transitions <state> <cell value> <next state> <next cell value> <next direction>\n\
s0 1 s2 1 R\n\
s1 0 s1 0 R\n\
s1 1 s1 1 R\n\
s2 0 s2 0 R\n\
s2 1 s2 1 R\n\
END // Specify end\
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
            if(cellValue == "_") {
                squares[squareIdx].innerHTML = "";
            } else {
                squares[squareIdx].innerHTML = cellValue;
            }
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
    reset();
    if(interpretEditor()) {
        setInputToTape();
        displayTape();
        mainUpdate = setInterval(function() {
            doNext(currentState, getCharAtCurrentCell());
        }, speed);
    } else {
        alert("Issue encountered in code!");
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
    return "_"; 
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
    // numberOfTapes = 0;
    // numberOfTracksOnTape0 = 0;
    infiniteDirections = 0;
    startState = "";
    finalStates = "";
    transitions = Object.create(null);
    currentState = "";
    updateCurrentState();
}

toggleDarkMode = () => {
    document.body.classList.toggle("darkMode");
    squares.forEach(square => square.classList.toggle("squareDarkMode"));
    input.classList.toggle("inputDarkMode");
    document.querySelector(".box").classList.toggle("boxDarkMode");
}

updateCurrentState = () => {
    showCurrentState.innerHTML = currentState;
}

copy = () => {
    navigator.clipboard.writeText(editor.getValue());
    alert("Copied program to clipboard!");
}

download = () => {
    let editorData = editor.getValue();
    let fileName = removeComment(editorData.split("\n")[1]);
    let fileData = new Blob([editorData], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(fileData, fileName);
}

load = () => {
    loader.click();
}

// Interpretation
let inputAlphabet = [];
let tapeAlphabet = [];
let numberOfTapes = 0;
// let numberOfTracksOnTape0 = 0; // Ignored
// let infiniteDirections = 0;
let startState = "";
let finalStates = "";
let transitions = Object.create(null);
let currentState = "";

interpretEditor = () => {
    let lines = editor.getValue().split("\n");
    // Bounds check
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
    startState, currentState = removeComment(lines[(2 * numberOfTapes) + 5]).split(" ");
    finalStates = removeComment(lines[(2 * numberOfTapes) + 6]).split(" ");
    // Remove the first 9 lines, leaving only the transitions
    lines.splice(0, (2 * numberOfTapes) + 7);

    // Interpret lines describing transition functions
    for(let i = 0; i < lines.length; i++) {
        if(!interpretTransitions(lines[i])) {
            return false;
        }
    }

    // Check if the characters given in the input are all part of the input alphabet
    for(let i = 0; i < input.value.length; i++) {
        if(!inputAlphabet.includes(input.value[i])) {
            return false;
        }
    }
    updateCurrentState();
    return true;
}

interpretTransitions = (transitionToInterpret) => {
    let transitionText = removeComment(transitionToInterpret);
    if(transitionText.toLowerCase() == "end") {
        return true;
    }

    let transitionInfo = transitionText.split(" ");
    if(transitionInfo.length != 5) {
        return false;
    }
    // Check if the proposed next character and given character are part of the tape alphabet and that the next direction is either R or L
    if(!tapeAlphabet.includes(transitionInfo[3]) || !tapeAlphabet.includes(transitionInfo[1]) || (transitionInfo[4].toLowerCase() != "r" && transitionInfo[4].toLowerCase() != "l")) {
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
        updateCurrentState();
        
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