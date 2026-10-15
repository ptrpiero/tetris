'use strict'

// main =======================================================================

const columns = 12
const rows = 24
let length, width, height

// points for 1-4 lines cleared at once, multiplied by the level
const lineScores = [0, 100, 300, 500, 800]

function Game () {
    let memory
    let block
    let next
    let timer
    let stats
    let state = 'ready'
    return {
        init: function () {
            fitBoard()
            clear()
            Input(command)
            window.addEventListener('resize', redraw)
            window.addEventListener('orientationchange', redraw)
            document.addEventListener('visibilitychange', () => {
                if(document.hidden) pause()
            })
            show()
            return this
        },
        command
    }
    function command (name) {
        if(name === 'start') return state === 'ready' || state === 'over' ? start() : undefined
        if(name === 'restart') return start()
        if(name === 'pause') return state === 'paused' ? resume() : pause()
        if(state !== 'running') return
        if(name === 'left' || name === 'right') return act(name)
        if(name === 'rotate') return act('up')
        if(name === 'softDrop') return act('down') && addScore(1)
        if(name === 'hardDrop') return hardDrop()
    }
    function start () {
        clearTimeout(timer)
        memory = Memory()
        block = undefined
        next = Block()
        stats = { score: 0, lines: 0, level: 1 }
        clear()
        updateStats()
        state = 'running'
        show()
        spawn()
        schedule()
    }
    function pause () {
        if(state !== 'running') return
        clearTimeout(timer)
        state = 'paused'
        show()
    }
    function resume () {
        if(state !== 'paused') return
        state = 'running'
        show()
        schedule()
    }
    function over () {
        clearTimeout(timer)
        state = 'over'
        show()
        return false
    }
    function spawn () {
        const candidate = next
        next = Block()
        renderNext(next)
        // game over: no room to spawn the next piece
        if(memory.clash(candidate.get())) return over()
        block = candidate.init(memory)
        return true
    }
    function schedule () {
        clearTimeout(timer)
        timer = setTimeout(step, speed())
    }
    function step () {
        if(!act('down') && !lock()) return
        schedule()
    }
    // returns false when the game is over
    function lock () {
        block.flush()
        const cleared = memory.clean()
        if(cleared){
            stats.lines += cleared
            stats.level = 1 + Math.floor(stats.lines / 10)
            addScore(lineScores[cleared] * stats.level)
        }
        if(memory.isOver()) return over()
        return spawn()
    }
    function act (where) {
        block.render('white')
        const moved = block.move(where)
        block.render()
        return moved
    }
    function hardDrop () {
        block.render('white')
        const distance = block.drop()
        block.render()
        addScore(2 * distance)
        if(lock()) schedule()
    }
    function speed () {
        return Math.max(100, Math.round(400 * 0.85 ** (stats.level - 1)))
    }
    function addScore (points) {
        stats.score += points
        updateStats()
    }
    function updateStats () {
        Object.keys(stats).forEach(key => {
            document.getElementById(key).textContent = stats[key]
        })
    }
    function show () {
        const screens = {
            ready: { title: 'Tetris', action: 'Start', command: 'start' },
            paused: { title: 'Paused', action: 'Resume', command: 'pause' },
            over: { title: 'Game over', action: 'Play again', command: 'start' }
        }
        const screen = screens[state]
        const overlay = document.getElementById('overlay')
        overlay.hidden = !screen
        document.getElementById('pause').textContent = state === 'paused' ? 'Resume' : 'Pause'
        if(!screen) return
        overlay.querySelector('h2').textContent = screen.title
        overlay.querySelector('p').textContent = state === 'over' ? `Score ${stats.score}` : ''
        const button = overlay.querySelector('button')
        button.textContent = screen.action
        button.dataset.command = screen.command
    }
    function redraw () {
        fitBoard()
        clear()
        if(memory) memory.render()
        if(block) block.render()
        if(next) renderNext(next)
    }
}

// modules  ===================================================================

function Memory () {
    const memory = {}
    for(let y = 0; y < rows; y++){
        memory[y] = []
    }
    return {
        push: function (block) {
            block.get().forEach(p => memory[p.y].push(p))
        },
        clean: function () {
            let lines = Object.keys(memory).map(Number).filter(isFull)
            if(!lines.length) return 0
            lines.forEach(y => {
                memory[y].forEach(p => {
                    render('white',cell(p.x,p.y))
                })
                memory[y] = []
            })
            this.fall(lines)
            return lines.length
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
        },
        render: function () {
            Object.values(memory).flat()
                .forEach(p => render(p.color,cell(p.x,p.y),true))
        }
    }
    function isFull(line){
        return memory[line].length >= columns
    }
}

function Input(command) {
    const keys = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'rotate',
        ArrowDown: 'softDrop',
        Space: 'hardDrop',
        KeyP: 'pause',
        Escape: 'pause',
        Enter: 'start'
    }
    const repeatable = ['left', 'right', 'softDrop']
    document.addEventListener('keydown', event => {
        const name = keys[event.code]
        if(!name) return
        // arrow keys and space would otherwise scroll the page
        event.preventDefault()
        if(event.repeat && !repeatable.includes(name)) return
        command(name)
    })
    document.addEventListener('click', event => {
        const button = event.target.closest('button[data-command]')
        if(!button) return
        // keep Space/Enter for the game instead of re-pressing the button
        button.blur()
        command(button.dataset.command)
    })
}

// models  ====================================================================

function Block (){
    let figure = figures[random()]
    let head = { x: random(columns - size(figure).w + 1), y: 0 }
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
            this.get().forEach(p => render(color || p.color,cell(p.x,p.y),!color))
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
        drop: function () {
            let distance = 0
            while(this.move('down')) distance++
            return distance
        },
        shape: function () {
            return figure
        },
        init: function (_memory) {
            memory = _memory
            this.render()
            return this
        },
        flush() {
            memory.push(this)
        }
    }
}

const figures = [
    {path:'**-**',color:'yellow'},      // O
    {path:'*--*--*--*',color:'cyan'},   // I
    {path:'--****',color:'orange'},     // L
    {path:'*--***',color:'blue'},       // J
    {path:'-*-***',color:'purple'},     // T
    {path:'-****-',color:'green'},      // S
    {path:'**--**',color:'red'}         // Z
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
    return figure.every(p => p.x >= 0 && p.x < columns && p.y >= 0 && p.y < rows)
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
        stroke,
        canvas = document.getElementById('board').getContext('2d')
    ) {
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

function fitBoard() {
    const stage = document.getElementById('stage')
    // minus the canvas border
    length = Math.max(1, Math.floor(Math.min(
        (stage.clientWidth - 2) / columns,
        (stage.clientHeight - 2) / rows
    )))
    width = columns * length
    height = rows * length
    const board = document.getElementById('board')
    scale(board, width, height)
}

// sharp rendering on high-density screens: draw in css pixels on a
// backing store of devicePixelRatio times the size
function scale(canvas, w, h) {
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.round(w * ratio)
    canvas.height = Math.round(h * ratio)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
}

function renderNext(block) {
    const preview = document.getElementById('next')
    const l = 12
    scale(preview, 4 * l, 4 * l)
    const canvas = preview.getContext('2d')
    const { w, h } = size(block.shape())
    block.shape().forEach(p => render(p.color, {
        x: (p.x + (4 - w) / 2) * l,
        y: (p.y + (4 - h) / 2) * l,
        l
    }, true, canvas))
}

function cell(x, y) {
    return { x: x * length, y: y * length, l: length }
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

const game = Game().init()







