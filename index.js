const inputs = document.getElementById("inputs");
const machine = document.querySelector(".machineDiv");
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

let cellsPerTrack = [];
let leftCellsPerTrack = [];
let currentCellPerTape = [];
let speed = 1001 - speedInput.value;
let totalNumberOfTracks = 0;
let inputPerTrack = [];

setInputToTrack = (trackIdx) => {
    cellsPerTrack.push([]);
    leftCellsPerTrack.push([]);
    for(let i = 0; i < inputPerTrack[trackIdx].length; i++) {
        cellsPerTrack[trackIdx].push(inputPerTrack[trackIdx][i]);
    }
}

displayTrack = (trackIdx, currentCell) => {
    let sq = document.querySelectorAll("#s");
    let cell = currentCell - 4;
    for(let i = 0; i < 9; i++, cell++) {
        if(cell < 0) {
            if(typeof leftCellsPerTrack[trackIdx][Math.abs(0 - (cell + 1))] != "undefined") {
                sq[i + (9 * trackIdx)].innerHTML = leftCellsPerTrack[trackIdx][Math.abs(0 - (cell + 1))];
            } else {
                sq[i + (9 * trackIdx)].innerHTML = "";
            }
        } else {
            if(typeof cellsPerTrack[trackIdx][cell] != "undefined") {
                sq[i + (9 * trackIdx)].innerHTML = cellsPerTrack[trackIdx][cell];
            } else {
                sq[i + (9 * trackIdx)].innerHTML = "";
            }
        }
    }
}

clearCells = () => {
    cellsPerTrack = [];
    leftCellsPerTrack = [];
    currentCellPerTape = [];
}

compile = () => {
    reset();

    totalNumberOfTracks = 0;
    let lines = editor.getValue().split("\n");
    numberOfTapes = removeComment(lines[4]).split(" ");
    for(let i = 0; i < numberOfTapes; i++) {
        totalNumberOfTracks += parseInt(removeComment(lines[5 + i]).split(" "));
    }
    inputs.innerHTML = "<label for=\"input\">Input</label><br>\n\
    <input type=\"text\" class=\"input spaces\" name=\"input\" id=\"input0\"></input><br>";
    for(let i = 1; i < totalNumberOfTracks; i++) {
        inputs.innerHTML += "<input type=\"text\" class=\"input spaces\" name=\"input\" id=\"input" + i + "\"></input><br>";
    }
}

run = () => {
    // Set up each track
    inputPerTrack = [];
    for(let i = 0; i < totalNumberOfTracks; i++) {
        inputPerTrack.push(document.getElementById("input" + i).value);
    }

    if(interpretEditor()) {
        for(let i = 0; i < totalNumberOfTracks; i++) {
            setInputToTrack(i);
            displayTrack(i, 0);
        }
        mainUpdate = setInterval(function() {
            for(let i = 0; i < numberOfTapes; i++) {
                doNext(currentState, getCharAtCurrentCell(i), i);
            }
        }, speed);
    } else {
        alert("Issue encountered in code!");
    }
}

moveTapeRight = (tapeIdx) => {
    currentCellPerTape[tapeIdx]++;
    for(let i = 0; i < totalNumberOfTracks; i++) {
        displayTrack(i, currentCellPerTape[tapeIdx]);
    }
}

moveTapeLeft = (tapeIdx) => {
    currentCellPerTape[tapeIdx]--;
    for(let i = 0; i < totalNumberOfTracks; i++) {
        displayTrack(i, currentCellPerTape[tapeIdx]);
    }
}

getCharAtCurrentCell = () => {
    let final = "";

    for(let i = 0; i < totalNumberOfTracks; i++) {
        if(typeof leftCellsPerTrack[i][Math.abs(0 - (cell + 1))] != "undefined") {
            sq[i + (9 * trackIdx)].innerHTML = leftCellsPerTrack[trackIdx][Math.abs(0 - (cell + 1))];
        }
    }
    for(let i = 0; i < 9; i++, cell++) {
        if(cell < 0) {
            if(typeof leftCellsPerTrack[trackIdx][Math.abs(0 - (cell + 1))] != "undefined") {
                sq[i + (9 * trackIdx)].innerHTML = leftCellsPerTrack[trackIdx][Math.abs(0 - (cell + 1))];
            } else {
                sq[i + (9 * trackIdx)].innerHTML = "";
            }
        } else {
            if(typeof cellsPerTrack[trackIdx][cell] != "undefined") {
                sq[i + (9 * trackIdx)].innerHTML = cellsPerTrack[trackIdx][cell];
            } else {
                sq[i + (9 * trackIdx)].innerHTML = "";
            }
        }
    }
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
    numberOfTapes = 0;
    numberOfTracksPerTape = [];
    infiniteDirectionsPerTape = [];
    startState = "";
    finalStates = [];
    transitions = Object.create(null);
    currentStatesPerTape = [];
    currentState = "";
    squares = [];
    updateCurrentState();
}

toggleDarkMode = () => {
    document.body.classList.toggle("darkMode");
    inputs.classList.toggle("inputDarkMode");
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
let squares = [];
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
        for(let j = 0; j < numberOfTracksPerTape[i]; j++) {
            tapes.innerHTML += "\
<div class=\"machineDiv\" id=\"track" + i + j + "\">\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
    <div class=\"square\" id=\"s\"></div>\n\
</div>\n\
        "
        squares.push(document.getElementById("track" + i + j));
        }
        tapes.innerHTML += "\
<div id=\"head\">\n\
    <div class=\"triangle center\"></div>\n\
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

    // Check if the characters given in all the input are all part of the input alphabet
    for(let trackIdx = 0; trackIdx < totalNumberOfTracks; trackIdx++) {
        for(let i = 0; i < inputPerTrack[trackIdx].length; i++) {
            if(!inputAlphabet.includes(inputPerTrack[trackIdx][i])) {
                return false;
            }
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