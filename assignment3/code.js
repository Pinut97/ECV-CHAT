//import * as d from 'point-to-line-2s.js';

//d.distToSegment([5, 5],[0, 2],[6, 2]);

let canvas, context, mouse;

let last = performance.now();
let dt = 0;

let gridWidth = 10;

let selectedTool = null;
canvas = document.querySelector( "canvas" );
context = canvas.getContext( "2d" );

let wallsPosition = [];

function init()
{
    canvas.height = canvas.parentNode.getBoundingClientRect().height;
    canvas.width = canvas.parentNode.getBoundingClientRect().width;

    mouse = new Mouse();

    loop();

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
    //resizeWindow();   //elimina el que es dibuixa en el canvas ¿?
    //document.body.addEventListener('mousedown', mouse.move );
};

document.getElementById("canvas").addEventListener( 'mousemove', function( e ){ mouse.move( e )} );
document.getElementById("canvas").addEventListener( 'mousedown', function( e ){ mouse.mousedown( e )} );
document.getElementById("canvas").addEventListener( 'mouseup', function( e ){ mouse.mouseup( e )} );
document.getElementById("lineBtn").addEventListener( 'click', function(){
    if(selectedTool != "line"){
        selectedTool = "line";
        this.style.border = "solid #0000FF";
    } 
    else {
        selectedTool = null;
        mouse.memory.x = 0;
        mouse.memory.y = 0;
        this.style.border = "none";
    }
});

document.getElementById("eraseBtn").addEventListener( 'click', function(){ 
    if(selectedTOol != "erase"){
        selectedTool = "erase";
        this.style.border = "solid #0000FF";
    }
    else {
        selectedTool = null;
        this.style.border = "none";
    }
});

//change canvas size when resizing window
function resizeWindow()
{
    canvas.height = canvas.parentNode.getBoundingClientRect().height;
    canvas.width = canvas.parentNode.getBoundingClientRect().width;
};

function drawWall( xo, yo, xf, yf)
{
    context.lineWidth = 4;
    context.style = "black";
    context.moveTo( xo, yo );
    context.lineTo( xf, yf );
    context.stroke();
};

function draw()
{
    clear();

    //drawGrid(60);
    for( var i = 0; i < wallsPosition.length; i++ )
    {
        drawLine( wallsPosition[i].xo, wallsPosition[i].yo, wallsPosition[i].xf, wallsPosition[i].yf );
    }
};

function clear()
{
    context.fillStyle = "white";
    context.clearRect( 0, 0, canvas.width, canvas.height );
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

function drawLine (xo, yo, xf, yf )
{
    context.strokeStyle = "black";
    context.lineWidth = 5;
    context.moveTo( xo, yo );
    context.lineTo(  xf, yf );
    context.stroke();
};

//mouse class
class Mouse {

    constructor()
    {
        this.current = { x: 0, y: 0 };
        this.memory  = { x: 0, y: 0 };
        this.pressed = false;
    }

    move( event )
    {
        var rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    }

    mousedown( e )
    {
        if( e.button === 0 )
        {
            this.pressed = "true";
        }
    }

    mouseup( e )
    {
        if( e.button === 0 )
        {
            if( selectedTool === "line" )
            {
                if( this.memory.x === 0 && this.memory.y === 0 )
                {
                    this.memory.x = mouse.x;
                    this.memory.y = mouse.y;
                }
                else if ( this.pressed )
                {
                    drawLine( this.memory.x, this.memory.y, this.x, this.y );
                    let linePosition = {
                        xo: this.memory.x,
                        yo: this.memory.y,
                        xf: this.memory.x,
                        yf: this.memory.y
                    }
                    wallsPosition.push( linePosition );
                    this.memory.x = this.x;
                    this.memory.y = this.y;
                }
            }
            /*
            else if(selectedTool === "erase")
            {
                if(this.pressed)
                {
                    console.log("jiji no funciona el import");
                }
            }
            */
            this.pressed = "false";
        }
    }
};