
let canvas, context, mouse;
let context3D, renderer, camera, bg_color = [0, 0, 0, 1];

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
    scene = new RD.Scene();

    context3D = GL.create({width: canvas.width, height: canvas.height});
    renderer = new RD.Renderer( context3D );
    renderer.loadShaders("shaders.txt");
    document.body.appendChild( renderer.canvas );

    camera = new RD.Camera();
    camera.perspective( 60, gl.canvas.width / gl.canvas.height, 1, 1000 );
    camera.lookAt( [0, 100, 100], [0,0,0], [0,1,0] );

    var floor = new RD.SceneNode({
        position: [0,0,0],
        scale: 100,
        color: [1, 1, 1, 1],
        mesh: "planeXZ",
        texture: "floor.png",
        tiling: 4,
        shader: "phong_texture"
    });

    floor.update = function( dt ){
        this.rotate( dt * 0.1, RD.UP );
    }

    scene.root.addChild( floor );

    var wall = new RD.SceneNode({
        position: [-50,0,0],
        scaling: 30,
        color: [1, 0.5, 1, 1],
        mesh: "plane",
        shader: "phong_texture"
    });
    //scene.root.addChild( wall );
    
    context3D.onmousemove = function(e)
	{
		if(e.dragging)
		{
            //orbit camera around
            console.log( "dragging" );
			camera.orbit( e.deltax * -0.1, RD.UP );
			camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
		}
    }

    
    context3D.onupdate = function( dt )
    {
        computeDt();
        scene.update(dt);
    }

    context3D.ondraw = function()
    {
        renderer.clear( bg_color );
        renderer.render( scene, camera );
    }

    context3D.captureMouse( true );
    context3D.onmousewheel = function(e)
	{
		//move camera forward
		camera.position = vec3.scale( camera.position, camera.position, e.wheel < 0 ? 1.1 : 0.9 );
    }
    context3D.onmousemove = function(e)
    {
        if(e.dragging)
        {
            camera.orbit( e.deltax * -0.01, RD.UP );
            camera.orbit( e.deltay * 0.01, RD.LEFT);
        }
    }

    //context3D.captureKeyboard( true );
    context3D.onkeydown = function( e )
    {
        if( e.key === 87 )
        {
            console.log( "w button" );
            camera.position = vec3.scale( camera.position, camera.position, camera.position + 10 );
        }
    }

    context3D.animate();

};

window.addEventListener( 'load', init, false );


//compute elapsed time between frames as dt
function computeDt()
{
    var now = performance.now();
    dt = (now - last)/1000;
    last = now;
};

document.getElementById("canvas").addEventListener( 'mousemove', function( e ){ mouse.move( e )} );
document.getElementById("canvas").addEventListener( 'mousedown', function( e ){ mouse.mousedown( e )} );
document.getElementById("canvas").addEventListener( 'mouseup', function( e ){ mouse.mouseup( e )} );
document.getElementById("3dBtn").addEventListener( 'click', show3d );

function show3d()
{
    canvas.style.display = 'none';
    document.body.appendChild( renderer.canvas );
    renderer.render( scene, camera );
}

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
    if(selectedTool != "erase"){
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

function createWall()
{
    var aux = wallsPosition[wallsPosition.length - 1];
    //vector between the two points
    var vector = {
        x: aux.xf - aux.xo,
        y: aux.yf - aux.yo
    }
    //save the position where wall is gonna create
    var middlePoint = {
        x: aux.xo + ( vector.x * 0.5 ), 
        y: aux.yo + ( vector.y * 0.5 )
    }

    var normalized = normalize( vector );
    var auxiliarVector = { x: 1, y: 0}
    
    var dotProduct = dot( normalized, auxiliarVector );
    var angleInRads = Math.acos( dotProduct );

    var scaleX = Math.trunc(vectorLength(vector))

    var wall = new RD.SceneNode({
        position: [-50, 10, 10],//middlePoint,
        //scale: [10, 0, 40],
        scaling: 30,
        color: [1, 0.5, 1, 1],
        mesh: "plane",
        shader: "phong_texture"
    });
/*
    var wall = new RD.SceneNode({
        position: [-50,10,10],
        scaling: 30,
        color: [1, 0.5, 1, 1],
        mesh: "plane",
        shader: "phong_texture"
    });
*/
    var angleInDegrees = (angleInRads * 180) / Math.PI;
    wall.rotate( angleInRads, RD.UP, false );
    scene.root.addChild( wall );
};

function dot( v1, v2 )
{
    return v1.x * v2.x + v1.y * v2.y;
};

function vectorLength( v )
{
    return Math.sqrt( Math.pow( v.x, 2 ) + Math.pow( v.y, 2 ));
};

function normalize( v )
{
    var aux = {
        x: v.x / vectorLength( v ),
        y: v.y / vectorLength( v )
    }

    return aux;
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
                        xo: this.x,
                        yo: this.y,
                        xf: this.memory.x,
                        yf: this.memory.y
                    }
                    wallsPosition.push( linePosition );
                    createWall();
                    this.memory.x = this.x;
                    this.memory.y = this.y;
                }
            }
            this.pressed = "false";
        }
    }
};