const input = document.querySelector(".input");
const squares = document.querySelectorAll(".square");

let editor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    value: '// Code goes here'
});

let cells = [];

setInputToTape = () => {
    for(let i = 0; i < input.value.length; i++) {
        cells.push(input.value[i]);
    }
}

displayTape = () => {
    for(let i = 0; i < squares.length; i++) {
        squares[i] = cells[i];
    }
}

interpretEditor = () => {
    let lines = editor.getValue().split("\n");
    lines.forEach(line => alert(line));
}

compile = () => {
    setInputToTape();
    interpretEditor();
}