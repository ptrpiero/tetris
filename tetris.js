// game =======================================================================

function Game () {
    return {
        init: () => Memory() // TODO
    }
}

// listeners  =================================================================

function listen(block){
    document.addEventListener(
        "keydown",
        ({ code }) => {
            if (!code.includes('Arrow')) return
            block.render('white')
            block.move(code.replace('Arrow','').toLocaleLowerCase())
            block.render()
        },
    )
}

// modules  ===================================================================

function Memory (rows = height / length) {
    memory = {}
    while(rows >= 0){
        memory[rows] = []
        rows--
    }
    return {
        push: function (block) {
            block.forEach(p => memory[p.y].push(p))
        },
        clean: function () {
            let lines = []
            Object.keys(memory).forEach(y => {
                if(isFull(y)){
                    lines.push(parseInt(y))
                    memory[y].forEach(p => {
                        render('white',cell(p.x,p.y))
                    })
                }
            })
            lines.forEach(y => memory[y] = [])
            return lines.sort((a,b) => b-a)
        },
        fall: function (line) {
            Object.keys(memory).filter(y => y<line)
                .sort((a,b) => b-a)
                .forEach((y) => {
                    memory[y].forEach(p => {
                        render('white',cell(p.x,p.y))
                        p.y += 1
                        render(p.color,cell(p.x,p.y),true)
                        memory[parseInt(y)+1].push(p)
                    })
                    memory[y] = []
                })
        },
        get:() => memory
    }
    function isFull(line){
        return memory[line].length >= width / length
    }

}

// models  ====================================================================

function Block (){
    let figure = figures[random()]
    let head = coordinates(cell('?',0))
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
            if(inBorders(this.get(_figure,_head))){
                figure = _figure
                head = _head
            }
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

Game().init()







