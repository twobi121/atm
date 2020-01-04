
function View(container) {
    this.container = container;
    this.id = 1;

    this.init = function () {
        this.createBtns();
        this.createGameBlock();
        this.container.append(this.btnDiv, this.gameBlock);
    }

    this.createBtns = function () {
        this.btnDiv = document.createElement('div');
        this.btnDiv.className = 'btn_wrapper';
        this.startBtn = document.createElement('button');
        this.stopBtn = document.createElement('button');
        this.startBtn.className = 'start btn';
        this.stopBtn.className = 'stop btn';
        this.startBtn.innerText = 'СТАРТ';
        this.stopBtn.innerText = 'СТОП';
        this.btnDiv.append(this.startBtn, this.stopBtn);
    }

    this.createGameBlock = function() {
        this.gameBlock = document.createElement('div');
        this.gameBlock.className = 'game_wrapper';
        this.atmBlock = document.createElement('div');
        this.atmBlock.className = 'atm_block';
        this.queueBlock = document.createElement('div');
        this.queueBlock.className = 'queue_block';
        this.gameBlock.append(this.atmBlock, this.queueBlock);
    }

    this.createAtm = function (arr) {

        arr.forEach(item => item.createAtm());
        arr.forEach(item => this.atmBlock.append(item.atmItem));
        arr.forEach(item => item.getBottomCoords());
    }

    this.drawPerson = function (person) {
        person.createPerson();
        person.personBlock.setAttribute('idd', this.id);
        ++this.id;
        person.personBlock.style.backgroundColor = this.generateColor();
        this.queueBlock.append(person.personBlock);
    }

    this.movePerson = function(person, freeAtm) {
        person.personBlock.style.position = 'absolute'
        person.personBlock.style.top = freeAtm.bottom + 'px';
        person.personBlock.style.left = freeAtm.center - person.personBlock.offsetWidth/2 + 'px';

    }

    this.removePerson = function(person) {
        person.personBlock.remove();
    }

    this.generateColor = function () {
        return '#' + Math.floor(Math.random()*16777215).toString(16)
    }

}

function Model (view) {
    this.view = view;
    this.atmArr = [];
    this.personArr = [];
    this.queueLength = 0;

    this.startGame = function() {
        this.createAtm();
        this.initQueue();
    }

    this.createAtm = function() {
        for (let i = 0; i < 3; i++) {
            this.atmArr.push(new Atm(i + 1));
        }

        this.proxyArr = [];
        this.atmArr.forEach(item => {
            this.proxyArr.push(this.setProxy.call(this, item))
        });


        this.view.createAtm(this.proxyArr);
    }

    this.setProxy = function(target) {
        let that = this;
        return new Proxy(target, {
            set(target, prop, val) { // для перехвата записи свойств
                if (prop == 'freeState' && val) {
                    target[prop] = true;
                    that.checkFreeAtm(target.id);
                    return true;
                } else if (prop == 'freeState' && !val) {
                    target[prop] = false;
                    return true;
                } else {
                    target[prop] = val;
                    return true;
                }
            }
        })
    }


    this.initQueue = function() {

        setTimeout(() => this.createPerson(), 2000);
        // setTimeout(() => {
        //     this.proxyArr.forEach(item => this.checkFreeAtm(item))
        // }, 3000);

    }

    this.createPerson = function() {

        if (this.personArr.length < 9) {
            let person = new Person();
            this.personArr.push(person);
            person.setServeTime();
            this.view.drawPerson(person);
        }

        if (this.personArr.length == 1) {
            this.checkFreeAtm();
        }



        
        setTimeout(() => this.createPerson(), 600);
    }

    this.checkFreeAtm = function(obj) {
        let freeAtm;
        // debugger
        if(!obj) {
            freeAtm = this.proxyArr.find(item => {
                if (item.freeState) {
                    return item;
                }
            })
        } else if (typeof(obj) == 'number') {
            let number = obj - 1;
            freeAtm = this.proxyArr[number];
        } else freeAtm = obj;

        if (this.personArr[0] && freeAtm && freeAtm.freeState) {
            this.movePerson(this.personArr[0], freeAtm);
            this.personArr.shift();
        }
        
        // setTimeout(() => this.checkFreeAtm(), 2000);
    }

    this.movePerson = function(person, freeAtm) {
        freeAtm.freeState = false;
        this.view.movePerson(person, freeAtm);
        setTimeout( () => this.removePerson(person, freeAtm), 3000);
    }

    this.removePerson = function(person, freeAtm) {
        this.view.removePerson(person);
        freeAtm.freeState = true;
    }
    
}


function Controller (model, container) {
    this.model = model;
    this.container = container;

    this.init = function() {
        this.btnDiv = document.querySelector('.btn_wrapper');
        this.addBtnListen();
    }

    this.addBtnListen = function () {
        this.btnDiv.addEventListener('click', (event) => {
            let e = event.target;
            if (e.innerText == 'СТАРТ') {
                this.startGame();
            } else this.stopGame();
        });
    }

    this.startGame = function() {
        this.model.startGame();
    }

    this.stopGame = function() {
        this.model.stopGame();
    }
    
}


class Atm {
    constructor(id) {
        this.freeState = true;
        this.id = id;
    }

    createAtm() {
        this.atmItem = document.createElement('div');
        this.atmItem.className = 'atm_item'; 
    }

    getBottomCoords() {
        this.bottom = this.atmItem.offsetTop + this.atmItem.offsetHeight;
        this.center = this.atmItem.offsetLeft + this.atmItem.offsetWidth/4;
    }
}


class Person {
    constructor() {

    }

    createPerson() {
        this.personBlock = document.createElement('div');
        this.personBlock.className = 'person';
    }

    setServeTime() {
        this.serveTime = Math.random() * (6000 - 2000) + 2000;
    }
}

class Queue {
    constructor() {

    }

}

const container = document.querySelector('.div_app');
const view = new View(container);
const model = new Model(view);
const controller = new Controller(model, container);
view.init(); 
controller.init();


