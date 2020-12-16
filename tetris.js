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
        block = Block()
        block.init(memory)
        interval = setInterval(timeHandler,speed,block,memory,speed)
    }
    function timeHandler(block,memory,speed) {
        if(block.fall()) return
        block.flush()
        clearInterval(interval)
        if(memory.isOver()) return
        memory.clean()
        return play(speed < 100 ? speed : speed - speed * 1 / 54)
    }
}

// modules  ===================================================================

function Memory (rows = (height / length) -1) {
    memory = {}
    while(rows >= 0){
        memory[rows] = []
        rows--
    }
    return {
        push: function (block) {
            block.get().forEach(p => memory[p.y].push(p))
        },
        clean: function () {
            let lines = []
            Object.keys(memory).forEach(y => {
                if(isFull(y)){
                    lines.push(parseInt(y))
                    memory[y].forEach(p => {
                        render('white',cell(p.x,p.y))
                    })
                    memory[y] = []
                }
            })
            this.fall(Math.max(...lines),lines.length)
        },
        fall: function (line,height) {
            Object.keys(memory).filter(y => y<=line)
                .sort((a,b) => b-a)
                .forEach(y => {
                    points = memory[y]
                    memory[y] = []
                    points.forEach(p => {
                        render('white',cell(p.x,p.y))
                        p.y += height
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
            let _figure = where === 'up' ? transform(figure) : figure
            let _head = where === 'up' ? head : shift(head,where)
            if(inBorders(this.get(_figure,_head)) &&
            !memory.clash(this.get(_figure,_head))){
                figure = _figure
                head = _head
                return true
            }
            return false
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
        return figure.map(p => {
            let x = p.y
            let y = -p.x
            return {x,y,color:p.color}
        })
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







