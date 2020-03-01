
let canvas, context, mouse;
let context3D, renderer, camera, bg_color = [0, 0, 0, 1];

let lineBtn = document.getElementById('lineBtn');
let eraseBtn = document.getElementById('eraseBtn');
let cubeBtn = document.getElementById('cubeBtn');

let last = performance.now();
let dt = 0;

let gridWidth = 10;

let selectedTool = null;
let mode = '2D';
canvas = document.querySelector( "canvas" );
context = canvas.getContext( "2d" );

let wallsPosition = [];

let objects = [];

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
    renderer.canvas.style.display = 'none;'

    camera = new RD.Camera();
    camera.perspective( 60, gl.canvas.width / gl.canvas.height, 1, 10000 );
    camera.lookAt( [0, 1000, 500], [0,0,0], [0,1,0] );

    var floor = new RD.SceneNode({
        position: [0,0,0],
        scale: [canvas.width, 0, canvas.height],
        color: [1, 1, 1, 1],
        mesh: "planeXZ",
        texture: "floor.png",
        tiling: 15,
        shader: "phong_texture"
    });
    scene.root.addChild( floor );
    
    //update 3D
    context3D.onupdate = function( dt )
    {
        computeDt();
        scene.update(dt);
    }
    //draw 3D
    context3D.ondraw = function()
    {
        renderer.clear( bg_color );
        renderer.render( scene, camera );
    }

    //mouse 3D actions
    context3D.captureMouse( true );
    context3D.onmousemove = function(e)
	{
		if(e.dragging)
		{
            //orbit camera around
			camera.orbit( e.deltax * -0.1, RD.UP );
			camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
		}
    }

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

    var target = null;
    context3D.onmouseup = function( e )
    {
        if(e.click_time < 200) //fast click
		{
			//compute collision with floor plane
			var ray = camera.getRay( e.canvasx, e.canvasy );
            if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision
            {
                if( selectedTool === 'cube' )
                {
                    target = ray.collision_point;
                    create3DCube( target );
                    target = null;
                }
            }
        }
    }
    //call for 3d loop
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
    var planner = document.getElementById( 'planner' );
    if( mode !== '3D' )
    {
        this.style.border = "solid #0000FF";
        mode = '3D';
        planner.style.display = 'none';
        renderer.canvas.style.display = 'block';
        //document.body.appendChild( renderer.canvas );
    }
    else
    {
        this.style.border = 'none';
        renderer.canvas.style.display = 'none';
        planner.style.display = 'block';
        mode = '2D';
    }
}

document.getElementById("lineBtn").addEventListener( 'click', function(){
    if(selectedTool != "line"){
        selectedTool = "line";
        this.style.border = "solid #0000FF";
        eraseBtn.style.border = "none";
        cubeBtn.style.border = "none";
    } 
    else {
        selectedTool = null;
        mouse.memory.x = 0;
        mouse.memory.y = 0;
        this.style.border = "none";
    }
});

document.getElementById("eraseBtn").addEventListener( 'click', function(){ 
    //select erase tool if not already selected, unselect it otherwise
    if( selectedTool != "erase" ){
        selectedTool = "erase";
        this.style.border = "solid #0000FF";
        lineBtn.style.border = "none";
        cubeBtn.style.border = "none";
    }
    else {
        selectedTool = null;
        this.style.border = "none";
    }
});

document.getElementById("cubeBtn").addEventListener( 'click', function(){
    //select cube tool if not already selected, unselect it otherwise
    if( selectedTool !== 'cube' )
    {
        selectedTool = 'cube';
        this.style.border = "solid #0000FF";
        lineBtn.style.border = "none";
        eraseBtn.style.border = "none";
    }
    else{
        selectedTool = null;
        this.style.border = 'none';
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
    }

    //horizontal lines
    for( var i = 0; i < y; i += size )
    {
        context.moveTo( 0, i );
        context.lineTo( x, i );
    }
    context.stroke();
};

function drawLine (xo, yo, xf, yf )
{
    context.strokeStyle = "black";
    context.lineWidth = 5;
    context.moveTo( xo, yo );
    context.lineTo( xf, yf );
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

    if( aux.yf > aux.yo ) 
    {
        vector.y = -vector.y;
        vector.x = -vector.x;
    }

    var normalized = normalize( vector );
    var auxiliarVector = { x: 1, y: 0}
    
    var dotProduct = dot( normalized, auxiliarVector );
    var angleInRad = Math.acos( dotProduct );

    var scaleX = Math.trunc(vectorLength(vector))

    var wall = new RD.SceneNode({
        position: [middlePoint.x - canvas.width * 0.5, 55, middlePoint.y - canvas.height * 0.5],
        scale: [vectorLength(vector), 115, 3],
        color: [1, 0, 1, 1],
        mesh: "cube",
        texture: "none",
        shader: "phong_texture"
    });

    wall.rotate( angleInRad, RD.UP, false );
    scene.root.addChild( wall );
};

function create3DCube( target )
{
    var cube = new RD.SceneNode( {
        position: [target[0], 24, target[2]],
        scale: [100, 50, 100],
        color: [0.9, 0.9, 0.7, 1],
        mesh: "cube",
        shader: "phong"
    });
    scene.root.addChild( cube );
};

function createCube( x, y )
{
    context.strokeStyle = "black";
    context.lineWidth = 5;
    context.moveTo( x - 50, y - 50 );
    context.lineTo( x + 50, y - 50);
    context.lineTo( x + 50, y + 50 );
    context.lineTo( x - 50, y + 50 );
    context.lineTo( x - 50, y - 50 );
    context.stroke();

    var target = [x - canvas.width * 0.5, 0, y - canvas.height * 0.5];
    create3DCube( target );
}

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
            else if( selectedTool === 'cube' )
            {
                createCube( this.x, this.y );
            }
            this.pressed = "false";
        }
    }
};