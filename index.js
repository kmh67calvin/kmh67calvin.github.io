const input = document.querySelector(".input");
const squares = document.querySelectorAll(".square");
const machine = document.querySelector(".machineDiv");
machine.style.left = "0px";

let editor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    value: '// Code goes here'
});

let cells = [];
let leftCells = [];
let currentCell = 0;

setInputToTape = () => {
    for(let i = 0; i < input.value.length; i++) {
        cells.push(input.value[i]);
    }
}

displayTape = () => {
    for(let i = 0; i < squares.length; i++) {
        if(typeof cells[i] != "undefined") {
            squares[i].innerHTML = cells[i];
        }
    }
}

interpretEditor = () => {
    let lines = editor.getValue().split("\n");
    lines.forEach(line => alert(line));
}

compile = () => {
    setInputToTape();
    displayTape();
    interpretEditor();
    moveTapeRight();    
}

moveTapeRight = () => {
    machine.style.left = parseInt(machine.style.left) + 62 + "px";
    currentCell++;
}

moveTapeLeft = () => {
    machine.style.left = parseInt(machine.style.left) - 62 + "px";
    currentCell--;
}