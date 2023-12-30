let canvas = document.getElementById('canvas');
let container = document.getElementById('container');
let messageBox = document.getElementById('messageBox');
let startStateSelect = document.getElementById('startingState');
let isFinalState = document.getElementById('isFinal');
let inputString = document.getElementById('inputString');
let checkButton = document.getElementById('checkString');
let clearButton = document.getElementById('clearButton');
isFinalState.parentElement.style.display = 'none';

let ctx = canvas.getContext('2d');

let inputFormate = RegExp('[a-z0-9]');
let selected = null;
let evaluvate = [];
let isEvaluvating = false;

canvas.width = container.clientWidth
canvas.height = container.clientHeight

addEventListener('resize', function () {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
});

let radius = 25;

class State{
    constructor(x, y, text, color, id){
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.id = id;
        this.isFinal = false;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = this.color;
        ctx.fill();
        ctx.stroke();
        if(this.isFinal){
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius - 5, 0, Math.PI * 2, false);
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.closePath();
    }

    update(){
        this.draw();
    }

    toString(){
        return this.text;
    }
}

class Loop{
    constructor(x, y, text){
        this.x = x;
        this.y = y;
        this.text = text;
    }

    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = this.color;
        ctx.fill();
        ctx.stroke();
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x + radius + 5, this.y + radius + 5);
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(this.x , this.y - radius);
        ctx.lineTo(this.x - 8, this.y - radius - 8);
        ctx.lineTo(this.x - 8, this.y - radius + 8);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = 'black';
        ctx.fillText(this.text, this.x , this.y - radius - 5);
        ctx.closePath();
    }
}

class Line{
    constructor(x1, y1, x2, y2, offset, text){
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.offset = offset;
        this.text = text;
        this.angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
        this.angle += (Math.PI);
    }

    draw(){

        let xOffset = this.offset * Math.sin(this.angle);
        let yOffset = this.offset * Math.cos(this.angle);

        // console.log(xOffset, yOffset);

        ctx.beginPath();
        ctx.moveTo(this.x1 + xOffset, this.y1 + yOffset);
        ctx.lineTo(this.x2 + xOffset, this.y2 + yOffset);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.closePath();
        // add arrow and text in the middle

        let x = (this.x1 + this.x2) / 2 + xOffset;
        let y = (this.y1 + this.y2) / 2 + yOffset;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10 * Math.cos(this.angle - Math.PI /6), y + 10 * Math.sin(this.angle - Math.PI / 6));
        ctx.lineTo(x + 10 * Math.cos(this.angle + Math.PI /6), y + 10 * Math.sin(this.angle + Math.PI / 6));
        ctx.lineTo(x, y);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = 'black';
        ctx.fillText(this.text, x + 10, y - 8);
        ctx.closePath();
    }
}

function distance(x1, y1, x2, y2){
    let xDistance = x2 - x1;
    let yDistance = y2 - y1;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

let states;
let lines;
let loops;
let transitions;
let startState;

function init(){
    states = [];
    lines = [];
    loops = [];
    transitions = {};
    startState = null;
    startStateSelect.innerHTML = '<option disabled selected>--select--</option>';
}

function animate(){
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loops.forEach(loop=>{
        loop.draw();
    });
    lines.forEach(line => {
        line.draw();
    });
    if(startState !== null){
        let line = new Line(startState.x - 50, startState.y, startState.x, startState.y, 0, '');
        line.draw();
    }
    states.forEach(state => {
        state.update();
    });
    if(isEvaluvating){
        ctx.beginPath();
        ctx.font = "15px Arial";
        ctx.fillText(`Evaluating : ${evaluvate.toString()}`, 40, 20);
    }
}

function message(text, type){
    let div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(type);
    div.innerHTML = text;
    messageBox.appendChild(div);
    setTimeout(() => {
        div.classList.add('fade-out');
        setTimeout(() => {
            div.remove();
        }, 500);
    }, 3000);
}

init();
animate();

canvas.addEventListener('click', function (e) {
    let x = e.offsetX;
    let y = e.offsetY;
    let i;
    for(i = 0; i<states.length; i++){
        if(distance(x, y, states[i].x, states[i].y) < radius){
            if(selected === states[i]){
                let input = prompt("Enter symbol:");
                if(input === null || input === undefined || input === '' || inputFormate.test(input) === false || input.length > 1){
                    message("Invalid input", "error");
                    clearSelection();
                    break;
                }
                if(transitions[selected.id] === undefined){
                    transitions[selected.id] = {};
                }
                if(transitions[selected.id][states[i].id] === undefined){
                    let loop = new Loop(selected.x, selected.y - radius/4 * 3, input);
                    loops.push(loop);
                    selected.color = '#000';
                    transitions[selected.id][states[i].id] = {'line' : loop, 'symbols' : []};
                }
                else{
                    if(transitions[selected.id][states[i].id]['symbols'].includes(input)){
                        message("Transition already exists", "error");
                        clearSelection();
                        break;
                    }
                    transitions[selected.id][states[i].id]['line'].text = transitions[selected.id][states[i].id]['line'].text + ", " + input;
                }
                transitions[selected.id][states[i].id]['symbols'].push(input);
                clearSelection();
                break;
            }
            if(selected !== null){
                let input = prompt("Enter symbol:");
                if(input === null || input === undefined || input === '' || inputFormate.test(input) === false || input.length > 1){
                    message("Invalid input", "error");
                    clearSelection();
                    break;
                }
                if(transitions[selected.id] === undefined){
                    transitions[selected.id] = {};
                }
                if(transitions[selected.id][states[i].id] === undefined){
                    let line = new Line(selected.x, selected.y, states[i].x, states[i].y, 0, input);
                    lines.push(line);
                    selected.color = '#000';
                    transitions[selected.id][states[i].id] = {'line' : line, 'symbols' : []};
                }
                else{
                    if(transitions[selected.id][states[i].id]['symbols'].includes(input)){
                        message("Transition already exists", "error");
                        clearSelection();
                        break;
                    }
                    transitions[selected.id][states[i].id]['line'].text = transitions[selected.id][states[i].id]['line'].text + ", " + input;
                }
                if(transitions[states[i].id] !== undefined && transitions[states[i].id][selected.id] !== undefined){
                    console.log("opposite transition exists");
                    transitions[states[i].id][selected.id]['line'].offset = 20;
                    transitions[selected.id][states[i].id]['line'].offset = 20;
                }
                transitions[selected.id][states[i].id]['symbols'].push(input);
                clearSelection();
                break;
            }
            selected = states[i];
            clearButton.innerHTML = 'CLear Selection';
            isFinalState.parentElement.style.display = 'block';
            isFinalState.checked = selected.isFinal;
            selected.color = 'blue';
            break;
        }
    }
    if(i === states.length){
        let state = new State(x, y, "q" + states.length, '#000', states.length);
        let option = document.createElement('option');
        option.value = state.id;
        option.innerHTML = state.text;
        startStateSelect.appendChild(option);
        states.push(state);
    }
});

function checkForAcceptance(input){
    evaluvate = [[startState, input]];
    let i = 0;
    isEvaluvating = true;
    while(evaluvate.length > 0){
        let [state, input] = evaluvate.shift();
        console.log(state, input);
        if(input.length === 0 && state.isFinal){
            isEvaluvating = false;
            message("String accepted", "success");
            return true;
        }
        let nextStates = nextState(state, input[0]);
        console.log("nextstates : ", nextStates, evaluvate);
        for(let i=0; i<nextStates.length; i++){
            evaluvate.unshift([states[nextStates[i]], input.slice(1)]);
        }
    }
    isEvaluvating = false;
    message("String not accepted", "error");
    return false;
}

function clearSelection(){
    clearButton.innerHTML = 'Clear Board';
    selected.color = '#000';
    isFinalState.parentElement.style.display = 'none';
    selected = null;
}

function nextState(state, symbol){
    console.log(state, symbol);
    if(transitions[state.id] === undefined){
        return [];
    }
    let keys = Object.keys(transitions[state.id]);
    let states = [];
    for(let i=0; i<keys.length; i++){
        if(transitions[state.id][keys[i]]['symbols'].includes(symbol)){
            states.push(keys[i]);
        }
    }
    return states;
}

isFinalState.addEventListener('change', function (e) {
    selected.isFinal = this.checked;
});

startStateSelect.addEventListener('change', function (e) {
    startState = states[this.value];
});

clearButton.addEventListener('click', () =>{
    if(selected !== null)
    clearSelection();
    else
    init();
})

checkButton.addEventListener('click', function (e) {
    if(startState === null){
        message("Please select a start state", "error");
        return;
    }
    if(inputString.value === ''){
        message("Please enter a string", "error");
        return;
    }
    if(inputFormate.test(inputString.value) === false){
        message("Invalid input string", "error");
        return;
    }
    checkForAcceptance(inputString.value);
});