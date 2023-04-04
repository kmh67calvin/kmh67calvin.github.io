const inputs = document.getElementById("inputs");
const machine = document.querySelector(".machineDiv");
const speedInput = document.getElementById("speedSlider");
const showCurrentState = document.getElementById("currentState");
const loader = document.getElementById("loader");
const tapes = document.getElementById("tapes");
const fr = new FileReader();
const rerunButton = document.getElementById("rerunButton");
const recognizeText = document.getElementById("recognizeText");
let mainUpdate;

loader.addEventListener('change', (event) => {
    fr.readAsText(loader.files[0]);
});

fr.addEventListener('load', (event) => {
    editor.setValue(event.target.result);
    compile();
});

let editor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    value: '\
ATM // Specify start\n\
EXAMPLE: Bitstrings that start with 0 // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 // Tape Alphabet, blank is _\n\
1 // Number of Tapes\n\
1 // Numbers of Tracks on Tape 0\n\
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

document.querySelector(".editor").addEventListener("keyup", () => {
    compile();
});

let cellsPerTapePerTrack = [];
let leftCellsPerTapePerTrack = [];
let currentCellPerTape = [];
let speed = 1001 - speedInput.value;
let totalNumberOfTracks = 0;
let inputPerTrack = [];
let previousTotalNumberOfTracks = 0;
let previousNumberOfTapes = 0;
let inputAlphabet = [];
let tapeAlphabet = [];
let numberOfTapes = 0;
let numberOfTracksPerTape = [];
let infiniteDirectionsPerTape = [];
let startState = "";
let finalStates = [];
let transitions = Object.create(null);
let squares = [];
let currentState = "";
let errorLine = 0;

setInputToCellData = () => {
    // Used to keep track of the "global" (not in relation to tapes) number of tracks completed
    let currentTrack = 0;
    
    // Push tapes
    for(let tapeIdx = 0; tapeIdx < numberOfTapes; tapeIdx++) {
        cellsPerTapePerTrack.push([]);
        leftCellsPerTapePerTrack.push([]);        

        // Push tracks
        let trackCount = numberOfTracksPerTape[tapeIdx];
        for(let trackIdx = 0; trackIdx < trackCount; trackIdx++, currentTrack++) {
            cellsPerTapePerTrack[tapeIdx].push([]);
            leftCellsPerTapePerTrack[tapeIdx].push([]);

            // Push individual values from input string(s)
            for(let cellIdx = 0; cellIdx < inputPerTrack[currentTrack].length; cellIdx++) {
                cellsPerTapePerTrack[tapeIdx][trackIdx].push(inputPerTrack[currentTrack][cellIdx]);
            }
        }
    }
}

displayTracksPerTape = (tapeIdx) => {
    let trackCount = numberOfTracksPerTape[tapeIdx];
    for(let trackIdx = 0; trackIdx < trackCount; trackIdx++) {
        // cell is offset by 4 because the first square in a track is 4 left from the cell over which is the head (i.e. the center square)
        for(let squareIdx = 0, cell = (currentCellPerTape[tapeIdx] - 4); squareIdx < 9; squareIdx++, cell++) {
            if(cell < 0) {
                if(typeof leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(0 - (cell + 1))] != "undefined" && leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(0 - (cell + 1))] != "_") {
                    squares[tapeIdx][trackIdx][squareIdx].innerHTML = leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(0 - (cell + 1))];
                } else {
                    squares[tapeIdx][trackIdx][squareIdx].innerHTML = "";
                }
            } else {
                if(typeof cellsPerTapePerTrack[tapeIdx][trackIdx][cell] != "undefined" && cellsPerTapePerTrack[tapeIdx][trackIdx][cell] != "_") {
                    squares[tapeIdx][trackIdx][squareIdx].innerHTML = cellsPerTapePerTrack[tapeIdx][trackIdx][cell];
                } else {
                    squares[tapeIdx][trackIdx][squareIdx].innerHTML = "";
                }
            }
        }
    }
}

clearCells = () => {
    cellsPerTapePerTrack = [];
    leftCellsPerTapePerTrack = [];
    currentCellPerTape = [];
}

compile = () => {
    clearInterval(mainUpdate);
    rerunButton.disabled = true;
    recognizeText.innerHTML = "N/A";
    totalNumberOfTracks = 0;
    let lines = editor.getValue().split("\n");
    numberOfTapes = removeComment(lines[4]).split(" ");
    infiniteDirectionsPerTape = [];
    for(let i = 0; i < numberOfTapes; i++) {
        totalNumberOfTracks += parseInt(removeComment(lines[5 + i]).split(" "));
        infiniteDirectionsPerTape.push(parseInt(removeComment(lines[parseInt(numberOfTapes) + 5 + i]).split(" ")));
    }

    if(totalNumberOfTracks != previousTotalNumberOfTracks || numberOfTapes != previousNumberOfTapes.toString()) {
        inputs.innerHTML = "<label for=\"input\">Input</label><br>\n\
        <input type=\"text\" class=\"input spaces\" name=\"input\" id=\"input0\"></input><br>";
        for(let i = 1; i < totalNumberOfTracks; i++) {
            inputs.innerHTML += "<input type=\"text\" class=\"input spaces\" name=\"input\" id=\"input" + i + "\"></input><br>";
        }
        previousTotalNumberOfTracks = totalNumberOfTracks;
        previousNumberOfTapes = numberOfTapes;

        tapes.innerHTML = "";
        numberOfTracksPerTape = [];
        squares = [];
        for(let i = 0; i < numberOfTapes; i++) {
            // New array to push squares of each track into
            squares.push([]);

            numberOfTracksPerTape.push(parseInt(removeComment(lines[5 + i]).split(" ")));

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
        }
        // Add the head of the current tape
        tapes.innerHTML += "\
<div id=\"head\">\n\
    <div class=\"triangle center\"></div>\n\
</div>"
        }
    }
}

run = () => {
    reset();

    // Set up each track
    inputPerTrack = [];
    for(let i = 0; i < totalNumberOfTracks; i++) {
        inputPerTrack.push(document.getElementById("input" + i).value);
    }
    
    if(interpretEditor()) {
        setInputToCellData();

        for(let i = 0; i < numberOfTapes; i++) {
            currentCellPerTape.push(0);
            displayTracksPerTape(i);
        }

        mainUpdate = setInterval(function() {
            doNext(currentState, getCharAtCurrentCell());
        }, speed);

    } else {
        alert("Issue encountered in code at line " + errorLine + "!");
    }
}

moveTapeRight = (tapeIdx) => {
    currentCellPerTape[tapeIdx]++;
    displayTracksPerTape(tapeIdx);
}

moveTapeLeft = (tapeIdx) => {
    if(infiniteDirectionsPerTape[tapeIdx] == "1") {
        crash("Segmentation Fault");
    } else {
        currentCellPerTape[tapeIdx]--;
        displayTracksPerTape(tapeIdx);
    }
}

getCharAtCurrentCell = () => {
    let final = "";
    for(let tapeIdx = 0; tapeIdx < numberOfTapes; tapeIdx++) {
        for(let trackIdx = 0; trackIdx < numberOfTracksPerTape[tapeIdx]; trackIdx++) {
            if(currentCellPerTape[tapeIdx] < 0) {
                // Look at left infinite cells
                if(typeof leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(currentCellPerTape[tapeIdx] + 1)] == "undefined" || leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(currentCellPerTape[tapeIdx] + 1)] == "") {
                    final += "_+";
                } else {
                    final += leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(currentCellPerTape[tapeIdx] + 1)] + "+";
                }
            } else {
                // Look at right infinite cells
                if(typeof cellsPerTapePerTrack[tapeIdx][trackIdx][currentCellPerTape[tapeIdx]] == "undefined" || cellsPerTapePerTrack[tapeIdx][trackIdx][currentCellPerTape[tapeIdx]] == "") {
                    final += "_+";
                } else {
                    final += cellsPerTapePerTrack[tapeIdx][trackIdx][currentCellPerTape[tapeIdx]] + "+";
                }
            }
        }
    }
    
    // Remove the final, hanging "+"
    final = final.slice(0, -1);
    
    return(final);
}

speedInput.addEventListener("mouseup", function() {
    speed = 1001 - speedInput.value;
}, false);

reset = () => {
    // tapes.innerHTML = "";
    clearInterval(mainUpdate);
    clearCells();
    
    inputAlphabet = [];
    tapeAlphabet = [];
    // numberOfTapes = 0;
    // numberOfTracksPerTape = [];
    // infiniteDirectionsPerTape = [];
    startState = "";
    finalStates = [];
    transitions = Object.create(null);
    currentState = "";
    // squares = [];
    updateCurrentState();
    rerunButton.disabled = true;
    recognizeText.innerHTML = "N/A";
}

toggleDarkMode = () => {
    document.body.classList.toggle("darkMode");
    inputs.classList.toggle("inputDarkMode");
    document.querySelector(".box").classList.toggle("boxDarkMode");
}

updateCurrentState = () => {
    showCurrentState.innerHTML = "Current State: " + currentState;
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
    
    for(let tapeIdx = 0; tapeIdx < numberOfTapes; tapeIdx++) {
        for(let trackIdx = 0; trackIdx < numberOfTracksPerTape[tapeIdx]; trackIdx++) {
            // Push individual tracks
            squares[tapeIdx].push(document.getElementById("track" + tapeIdx + trackIdx).children);
        }
    }

    startState = currentState = removeComment(lines[(2 * numberOfTapes) + 5]).split(" ");
    finalStates = removeComment(lines[(2 * numberOfTapes) + 6]).split(" ");

    // Remove the config lines, leaving only the transitions
    lines.splice(0, (2 * numberOfTapes) + 7);
    
    // Interpret lines describing transition functions
    errorLine = (2 * numberOfTapes) + 7 + 1;
    for(let i = 0; i < lines.length; i++, errorLine++) {
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
    
    // Parse the next cell value info and next direction info
    newCellChars = transitionInfo[3].split("+");
    newDirections = transitionInfo[4].split("+");

    // Check that the next cell values and next directions are valid
    if(newCellChars.length != totalNumberOfTracks || newDirections.length != numberOfTapes) {
        return false;
    }

    for(let i = 0; i < newCellChars.length; i++) {
        if(!tapeAlphabet.includes(newCellChars[i])){
            return false;
        }
    }

    // And that the next direction is either R or L
    for(let i = 0; i < newDirections.length; i++) {
        if(newDirections[i].toLowerCase() != "r" && newDirections[i].toLowerCase() != "l") {
            return false;
        }
    }

    transitions[transitionInfo[0] + "," + transitionInfo[1]] = {nextState: transitionInfo[2], nextCellValuePerTrack: newCellChars, nextDirectionPerTape: newDirections};
    return true;
}

removeComment = (lineToParse) => {
    return lineToParse.split("//")[0].trim();
}

// Executing the machine
doNext = (state, cellValue) => {
    let currentGlobalTrack = 0;
    let instructions = transitions[state + "," + cellValue];

    if(typeof instructions != "undefined") {
        currentState = instructions.nextState;
        updateCurrentState();

        for(let tapeIdx = 0; tapeIdx < numberOfTapes; tapeIdx++) {
            for(let trackIdx = 0; trackIdx < numberOfTracksPerTape[tapeIdx]; trackIdx++, currentGlobalTrack++) {
                if(infiniteDirectionsPerTape[tapeIdx] == "2" && currentCellPerTape[tapeIdx] < 0) {
                    leftCellsPerTapePerTrack[tapeIdx][trackIdx][Math.abs(0 - (currentCellPerTape[tapeIdx] + 1))] = instructions.nextCellValuePerTrack[currentGlobalTrack];
                } else if (currentCellPerTape[tapeIdx] >= 0) {
                    cellsPerTapePerTrack[tapeIdx][trackIdx][currentCellPerTape[tapeIdx]] = instructions.nextCellValuePerTrack[currentGlobalTrack];
                }
            }

            if(instructions.nextDirectionPerTape[tapeIdx].toLowerCase() == "r") {
                moveTapeRight(tapeIdx);
            } else {
                moveTapeLeft(tapeIdx);
            }
        } 
    } else {
        // Machine has halted
        if(finalStates.includes(currentState)) {
            recognized();
        } else {
            notRecognized();
        }
        rerunButton.disabled = false;
    }
}

recognized = () => {
    clearInterval(mainUpdate);
    recognizeText.innerHTML = "Recognized";
}

notRecognized = () => {
    clearInterval(mainUpdate);
    recognizeText.innerHTML = "Not Recognized";
}

crash = (errorMessage) => {
    clearInterval(mainUpdate);
    recognizeText.innerHTML = "Crashed: " + errorMessage;
}

rerunWithCurrentOutput = () => {
    recognizeText.innerHTML = "N/A";
    currentState = startState;
    updateCurrentState();

    currentCellPerTape = []
    for(let i = 0; i < numberOfTapes; i++) {
        currentCellPerTape.push(0);
        displayTracksPerTape(i);
    }

    mainUpdate = setInterval(function() {
        doNext(currentState, getCharAtCurrentCell());
    }, speed);
}

// Examples
const exampleSelector = document.getElementById("exampleSelector");
loadExample = () => {
    editor.setValue(baseExamples[exampleSelector.options[exampleSelector.selectedIndex].id]);
    compile();
}

let baseExamples = new Object(null);
// Example keys are the id of the selection option that should load the example
baseExamples["bstringsStartWith0"] = "\
ATM // Specify start\n\
EXAMPLE: Bitstrings that start with 0 // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 // Tape Alphabet, blank is _\n\
1 // Number of Tapes\n\
1 // Numbers of Tracks on Tape 0\n\
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
";

baseExamples["bstringsEndWithTwo0"] = "\
ATM // Specify start\n\
EXAMPLE: Bitstrings that end in 2 zeros // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 ✔️ ❌ // Tape Alphabet, blank is _\n\
1 // Number of Tapes\n\
1 // Numbers of Tracks on Tape 0\n\
2 // Tape 0 is 2-way infinite\n\
s0 // Initial State, states are seperated by spaces\n\
s2 // Accepting State(s)\n\
s0 0 s1 ✔️ R // Transitions <state> <cell value> <next state> <next cell value> <next direction>\n\
s0 1 s0 ❌ R\n\
s1 0 s2 ✔️ R\n\
s1 1 s0 ❌ R\n\
s2 0 s2 ✔️ R\n\
s2 1 s0 ❌ R\n\
END // Specify end\
";

baseExamples["bstringsStartWith10|00"] = "\
ATM // Specify start\n\
EXAMPLE(MultiTrack): Bitstrings that start with 10 or 00 // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 _ // Tape Alphabet, blank is _\n\
2 // Number of Tapes\n\
1 // Number of Tracks on Tape 0\n\
2 // Number of Tracks on Tape 1\n\
2 // Tape 0 is 2-way infinite\n\
1 // Tape 1 is 1-way infinite\n\
sN // Initial State, states are seperated by spaces\n\
s10 or s00 // Accepting State(s)\n\
sN 0+_+_ s0 0+0+_ R+R // Transitions <state> <cell value> <next state> <next cell value> <next direction>\n\
sN 1+_+_ s1 1+1+_ R+R\n\
s0 0+_+_ s00 0+0+_ R+R\n\
s0 1+_+_ sG 1+1+_ R+R\n\
s1 0+_+_ s10 0+0+_ R+R\n\
s1 1+_+_ sG 1+1+_ R+R\n\
s00 0+_+_ s00 0+0+_ R+R\n\
s00 1+_+_ s00 1+1+_ R+R\n\
s10 0+_+_ s10 0+0+_ R+R\n\
s10 1+_+_ s10 1+1+_ R+R\n\
sG 0+_+_ sG 0+0+_ R+R\n\
sG 1+_+_ sG 1+1+_ R+R\n\
END // Specify end\
";

baseExamples["bouncer"] = "\
ATM // Specify start\n\
EXAMPLE: Bouncer // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 _ // Tape Alphabet, blank is _\n\
1 // Number of Tapes\n\
1 // Numbers of Tracks on Tape 0\n\
2 // Tape 0 is 2-way infinite\n\
sR // Initial State, states are seperated by spaces\n\
s0 // Accepting State(s)\n\
sR 0 sR 0 R // Transitions <state> <cell value> <next state> <next cell value> <next direction>\n\
sR 1 sR 1 R\n\
sR _ sL 0 L\n\
sL 0 sL 0 L\n\
sL 1 sL 1 L\n\
sL _ sR 1 R\n\
END // Specify end\
";

baseExamples["quickStart"] = "\
ATM\n\
Quick Start // Machine Name\n\
0 1 // Input Alphabet\n\
0 1 _ // Tape Alphabet, blank is _\n\
1 // Number of Tapes\n\
1 // Numbers of Tracks on Tape 0\n\
2 // Tape 0 is 2-way infinite\n\
s0 // Initial State\n\
s0 // Accepting State(s)\n\
s0 0 s0 0 R // Transitions\n\
END\
";