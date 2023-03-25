const input = document.querySelectorAll(".input");
const machine = document.querySelector(".machineDiv");
const speedInput = document.getElementById("speedSlider");
const showCurrentState = document.getElementById("currentState");
const loader = document.getElementById("loader");
const tapes = document.getElementById("tapes");
const fr = new FileReader();
let mainUpdate;
let squares = [];

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

let cellsPerTrack = [];
let leftCellsPerTrack = [];
let currentCellPerTape = [];
let speed = 1001 - speedInput.value;
let totalNumberOfTracks = 0;

setInputToTrack = (trackIdx) => {
    cellsPerTrack.push([]);
    for(let i = 0; i < input[trackIdx].value.length; i++) {
        cellsPerTrack[trackIdx][i].push(input[trackIdx].value[i]);
    }
}

displayTrack = (trackIdx) => {
    let cellValue = "";
    // 9 for 9 squares in a track
    for(let squareIdx = 0, cellIdx = (currentCell - 4); squareIdx < 9; squareIdx++, cellIdx++) {
        if(cellIdx < 0) {
            cellValue = leftCellsPerTrack[trackIdx][Math.abs(0 - (cellIdx + 1))];
        } else {
            cellValue = cellsPerTrack[trackIdx][cellIdx];
        }

        if(typeof cellValue != "undefined") {
            if(cellValue == "_") {
                squares[trackIdx][squareIdx].innerHTML = "";
            } else {
                squares[trackIdx][squareIdx].innerHTML = cellValue;
            }
        } else {
            squares[squareIdx].innerHTML = "";
        }
    }
}

clearCells = () => {
    cellsPerTrack = [];
    leftCellsPerTrack = [];
    currentCellPerTape = [];
}

compile = () => {
    let lines = editor.getValue().split("\n");
    numberOfTapes = removeComment(lines[4]).split(" ");
    for(let i = 0; i < numberOfTapes; i++) {
        totalNumberOfTracks += parseInt(removeComment(lines[5 + i]).split(" "));
    }
    reset();
    if(interpretEditor()) {
        setInputToTrack();
        displayTrack();
        mainUpdate = setInterval(function() {
            for(let i = 0; i < numberOfTapes; i++) {
                doNext(currentState, getCharAtCurrentCell(), i);
            }
        }, speed);
    } else {
        alert("Issue encountered in code!");
    }
}

moveTapeRight = (tapeIdx) => {
    currentCellPerTape[tapeIdx]++;
    displayTrack();
}

moveTapeLeft = (tapeIdx) => {
    currentCellPerTape[tapeIdx]--;
    displayTrack();
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
    tapes.innerHTML = "";
    clearInterval(mainUpdate);
    clearCells();
    
    // for(let i = 0; i < totalNumberOfTracks; i++) {
    //     displayTrack(i);
    // }
    
    inputAlphabet = [];
    tapeAlphabet = [];
    numberOfTapes = [];
    numberOfTracksPerTape = [];
    infiniteDirectionsPerTape = [];
    startState = "";
    finalStates = [];
    transitions = Object.create(null);
    currentStatesPerTape = [];
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
let numberOfTracksPerTape = [];
let infiniteDirectionsPerTape = [];
let startState = "";
let finalStates = [];
let transitions = Object.create(null);
let currentStatesPerTape = [];
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
    for(let i = 0; i < numberOfTapes; i++) {
        numberOfTracksPerTape.push(parseInt(removeComment(lines[5 + i]).split(" ")));
        infiniteDirectionsPerTape.push(parseInt(removeComment(lines[parseInt(numberOfTapes) + 5 + i]).split(" ")));

        // Construct the tape in html
        tapes.innerHTML += "<div id=\"tape" + i + "\">";
        for(let j = 0; j < numberOfTracksPerTape[i]; j++) {
            tapes.innerHTML += "\
<div class=\"machineDiv\" id=\"track" + j + "\">\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
    <div class=\"square\"></div>\n\
</div>\n\
        "
        squares.push(document.querySelectorAll("#track" + j + ".square"));
        }
        tapes.innerHTML += "\
<div id=\"head\">\n\
    <div class=\"triangle center\"></div>\n\
</div>\n\
    </div>"
    }

    startState = removeComment(lines[(2 * numberOfTapes) + 5]).split(" ");
    finalStates = removeComment(lines[(2 * numberOfTapes) + 6]).split(" ");

    // Remove the config lines, leaving only the transitions
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

    // Check if the proposed next character and given character is some combination of the tape alphabet
    let givenCellChars = transitionInfo[1].split("+");
    for(let i = 0; i < givenCellChars.length; i++) {
        if(!tapeAlphabet.includes(givenCellChars[i])){
            return false;
        }
    }

    let nextCellChars = transitionInfo[3].split("+");
    for(let i = 0; i < nextCellChars.length; i++) {
        if(!tapeAlphabet.includes(nextCellChars[i])){
            return false;
        }
    }

    // And that the next direction is either R or L
    if(transitionInfo[4].toLowerCase() != "r" && transitionInfo[4].toLowerCase() != "l") {
        return false;
    }

    transitions[transitionInfo[0] + "," + transitionInfo[1]] = {nextState: transitionInfo[2], nextCellValue: transitionInfo[3], nextDirection: transitionInfo[4]};
    return true;
}

removeComment = (lineToParse) => {
    return lineToParse.split("//")[0].trim();
}

// Executing the machine
doNext = (state, cellValue, tapeIdx) => {
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
            moveTapeRight(tapeIdx);
        } else {
            moveTapeLeft(tapeIdx);
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

// Examples
bstringsStartWith0 = () => {
    editor.setValue("\
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
")
}
bstringsEndWithTwo0 = () => {
    editor.setValue("\
ATM // Specify start\n\
EXAMPLE: Bitstrings that end in 2 zeros // Machine Name\n\
0 1 // Input Alphabet, blank is _\n\
0 1 A // Tape Alphabet, blank is _\n\
2 // WIP! Number of Tapes\n\
1 // WIP! Numbers of Tracks on Tape 0\n\
3 // WIP! Numbers of Tracks on Tape 1\n\
2 // Tape 0 is 2-way infinite\n\
1 // WIP! Tape 1 is 1-way infinite\n\
s0 // Initial State, states are seperated by spaces\n\
s2 // Accepting State(s)\n\
s0 0 s1 0 R // Transitions <state> <cell value> <next state> <next cell value> <next direction>\n\
s0 1 s0 1 R\n\
s1 0 s2 0 R\n\
s1 1 s0 1 R\n\
s2 0 s2 0 R\n\
s2 1 s0 1 R\n\
END // Specify end\
")
}