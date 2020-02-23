
let canvas, context, mouse;

let last = performance.now();
let dt = 0;

let gridWidth = 10;

function init()
{
    canvas = document.querySelector( "canvas" );
    context = canvas.getContext( "2d" );

    canvas.height = canvas.parentNode.getBoundingClientRect().height;
    canvas.width = canvas.parentNode.getBoundingClientRect().width;

    mouse = new Mouse();

    loop();
    drawWall( 30, 330, 330, 330 );
    drawGrid( gridWidth );

};

window.addEventListener( 'load', init, false );

function loop()
{
    draw();
    computeDt();
    update( dt );

    window.requestAnimationFrame( loop );
};

//compute elapsed time between frames as dt
function computeDt()
{
    var now = performance.now();
    dt = (now - last)/1000;
    last = now;
};

function update( dt )
{
    this.addEventListener( 'mousemove', mouse.move );
    this.addEventListener( 'mousedown', mouse.mousedown );
    //this.addEventListener( 'mouseup', mouse.mouseup );

    //resizeWindow();   //elimina el que es dibuixa en el canvas ¿?
    //document.body.addEventListener('mousedown', mouse.move );
};

//change canvas size when resizing window
function resizeWindow()
{
    canvas.height = canvas.parentNode.getBoundingClientRect().height;
    canvas.width = canvas.parentNode.getBoundingClientRect().width;
};

function drawSimpleBasePlane()
{
    drawWall( 30, 30, 330, 30 );
    drawWall( 30, 30, 30, 330 );
    drawWall( 330, 30, 330, 330 );
    drawWall( 30, 330, 330, 330 );
};

function drawWall( xo, yo, xf, yf)
{
    context.lineWidth = 1;
    context.style = "black";
    context.moveTo( xo, yo );
    context.lineTo( xf, yf );
    context.stroke();
};

function draw()
{
    context.clearRect( 0, 0, canvas.height, canvas.width );
    drawSimpleBasePlane();
};

//draw background grid
function drawGrid( size )
{
    x = canvas.width;
    y = canvas.height;

    context.strokeStyle = "lightgrey";
    context.lineWidth = 0.25;

    //vertical lines
    for( var i = 0; i < x; i += size )
    {
        context.moveTo( i, 0 );
        context.lineTo( i, y );
        context.stroke();
    }

    //horizontal lines
    for( var i = 0; i < y; i += size )
    {
        context.moveTo( 0, i );
        context.lineTo( x, i );
        context.stroke();
    }
};

function drawLine()
{
    if( mouse.dragging )
    {
        context.moveTo( mouse.memory.x, mouse.memory.y );
        context.lineTo(  mouse.x, mouse.y );
        context.stroke();
    }
};

//mouse class
class Mouse {

    constructor()
    {
        this.current = { x: 0, y: 0 };
        this.memory  = { x: 0, y: 0 };
        this.difference = { x: 0, y: 0 };
        this.inverse = { x: 0, y: 0 };
        this.dragging = false;

    }

    move( event )
    {
        //rect = canvas.parentNode.getBoundingClientRect(),
        mouse.x = event.pageX; //event.clientX - rect.left;
        mouse.y = event.pageY; //event.clientY - rect.top;

        if( this.dragging )
        {
            this.difference.x = this.current.x - this.memory.x;
            this.difference.y = this.current.y - this.memory.y;

            if( this.current.x < this.memory.x ) this.inverse.x = this.current.x;
            if( this.current.y < this.memory.y ) this.inverse.y = this.current.y;
        }
    }

    mousedown( e )
    {
        if( e.button === 0 )
        {
            if( this.dragging == false )
            {
                this.dragging = true;

                //memorize mouse click location
                this.memory.x = this.current.x;
                this.memory.y = this.current.y;

                //reset inverse coordinates
                this.inverse.x = this.memory.x;
                this.inverse.y = this.memory.y;
            }
        }
        console.log( mouse.x, mouse.y );
    }

    mouseup( e )
    {
        //mouse released
        this.dragging = false;
        this.memory.x = 0;
        this.memory.y = 0;
        this.difference.x = 0;
        this.difference.y = 0;
        this.inverse.x = 0;
        this.inverse.y = 0;
    }
};