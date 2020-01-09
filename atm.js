class EventEmitter {
    constructor() {
        this._events = {};
    }
    on(evt, listener) {
        (this._events[evt] || (this._events[evt] = [])).push(listener);
        return this;
    }
    emit(evt, arg) {
        (this._events[evt] || []).slice().forEach(lsn => lsn(arg));
    }
}

class Model extends EventEmitter {
    constructor() {
        super();
        this.atmArr = [];
        this.personArr = [];
        this.timersArr = [];
        this.pause = true;
    }

    startGame() {
        this.createAtm();
        this.initQueue();
    }

    createAtm() {
        for (let i = 0; i < 3; i++) {
            this.atmArr.push(new Atm(i + 1));
        }

        this.atmArr.forEach(item => item.on('stateChanged', item => this.checkFreeAtm(item)));

        this.emit('atmsAdded', this.atmArr);
    }

    initQueue() {
        this.timersArr.push(this.createTimerObj(this.createPerson.bind(this), [], 2000));
    }

    createPerson() {
        if (this.personArr.length < 9) {
            let person = new Person();
            this.personArr.push(person);
            person.setServeTime();
            this.emit('personAdded', person);
        }

        if (this.personArr.length == 1) {
            this.timersArr.push(this.createTimerObj(this.checkFreeAtm.bind(this), [], 400));
        }

        this.timersArr.push(this.createTimerObj(this.createPerson.bind(this), [], 1000));
    }

    createTimerObj (callback, args, delay) {
        let timer = {};
        timer.callback = callback;
        timer.args = args;
        timer.delay = delay;
        timer.start = Date.now();//начало выполнения
        timer.end = Date.now() + delay;//когда должно закончить
        timer.id = setTimeout(() => timer.callback(...timer.args), timer.delay);
        return timer;
    }

    checkFreeAtm(obj) {
        let freeAtm;

        if(!obj) {
            freeAtm = this.atmArr.find(item => {
                if (item.freeState) {
                    return item;
                }
            })
        } else freeAtm = obj;

        if (this.personArr[0] && freeAtm && freeAtm.freeState) {
            this.movePerson(this.personArr[0], freeAtm);
            this.personArr.shift();
            this.emit('stateChanged', freeAtm);
        }
    }

    movePerson(person, freeAtm) {
        freeAtm.freeState = false;
        this.emit('personMove', [person, freeAtm]);
        this.timersArr.push(this.createTimerObj(this.removePerson.bind(this), [person, freeAtm], person.serveTime ));
    }

    removePerson(person, freeAtm) {
        this.emit('removePerson', person);
        freeAtm.changeState();
        this.emit('stateChanged', freeAtm);
    }

    stopGame() {
        this.timersArr.forEach(item => clearTimeout(item.id));
        this.timersArr.length = 0;
        this.atmArr.length = 0;
        this.personArr.length = 0;
    }

    pauseGame() {
        this.timersArr.forEach(item => {
            item.remain = item.end - Date.now();
            clearTimeout(item.id);
        });
    }

    resumeGame() {
        this.timersArr.forEach(item => {
            if(item.remain < 0) {
                return;
            }
            item.id = setTimeout(() => item.callback(...item.args), item.remain);
        });
        this.timersArr = [];
    }
}

class View extends EventEmitter {
    constructor(model, container) {
        super();
        this._model = model;
        this.container = container;

        // attach model listeners
        model.on('atmsAdded', atmArr => this.createAtm(atmArr))
            .on('personAdded', person => this.drawPerson(person))
            .on('personMove', (args) => this.movePerson(args[0], args[1]))
            .on('removePerson', person => this.removePerson(person))
            .on('stateChanged', freeAtm => this.changeAtmColor(freeAtm))
    }

    init() {
        this.createBtns();
        this.createGameBlock();
        this.container.append(this.btnDiv, this.gameBlock);
        this.addBtnListen();
    }

    createBtns() {
        this.btnDiv = document.createElement('div');
        this.btnDiv.className = 'btn_wrapper';
        this.startBtn = document.createElement('button');
        this.stopBtn = document.createElement('button');
        this.pauseBtn = document.createElement('button');
        this.startBtn.className = 'start btn';
        this.stopBtn.className = 'stop btn';
        this.pauseBtn.className = 'pause btn';
        this.startBtn.innerText = 'СТАРТ';
        this.stopBtn.innerText = 'СТОП';
        this.pauseBtn.innerText = 'ПАУЗА';
        this.btnDiv.append(this.startBtn, this.stopBtn, this.pauseBtn);
    }

    createGameBlock() {
        this.gameBlock = document.createElement('div');
        this.gameBlock.className = 'game_wrapper';
        this.atmBlock = document.createElement('div');
        this.atmBlock.className = 'atm_block';
        this.queueBlock = document.createElement('div');
        this.queueBlock.className = 'queue_block';
        this.gameBlock.append(this.atmBlock, this.queueBlock);
    }

    addBtnListen() {
        this.btnDiv.addEventListener('click', e => {
            switch (e.target.innerText) {
                case 'СТАРТ':
                    this.emit('startButtonClicked');
                    break;
                case 'СТОП':
                    this.emit('stopButtonClicked');
                    break;
                case 'ПАУЗА':
                    this.emit('pauseButtonClicked');
                    break;
                case 'ПРОДОЛЖИТЬ':
                    this.emit('pauseButtonClicked');
                    break;
            }
        });
    }

    blockStartBtn() {
        this.startBtn.disabled = true;
    }

    unblockStartBtn() {
        this.startBtn.disabled = false;
    }

    removeElems() {
        while (this.atmBlock.firstChild) {
            this.atmBlock.removeChild(this.atmBlock.firstChild);
        }

        while (this.queueBlock.firstChild) {
            this.queueBlock.removeChild(this.queueBlock.firstChild);
        }
    }

    createAtm(arr) {
        arr.forEach(item => item.createAtm());
        arr.forEach(item => this.atmBlock.append(item.atmItem));
        arr.forEach(item => item.getBottomCoords());
    }

    drawPerson(person) {
        person.createPerson();
        person.personBlock.style.backgroundColor = person.color;
        this.queueBlock.append(person.personBlock);
    }

    movePerson(person, freeAtm) {
        person.personBlock.style.position = 'absolute'
        person.personBlock.style.top = freeAtm.bottom + 'px';
        person.personBlock.style.left = freeAtm.center - person.personBlock.offsetWidth/2 + 'px';
    }

    removePerson(person) {
        person.personBlock.remove();
    }

    changeAtmColor(freeAtm) {
        freeAtm.changeColor();
    }

    changeBtnValue(pause) {
        if (pause) {
            this.pauseBtn.innerText = 'ПАУЗА';
        } else this.pauseBtn.innerText = 'ПРОДОЛЖИТЬ';
    }
}

/**
 * The Controller. Controller responds to user actions and
 * invokes changes on the model.
 */
class Controller {
    constructor(model, view) {
        this._model = model;
        this._view = view;
        this.pause = true;

        view.on('startButtonClicked', () => this.startGame());
        view.on('stopButtonClicked', () => this.stopGame());
        view.on('pauseButtonClicked', () => this.pauseResumeGame());
    }

    startGame() {
        this._model.startGame();
        this._view.blockStartBtn();
    }

    stopGame() {
        this._model.stopGame();
        this._view.removeElems();
        this._view.unblockStartBtn();
    }

    pauseResumeGame() {
        if (this.pause) {
            this.pause = false;
            this._model.pauseGame();
        } else {
            this.pause = true;
            this._model.resumeGame();
        }

        this._view.changeBtnValue(this.pause);
    }
}


class Atm extends EventEmitter{
    constructor(id) {
        super();
        this.freeState = true;
        this.id = id;
    }

    createAtm() {
        this.atmItem = document.createElement('div');
        this.atmItem.className = 'atm_item';
    }

    getBottomCoords() {
        this.bottom = this.atmItem.offsetTop + this.atmItem.offsetHeight;
        this.center = this.atmItem.offsetLeft + this.atmItem.offsetWidth/2;
    }

    changeColor() {
        if (this.freeState) {
            this.atmItem.style.backgroundColor = 'green';
        } else this.atmItem.style.backgroundColor = 'red';
    }

    changeState() {
        if(this.freeState) {
            this.freeState = false;
        } else {
            this.freeState = true;
            this.emit('stateChanged', this);
        }
    }



}

class Person {
    constructor() {

    }

    createPerson() {
        this.personBlock = document.createElement('div');
        this.personBlock.className = 'person';
        this.generateColor();
    }

    setServeTime() {
        this.serveTime = Math.random() * (6000 - 2000) + 2000;
    }

    generateColor() {
        this.color = '#' + Math.floor(Math.random()*16777215).toString(16);
    }
}



const container = document.querySelector('.div_app');
const model = new Model();
const view = new View(model, container);
const controller = new Controller(model, view);
view.init();