'use strict'

// main =======================================================================

function Game () {
    let memory
    let block
    let interval
    return {
        init: function () {
            clear()
            memory = Memory()
            play()
            return this
        }
    }
    function play (speed = 400) {
        if(block){
            block.stop()
        }
        const next = Block()
        // game over: no room to spawn the next piece
        if(memory.clash(next.get())) return
        block = next
        block.init(memory)
        interval = setInterval(timeHandler,speed,block,memory,speed)
    }
    function timeHandler(block,memory,speed) {
        if(block.fall()) return
        block.flush()
        clearInterval(interval)
        memory.clean()
        if(memory.isOver()) return
        return play(speed < 100 ? speed : speed - speed * 1 / 54)
    }
}

// modules  ===================================================================

function Memory (rows = (height / length) -1) {
    const memory = {}
    while(rows >= 0){
        memory[rows] = []
        rows--
    }
    return {
        push: function (block) {
            block.get().forEach(p => memory[p.y].push(p))
        },
        clean: function () {
            let lines = Object.keys(memory).map(Number).filter(isFull)
            if(!lines.length) return
            lines.forEach(y => {
                memory[y].forEach(p => {
                    render('white',cell(p.x,p.y))
                })
                memory[y] = []
            })
            this.fall(lines)
        },
        fall: function (lines) {
            // each row drops by the number of cleared lines below it
            Object.keys(memory).map(Number)
                .sort((a,b) => b-a)
                .forEach(y => {
                    const count = lines.filter(line => line > y).length
                    if(!count) return
                    const points = memory[y]
                    memory[y] = []
                    points.forEach(p => {
                        render('white',cell(p.x,p.y))
                        p.y += count
                        render(p.color,cell(p.x,p.y),true)
                        memory[p.y].push(p)
                    })
                })
        },
        clash: function (block) {
            let lines = block.map(p => p.y)
            return lines.some(y => {
                let cells = memory[y].map(p => p.x)
                return block.filter(p => p.y === y)
                    .some(p => cells.includes(p.x))
            })
        },
        isOver: function () {
            return memory[0].length > 0
        }
    }
    function isFull(line){
        return memory[line].length >= width / length
    }
}

function Listener(block){
    const keyHandler = ({ code }) => {
        if (!code.includes('Arrow')) return
        block.render('white')
        block.move(code.replace('Arrow','').toLocaleLowerCase())
        block.render()
    }
    return {
        start: () => document.addEventListener("keydown",keyHandler),
        stop: () => document.removeEventListener("keydown",keyHandler)
    }
}

// models  ====================================================================

function Block (){
    let figure = figures[random()]
    let head = coordinates(cell('?',0))
    let listener
    let memory
    return {
        get: function (_figure = figure, _head = head) {
            return _figure.map(p => new Object({
                x:p.x+_head.x,
                y:p.y+_head.y,
                color:p.color
            }))
        },
        render: function (color) {
            this.get().forEach(p => {
                if(!p) return
                let stroke = !color ? true : false
                render(color || p.color,cell(p.x,p.y),stroke)
            })
        },
        move: function (where) {
            if(where === 'up') return this.rotate()
            return this.place(figure,shift(head,where))
        },
        rotate: function () {
            const _figure = transform(figure)
            const from = size(figure)
            const to = size(_figure)
            // keep the bounding-box center in place
            const _head = {
                x: head.x + Math.trunc((from.w - to.w) / 2),
                y: Math.max(0, head.y + Math.trunc((from.h - to.h) / 2))
            }
            // wall kicks
            return [0, -1, 1, -2, 2]
                .some(kick => this.place(_figure,shift(_head,'right',kick)))
        },
        place: function (_figure, _head) {
            const points = this.get(_figure,_head)
            if(!inBorders(points) || memory.clash(points)) return false
            figure = _figure
            head = _head
            return true
        },
        fall: function () {
            this.render('white')
            let a = this.move('down')
            this.render()
            return a
        },
        init: function (_memory) {
            memory = _memory
            this.render()
            listener = Listener(this)
            listener.start()
            return this
        },
        stop: function() {
            listener.stop()
        },
        flush() {
            this.stop()
            memory.push(this)
        }
    }
}

const figures = [
    {path:'**-**',color:'yellow'},      // O
    {path:'*--*--*--*',color:'cyan'},   // I
    {path:'****',color:'orange'},       // L
    {path:'-*-***',color:'purple'},     // T
    {path:'-****-',color:'green'},      // Z
    {path:'**--**',color:'blue'},       // S
    {path:'--****',color:'red'}         // J
].map(figure => figure.path
    .split('')
    .map((chunck,i) => {
        if(chunck !== '*') return
        let y = Math.floor(i / 3)
        let x = i - (y * 3)
        let color = figure.color
        return {x,y,color}
    })
    .filter(v => !!v))

// utils ======================================================================

function inBorders(figure) {
    return figure.every(p => {
        let {x,y} = cell(p.x,p.y)
        return x >= 0 && x + length <= width
            && y >= 0 && y + length <= height
    })
}

function transform(figure) {
    const { w } = size(figure)
    return figure.map(p => ({ x: p.y, y: w - 1 - p.x, color: p.color }))
}

function size(figure) {
    return {
        w: Math.max(...figure.map(p => p.x)) + 1,
        h: Math.max(...figure.map(p => p.y)) + 1
    }
}

function render(
        color = 'white',
        { x, y, l } = { x: 0, y: 0, l: length },
        stroke
    ) {
    const canvas = document.getElementById('board').getContext('2d')
    canvas.fillStyle = color
    canvas.fillRect(x, y, l, l)
    if(stroke){
        canvas.strokeStyle = "rgba(105,105,105)"
        canvas.strokeRect(x+1, y+1, l-2, l-2)
    }
}

function clear() {
    render('white',{x:0,y:0,l:height})
}

function cell(x, y) {
    let randomXy = random(width / length)
    if(randomXy + 3 > (width / length)) return cell(x,y)
    return {
        x: isNaN(x) ? randomXy * length : x * length,
        y: isNaN(y) ? randomXy * length : y * length,
        l: length
    }
}

function coordinates({ x, y }) {
    return {
        x: Math.floor(x / length),
        y: Math.floor(y / length)
    }
}

function shift({ x, y }, direction, i = 1) {
    if (direction === 'left')   return { x: x - i, y }
    if (direction === 'up')     return { x, y: y - i }
    if (direction === 'right')  return { x: x + i, y }
    if (direction === 'down')   return { x, y: y + i }
}

function random(i = figures.length) {
    return Math.floor(Math.random() * i)
}

// run ========================================================================

let game = Game().init()







