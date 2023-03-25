const input = document.querySelector(".input");
const editor = document.querySelector(".editor");
const squares = document.querySelectorAll(".square");

setInputToTape = () => {
    for(let i = 0; i < input.value.length; i++) {
        squares[i].innerHTML = input.value[i];
    }
}

interpretEditor = () => {
    alert(editor.value);
    // let lines = editor.value.split("\n");
    // lines.forEach(line => alert(line));
}

compile = () => {
    setInputToTape();
    interpretEditor();
}