let canvas = document.getElementById('canvas');
let body = document.querySelector('body');
let messageBox = document.getElementById('messageBox');

let ctx = canvas.getContext('2d');

let inputFormate = RegExp('[a-z0-9]');
let selected = null;
let evaluvate = [];
let isEvaluvating = false;

canvas.width = body.clientWidth
canvas.height = body.clientHeight

body.addEventListener('resize', function () {
    canvas.width = body.clientWidth;
    canvas.height = body.clientHeight;
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
let transitions;
let startState;

function init(){
    states = [];
    lines = [];
    transitions = {};
    startState = null;
}

function animate(){
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => {
        line.draw();
    });
    states.forEach(state => {
        state.update();
    });
    if(isEvaluvating){
        ctx.beginPath();
        ctx.fillText(`Evaluating : ${evaluvate.toString()}`, 10, 10);
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
    let x = e.clientX;
    let y = e.clientY;
    let i;
    for(i = 0; i<states.length; i++){
        if(distance(x, y, states[i].x, states[i].y) < radius){
            if(selected === states[i]){
                selected.color = '#000';
                selected = null;
                break;
            }
            if(selected !== null){
                let input = prompt("Enter symbol:");
                if(input === null || input === undefined || input === '' || inputFormate.test(input) === false || input.length > 1){
                    message("Invalid input", "error");
                    selected.color = '#000';
                    selected = null;
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
                        selected.color = '#000';
                        selected = null;
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
                selected.color = '#000';
                selected = null;
                break;
            }
            selected = states[i];
            selected.color = 'blue';
            break;
        }
    }
    if(i === states.length){
        states.push(new State(x, y, "q" + states.length, '#000', states.length));
    }
});

function checkForAcceptance(input){
    evaluvate = [[startState, input]];
    let i = 0;
    isEvaluvating = true;
    while(evaluvate.length > 0){
        let [state, input] = evaluvate.shift();
        console.log(state, input);
        let nextStates = nextState(state, input[0]);
        console.log("nextstates : ", nextStates, evaluvate);
        if(nextStates.length === 0 && input.length === 0){
            if(state.isFinal){
                isEvaluvating = false;
                return true;
            }
            continue;
        }
        for(let i=0; i<nextStates.length; i++){
            evaluvate.unshift([states[nextStates[i]], input.slice(1)]);
        }
    }
    isEvaluvating = false;
    return false;
}

function nextState(state, symbol){
    let keys = Object.keys(transitions[state.id]);
    let states = [];
    for(let i=0; i<keys.length; i++){
        if(transitions[state.id][keys[i]]['symbols'].includes(symbol)){
            states.push(keys[i]);
        }
    }
    return states;
}