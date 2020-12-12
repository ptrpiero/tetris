
// game =========================================

function Game () {
    return {
        init: () => {}
    }
}

// models  =========================================

const colors = [
    'yellow',
    'cyan',
    'orange',
    'purple',
    'green',
    'blue',
    'red'
]

const figures = [
    _o,
    _i,
    _l,
    _t,
    _s,
    _j,
    _z,
] = [
    "**-**",
    "*--*--*",
    "****",
    "-*-***",
    "-****-",
    "**--**",
    "--****"
].map(figure => figure
    .split('')
    .map((chunck,i) => {
        if(chunck !== '*') return
        let y = Math.floor(i / 3)
        let x = i - (y * 3)
        return {x,y}
    })
    .filter(v => !!v))

function Block (){
    let figure = figures[random()]
    let color = colors[figures.indexOf(figure)]
    let head = coordinates(cell('?',0))
    return {
        render: function () {
            figure.forEach(p => {
                if(!p) return
                let x = p.x + head.x
                let y = p.y + head.y
                render(color,cell(x,y))
            })
        },
        move: function (where) {
            let _figure = where == 'up' ? transform(figure) : figure
            let _head = where == 'up' ? head : shift(head,where)
            if(inBorders(_figure,_head)){
                figure = _figure
                head = _head
            }
        }
    }
}

// Block private methods ===============================

function inBorders(figure,head) {
    return figure.every(p => {
        let {x,y} = cell(p.x + head.x,p.y + head.y)
        return x + length <= width && x >= 0
            && y + length <= width && y >= 0
    })
}

function transform(figure) {
        return figure.map(p => {
            let x = p.y
            let y = -p.x
            return {x,y}
        })
}

// utils ===================================

function render(color = 'white', { x, y, l } = { x: 0, y: 0, l: width }) {
    const canvas = document.getElementById('board').getContext('2d')
    canvas.fillStyle = color
    canvas.fillRect(x, y, l, l)
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

const directions = (function (directions = {}) {
    ['left', 'up', 'right', 'down'].forEach((direction, i) => {
        directions[direction] = i
        directions[i] = direction
    })
    return directions
})()

function shift({ x, y }, direction, i = 1) {
    if (direction === directions[0]) return { x: x - i, y } // left
    if (direction === directions[1]) return { x, y: y - i } // up
    if (direction === directions[2]) return { x: x + i, y } // right
    if (direction === directions[3]) return { x, y: y + i } // down
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

Game().init()







