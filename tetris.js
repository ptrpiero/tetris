


// models  =========================================

const colors = [
    'red',
    'green',
    'blue',
    'yellow'
]

const figures = [
    square,
    line,
    elle,
    barre    
] = [
    "**-**",
    "*--*--*",
    "****",
    "-*-***",
].map(figure => {
    return figure
        .split('')
        .map((chunck,i) => {
            if(chunck !== '*') return
            let y = Math.floor(i / 3)
            let x = i - (y * 3)
            return {x,y}
        })
        .filter(v => v)
})

const Block = function (
    color = colors[random()],
    figure = figures[random()],
    start = coordinates(cell('?',0))
){
    return {
        render:() => figure.forEach(p => {
            if(!p) return
            p.x += start.x
            p.y += start.y
            render(color,cell(p.x,p.y))
        })
    }
}

// game =========================================

// utils ===================================

function render(color = 'white', { x, y, l } = { x: 0, y: 0, l: width }) {
    const canvas = document.getElementById('board').getContext('2d')
    canvas.fillStyle = color
    canvas.fillRect(x, y, l, l)
}

function cell(x, y) {
    return {
        x: isNaN(x) ?
            Math.floor(Math.random() * width / length) * length :
            x * length,
        y: isNaN(y) ?
            Math.floor(Math.random() * width / length) * length :
            y * length,
        l: length
    }
}

function coordinates({ x, y }) {
    return {
        x: Math.floor(x / length),
        y: Math.floor(y / length)
    }
}

const directions = (function (directions = {}) {
    ['left', 'up', 'rigth', 'down'].forEach((direction, i) => {
        directions[direction] = i
        directions[i] = direction
    })
    return directions
})()

function shift({ x, y }, direction, i = 1) {
    if (direction === directions[0]) return { x: x - i, y } // left
    if (direction === directions[1]) return { x, y: y - i } // up
    if (direction === directions[2]) return { x: x + i, y } // rigth
    if (direction === directions[3]) return { x, y: y + i } // down
}

function place({ x, y }, max = Math.floor(width / length) - 1) {
    if (x < 0) x = max
    if (y < 0) y = max
    if (x > max) x = 0
    if (y > max) y = 0
    return { x, y, } = cell(x, y)
}

function equals({ x: ax, y: ay }, { x: bx, y: by }) {
    return ax === bx && ay === by
}

function isIn(line, point) {
    return line.some((part) => equals(part, point))
}

function random(i = 4) {
    return Math.floor(Math.random() * i)
}

// run ===================================

// Game.init()







