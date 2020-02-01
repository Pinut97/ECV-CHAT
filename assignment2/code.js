
var connection = new WebSocket('ws://127.0.0.1:9022');

connection.onopen = function()
{
    console.log("user is in!");

    //main app loop
    init();

    var msg = {
        position: objects[0].posX,
        type: 'init',
        index: objects[0].index
    };

    connection.send(JSON.stringify(msg));
    loop();
}

var canvas = document.getElementById("myCanvas");
var rect;

var last = performance.now();
var objects = [];
var idle = [0];
var walking = [2, 3, 4, 5, 6, 7, 8];

function draw()
{

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var o = objects[0];
    var t = Math.floor(performance.now() * 0.001 * 10);

    animation(ctx, o.img, 32, 64, o.posX, o.posY, o.frame[t % o.frame.length], o.flip);
}

function animation(ctx, image, w, h, x, y, frame, flip)
{
    if(flip)
    {
        ctx.drawImage( image, frame * w, 2*h, w, h, x, y, 128, 256 );
    }
    else
    {
        ctx.drawImage( image, frame * w, 0, w, h, x, y, 128, 256 );
    }
}

function update( dt )
{
    var o = objects[0];
    var aux;
    if( o.posX != o.goalPosX)
    {
        o.frame = walking;
        if( o.posX > o.goalPosX)
        {
            o.flip = true;
            aux = o.posX - o.vel * dt;
            (aux < o.goalPosX) ? o.posX = o.goalPosX : o.posX = aux; 
        }
        else
        {
            o.flip = false;
            aux = o.posX + o.vel * dt;
            (aux > o.goalPosX) ? o.posX = o.goalPosX : o.posX = aux;
        }
    }
    else
    {
        o.frame = idle;
    }
};

function init()
{

    var parent = canvas.parentNode;
    var rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    var index = Math.floor((Math.random() * 4) + 1);

    var img = new Image();
    img.src = "spritesheets/man" + index + "-spritesheet.png";

    user = {
        posX: canvas.width * 0.5,
        posY: canvas.height * 0.5,
        goalPosX: canvas.width * 0.5,
        goalPosY: canvas.height * 0.5,
        index: index,
        flip: false,
        frame: idle,
        vel: 50,
        img: img
    };

    objects.push(user);
};

function loop()
{
    draw();

    var now = performance.now();
    var dt = (now - last)/1000;
    last = now;

    update( dt );

    requestAnimationFrame( loop );

};

function onMouse ( e )
{
    rect = canvas.parentNode.getBoundingClientRect();
    var canvasx = e.clientX - rect.left;
    var o = objects[0]; //tenir en compte id del user

    if(e.type == 'click')
    {
        o.goalPosX = canvasx;
    }
};

document.body.addEventListener('click', onMouse);

