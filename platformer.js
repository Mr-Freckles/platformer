// TODO: Wrap in iife to prevent exposing variables

// Declare variables outside of the setup function
let player;
let blocks = [];
let backgroundFunc;
let changingStages = true;
let fading = false;
const fadeIncrement = 15; // for fading in between stages
let time = 0;
let startTime;
let bestTimes;
let timerElement = document.getElementById('time');

let keys = []; // array to hold actively pressed keys

let retryStage;
let updateTimer;

// constants
const gravity = 0.4;
const friction = 0.9;
const movementThreshold = 0.01;

function setup() {
    createCanvas(700, 600);

    noStroke();
    textAlign(CENTER, CENTER);
    textSize(15);

    /**
     * Player and block classes
     */

    /**
     * The Player class
     */

    class Player {
        constructor(x, y, size, colour, speed, jump) {
            this.x = x || 0;
            this.y = y || 0;

            this.vx = 0;
            this.vy = 0;

            this.s = size || 20;
            this.c = colour || color(255, 0, 0);

            this.speed = speed || 1;
            this.jump = jump || 10.1;
            this.canJump = false;
            this.bouncing = false;
            this.swimming = false;
            this.health = 20;
        };

        draw() {
            fill(this.c);
            square(this.x, this.y, this.s);
        };

        update(blocks) {
            if (keys[37] || keys[65]) { // left (left arrow or A)
                this.vx -= this.speed;
            }
            if (keys[39] || keys[68]) { // right (right arrow or D)
                this.vx += this.speed;
            }
            if ((keys[38] || keys[87]) && this.canJump) { // up (up arrow or W)
                if (this.swimming) this.vy -= this.speed + gravity;
                else this.vy -= this.jump / (this.bouncing ? 2 : 1);
            }
            if (keys[40] || keys[83]) { // down (down arrow or S)
                this.vy += this.speed;
            }

            this.vx *= friction;
            this.vy += gravity;

            if (abs(this.vx) < movementThreshold) this.vx = 0;
            if (abs(this.vy) < movementThreshold) this.vy = 0;

            // Reset properties before collisions
            this.canJump = false;
            this.swimming = false;
            this.bouncing = false;

            // Apply collisions and update position
            this.x += this.vx;
            this.applyCollisions(blocks, this.vx, 0);

           
            this.y += this.vy;
            this.applyCollisions(blocks, 0, this.vy);
            this.jumping = false;

            if (this.x < 0) this.x = 0;
            if (this.x > width - this.s) this.x = width - this.s;
            if (this.y < 0) this.y = 0;
            if (this.y > height - this.s) {
                this.y = height - this.s;
                this.canJump = true;
            }

            if (this.x <= 0 || this.x >= width - this.s) this.vx = 0;
            if (this.y <= 0 || this.y >= height - this.s) this.vy = 0;

            this.draw();
        };

        applyCollisions(blocks, vx, vy) {
            for (let block = 0; block < blocks.length; block++) {
                let b = blocks[block];
                if (collide(this, b)) {
                    switch (b.constructor.name) {
                        case 'ExitPortal':
                            if (!changingStages) {
                                changingStages = true;
                                nextStage();
                            }                            
                            break;
                        case 'FakeBlock':
                            break;
                        case 'WaterBlock':
                            if (vx !== 0) {
                                this.vx *= 0.3;
                            }
                            if (vy !== 0) {
                                this.vy *= 0.3;
                            }
                            this.canJump = true;
                            this.swimming = true;
                            break;
                        case 'BouncyBlock':
                            if (vx > 0) {
                                this.x = b.x - this.s;
                                this.vx = -b.bounciness;
                            } 
                            else if (vx < 0) {
                                this.x = b.x + b.w;
                                this.vx = b.bounciness;
                            }
                            if (vy > 0) {
                                this.y = b.y - this.s;
                                this.vy = -b.bounciness;
                                this.canJump = true;
                                this.bouncing = true;
                            }
                            else if (vy < 0) {
                                this.y = b.y + b.h;
                                this.vy = b.bounciness;
                            }
                            break;
                        case 'Platform':
                            if (vy > 0) {
                                this.y = b.y - this.s;
                                this.vy = 0;
                                this.canJump = true;
                            }
                            break;
                        case 'UpSpike':
                            if (vx > 0) {
                                this.vx = -b.bounciness;
                            }
                            else if (vx < 0) {
                                this.vx = b.bounciness;
                            }
                            if (vy > 0) {
                                this.vy = -b.bounciness;
                                this.health -= b.ouch;
                            }
                            else if (vy < 0) {
                                this.y = b.y + b.h;
                                this.vy = 0;
                            }
                            break;
                        case 'DownSpike':
                            if (vy > 0) {
                                this.y = b.y - this.s;
                                this.vy = 0;
                                this.canJump = true;
                            }
                            break;
                        case 'LeftSpike':
                            if (vx < 0) {
                                this.x = b.x + b.w;
                                this.vx = 0;
                            }
                            break;
                        case 'RightSpike':
                            if (vx > 0) {
                                this.x = b.x - this.s;
                                this.vx = 0;
                            }
                            break;
                        case 'StickyBlock':
                            this.vx = 0;
                            this.vy = 0;
                            this.canJump = true;
                        case 'Block':
                        default: 
                            if (vx > 0) {
                                this.x = b.x - this.s;
                                this.vx = 0;
                            }
                            else if (vx < 0) {
                                this.x = b.x + b.w;
                                this.vx = 0;
                            }
                            if (vy > 0) {
                                this.y = b.y - this.s;
                                this.vy = 0;
                                this.canJump = true;
                            }
                            else if (vy < 0) {
                                this.y = b.y + b.h;
                                this.vy = 0;
                            }
                    }
                }
            }
        }
    }

    /**
     * The Block classes
     */

    class Block {
        constructor(x, y, width, height, colour) {
            this.x = x;
            this.y = y;
            this.w = width ?? 20;
            this.h = height ?? 20;
            this.c = colour ?? color(0);
        };

        draw() {
            fill(this.c);
            rect(this.x, this.y, this.w, this.h);
        };

        // needed?
        update() {
            

            this.draw();
        };
    }

    class ExitPortal extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(140, 0, 255));
        }
    }

    class BouncyBlock extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(255, 0, 255));
        }

        bounciness = 8;
    }

    class StickyBlock extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(255, 127, 0));
        }
    }

    class WaterBlock extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(0, 0, 255, 170));
        }
    }

    class FakeBlock extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(0, 215));
        }
    }

    class Platform extends Block {
        constructor(x, y, width) {
            super(x, y, width, 0, color(115, 60, 0));
        }

        draw() {
            fill(this.c);
            rect(this.x, this.y, this.w, 3);
        }
    }

    class Spike extends Block {
        constructor(x, y, width, height, direction) {
            super(x, y, width, height, color(100));
            this.d = direction;
        }

        bounciness = 8;
        ouch = 1;

        draw() {
            fill(this.c);
            switch (this.d) {
                case 'up':
                    triangle(this.x, this.y+this.h, this.x+this.w, this.y+this.h, this.x+this.w/2, this.y);
                    break;
                case 'down':
                    triangle(this.x, this.y, this.x+this.w, this.y, this.x+this.w/2, this.y+this.h);
                    break;
                case 'left':
                    triangle(this.x+this.w, this.y, this.x+this.w, this.y+this.h, this.x, this.y+this.h/2);
                    break;
                case 'right':
                    triangle(this.x, this.y, this.x, this.y+this.h, this.x+this.w, this.y+this.h/2);
                    break;
            }
        }
    }

    class UpSpike extends Spike {
        constructor(x, y, width, height) {
            super(x, y, width, height, 'up');
        }
    }

    class DownSpike extends Spike {
        constructor(x, y, width, height) {
            super(x, y, width, height, 'down');
        }
    }

    class LeftSpike extends Spike {
        constructor(x, y, width, height) {
            super(x, y, width, height, 'left');
        }
    }

    class RightSpike extends Spike {
        constructor(x, y, width, height) {
            super(x, y, width, height, 'right');
        }
    }

    /** 
     * Helper functions
    */

    function collide(p, o) {
        return p.x + p.s > o.x && p.x < o.x + o.w &&
               p.y + p.s > o.y && p.y < o.y + o.h;
    }


    let currentStage = -1;
    let currentLevel = 0;

    function loadStage(num) {
        let level = levels[currentLevel][num];
        backgroundFunc = level.background;
        let map = level.map;
        blocks = [];
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                let currentBlock = charMap[map[r][c]];
                if (currentBlock) {
                    if (currentBlock === Player) {
                        player.x = c * 20;
                        player.y = r * 20;
                        player.vx = 0;
                        player.vy = 0;
                    }
                    else blocks.push(new currentBlock(c*20, r*20));
                }
            }
        }
    }

    retryStage = () => loadStage(currentStage);

    updateTimer = () => {
        if (startTime && currentStage < levels[currentLevel].length - 1) {
            time = (performance.now() - startTime) / 1000;
            timerElement.textContent = time.toFixed(3);
        }
    }

    // Might add a fade
    async function nextStage() {
        if (currentStage === levels[currentLevel].length - 2) {
            startTime = false; // stop timer
            if (!bestTimes[currentLevel] || time < bestTimes[currentLevel]) {
                updateTextContent('best-time', time.toFixed(3));
                bestTimes[currentLevel] = time.toFixed(3);
                storeItem('bestTimes', bestTimes);
            }
        }
        fading = true;
        await delay(700);
        loadStage(++currentStage);
        updateTextContent('stage-number', currentStage + 1);
        fading = 255;
    }

    function updateTextContent(id, text) {
        document.getElementById(id).textContent = text;
    }

    async function delay(delay) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    let charMap = {
        'P': Player,
        '@': ExitPortal,
        'x': Block,
        'b': BouncyBlock,
        's': StickyBlock,
        'w': WaterBlock,
        'f': FakeBlock,
        '-': Platform,
        '^': UpSpike,
        'v': DownSpike,
        '<': LeftSpike,
        '>': RightSpike
    }

    let levels = [
        [
            {
                map: [
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                  @",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "  P                   xx           ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "             x                     ",
                    "                                   ",
                    "                                   ",
                    "xxx                                ",
                ],
                devmap: [
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                  @",
                    "                                   ",
                    "         -----                     ",
                    "                                   ",
                    "  P                   xx           ",
                    "                                   ",
                    "                                   ",
                    "                    ^               ",
                    "             x               v     ",
                    "                                   ",
                    "                                   ",
                    "xxx    <      >         ^         <",
                ],
                background: function() {
                    fill(100);
                    textSize(30);
                    text('Welcome!', width/2, height/3);
                    textSize(15);
                    text('Use arrow keys or WASD to move', width/2, height/3+50);
                    text('Try to reach this portal\nto move to the next stage', 600, 300);
                    text('The timer will start\nwhen you start moving', 250, 40);
                    stroke(100);
                    line(610, 330, 650, 350);
                    line(650, 350, 645, 340);
                    line(650, 350, 640, 353);
                    line(175, 30, 165, 10);
                    line(165, 10, 162, 19);
                    line(165, 10, 174, 13);
                }
            },
            {
                map: [
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "         x                         ",
                    "                                   ",
                    "                                   ",
                    "   x                               ",
                    "                                   ",
                    "   x                    x          ",
                    "                                   ",
                    "   x                               ",
                    "                                   ",
                    "   x                               ",
                    "                                   ",
                    "   x                          x    ",
                    "                              x    ",
                    "   x                          x   P",
                    "                              xxxxx",
                    "   x                          x   @",
                    "                             xx    ",
                    "   x                          x    ",
                    "                              xx   ",
                    "   x                          x    ",
                    "   x                          x    ",
                    "   xxxxxxxxxxxxxxxxxxxxxxxxxxxx    ",
                    "                                   ",
                    "                                   ",
                    "                                  x",
                ],
                background: function() {

                }
            },
            {
                map: [
                    "                                   ",
                    "    xxxxxxxx                       ",
                    "    x      x                       ",
                    "       @   x                       ",
                    "   bbbbbbbbb                       ",
                    "                                   ",
                    "                                   ",
                    "             bbbb                  ",
                    "             b                     ",
                    "             b                     ",
                    "             b                     ",
                    "             b                     ",
                    "   xxxxxxx  xb                     ",
                    "             b                     ",
                    "             b                     ",
                    "         bbbbb                     ",
                    "                                   ",
                    "                                   ",
                    "   xxxxxxbbbbbb                    ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                      bb          P",
                    "                                   ",
                    "                                xxx",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                ],
                background: function() {
                    fill(100);
                    text('This block is bouncy', 455, 400);                
                }
            },
            {
                map: [
                    "                                   ",
                    "                                   ",
                    "  bbbbbbbb        s                ",
                    "        Pb        s      @         ",
                    "         b        s                ",
                    "    x    b        s                ",
                    "  b bbbbbb        s                ",
                    "  b b                              ",
                    "  b b                              ",
                    "  b b                              ",
                    "  b b                             s",
                    "  b b                             s",
                    "  b b                             s",
                    "  b b                             s",
                    "  b b                             s",
                    "  b xxxxxxxx                       ",
                    "bbb        s                       ",
                    "           s                       ",
                    "  ssss     s                       ",
                    "           s                       ",
                    "           s                       ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                     s             ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                ],
                background: function() {
                    fill(100);
                    text('This block is sticky', 427, 450);
                    text('You might need a run up...', 200, 280);
                }
            },
            {
                map: [
                    "w                     x            ",
                    "w                     x            ",
                    "w                     x            ",
                    "w                     x  P         ",
                    "w       bbsssbb       xxxx        x",
                    "w      bwwwwwwwb      @  xwwwwwwwxx",
                    "w      bwwwwwwwb         xwwwwwwwxx",
                    "w      bwwwwwwwb         xwwwwwwwxx",
                    "w      bwwwwwwwb         xwwwwwwwxx",
                    "s       wwwwwwwwwwwwwwwwwwwwwwwwwx ",
                    "w       wwwwwwwwwwwwwwwwwwwwwwwwwx ",
                    "w                     xxxxxxxxxxxx ",
                    "                                   ",
                    "www                                ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                ],
                background: function() {
                    fill(100);
                    text('Swim!', 600, 50);
                    text('Press r to restart :)', 200, 560);
                }
            },
            {
                map: [
                    "                        f          ",
                    "                                   ",
                    "                        x          ",
                    "             f      xxxxx          ",
                    "       f            x   f          ",
                    "                    x P x          ",
                    "                    xxxxx          ",
                    "                                   ",
                    "fff                                ",
                    "  f                                ",
                    "@ f                                ",
                    "  f                                ",
                    "w                                  ",
                    "                                   ",
                    "w                                  ",
                    "                                   ",
                    "            f                      ",
                    "                    x              ",
                    "              f         f          ",
                    "                              f    ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "s                                  ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                    "                                   ",
                ],
                background: function() {
                    fill(100);
                    text('Sus...', 485, 195);
                    text('R to restart :)', 180, 570);
                    // stroke(100);
                    // line(140, 568, 167, 568);
                    // line(167, 568, 162, 563);
                    // line(167, 568, 162, 573);
                }
            },
            {
                map: [
                    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b                P                b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b     x   x     xx     x     x    b",
                    "b     x   x    x  x    x     x    b",
                    "b      x x    x    x   x     x    b",
                    "b       x     x    x   x     x    b",
                    "b       x      x  x     x   x     b",
                    "b       x       xx       xxx      b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b     x       x  xxx  x   x  x    b",
                    "b     x       x   x   xx  x  x    b",
                    "b      x  x  x    x   x x x  x    b",
                    "b      x x x x    x   x  xx       b",
                    "b       x   x    xxx  x   x  x    b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "b                                 b",
                    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                ],
                background: function() {
                    // TODO: confetti
                    fill(100);
                    text(`You finished all the stages in ${time.toFixed(3)} seconds`, 350, 50);
                }
            }
        ]
    ]


    /**
     * Main code body
     */

    bestTimes = getItem('bestTimes') || [];
    if (bestTimes[0]) updateTextContent('best-time', bestTimes[0]);

    player = new Player();
    // currentStage = 1;
    nextStage(); // initialise the first stage

}

// TODO: Fix this mess, move update() back inline in draw
function draw() {
    if (changingStages) {
        if (fading === true) background(255, fadeIncrement); // fade out
        else if (fading > 0) {
            update();
            background(255, fading-=5); // fade in
        }
        else {
            fading = 0;
            changingStages = false;
        }
    }
    else {
        update();
    }

    updateTimer();
}

function update() { // need to rename if using p5.sound
    background(255);
    push();
    backgroundFunc();
    pop();
    
    player.update(blocks);
    blocks.forEach(b => b.draw());
}

function keyPressed() {
    if (!startTime) startTime = performance.now();
    startTime ||= performance.now();
    keys[keyCode] = true;
    if (key.toLowerCase() === 'r') retryStage();
}

function keyReleased() {
    keys[keyCode] = false;
}


/*
PREVIEW KEY PRESSES

In Chrome live expression:
[...keys.entries()].reduce((p,c)=>c[1]&&l[c[0]]?p+l[c[0]]+' ':p,'')

In console: */
var l=[];
l[37]=l[65]='left'
l[39]=l[68]='right'
l[38]=l[87]='up'
l[40]=l[83]='down'
