
let canvas, context, mouse, objectID, objectSelected;
let context3D, renderer, walkingcamera, camera, bg_color = [0, 0, 0, 1];

let lineBtn = document.getElementById('lineBtn');
let eraseBtn = document.getElementById('eraseBtn');
let cubeBtn = document.getElementById('cubeBtn');

let roomName = document.getElementById('file').innerText;
let objectInfo = document.getElementById('objectInfo'); 
let globalInformation = document.getElementById('global-information');

let numObjects = []; //number of instances of each type of object
let numbDeletedObjects = [];

let last = performance.now();
let dt = 0;

let gridWidth = 10;

let selectedTool = null;
let mode = '2D';
let view;
let walkingMode = null;    //object to store info about the walking view
let freeMode = null;
canvas = document.querySelector( "canvas" );
context = canvas.getContext( "2d" );

let objects = [];
let connection;
var user_ID;

var velocity = 150;
var rotateSpeed = 2;

const CUBE_COLOR = [0.9, 0.9, 0.7, 1];

function init()
{
    canvas.height = canvas.parentNode.getBoundingClientRect().height;
    canvas.width = canvas.parentNode.getBoundingClientRect().width;

    objectID = 0;
    objectSelected = null;

    mouse = new Mouse();
    scene = new RD.Scene();

    context3D = GL.create({width: canvas.width-1, height: canvas.height});
    renderer = new RD.Renderer( context3D );
    renderer.loadShaders("/shaders/shaders.txt");
    //renderer.setDataFolder("textures");
    var wrapper = document.getElementById('wrapper');
    wrapper.appendChild( renderer.canvas);
    renderer.canvas.style.display = 'none';

    numObjects[0] = 0;
    numObjects[1] = 0;
    numbDeletedObjects[0] = 0;
    numbDeletedObjects[1] = 0;

    walkingMode = {
        position: [0, 80, 500],
        target: [0, 80, 0],
        up: [0, 1, 0]
    };

    freeMode = {
        position: [0, 1000, 500],
        target: [0, 0, 0],
        up: [0, 1, 0]
    };

    camera = new RD.Camera();
    camera.perspective( 60, gl.canvas.width / gl.canvas.height, 1, 10000 );
    walkingcamera = new RD.Camera();
    walkingcamera.perspective( 60, gl.canvas.width / gl.canvas.height, 1, 10000 );
    freeView();

    var floor = new RD.SceneNode({
        type: "floor",
        id: objectID,
        position: [0,0,0],
        scale: [canvas.width, 0, canvas.height],
        color: [1, 1, 1, 1],
        mesh: "planeXZ",
        texture: "/textures/floor.png",
        tiling: 15,
        shader: "phong_texture"
    });
    objectID++;
    scene.root.addChild( floor );

    //createObject([0,0,0], false, 'sofa' );
    
    //update 3D
    context3D.onupdate = function( dt )
    {
        computeDt();
        scene.update(dt);
        sendUpdateInfo( connection );
        if( context3D.keys.Z )
        {
            if(view === "walking")
            {
                freeView();
            }
            else
            {
                walkingView();
            }   
        }

        moveCamera();
        //document.getElementsById('translateX').value;
    }
    //draw 3D
    context3D.ondraw = function()
    {
        if(mode === "2D")
        {
            draw2D();
        }
        else
        {
            renderer.clear( bg_color );
            if ( view === 'free' ){ renderer.render( scene, camera ); }
            else{ renderer.render( scene, walkingcamera ); }
            //resize3DWindow();
        }
    }

    //mouse 3D actions
    context3D.captureMouse( true );
    context3D.onmousemove = function(e)
	{
		if( e.dragging )
		{
            if( view !== 'walking' )
            {
                //orbit camera around
                camera.orbit( e.deltax * -0.1, RD.UP );
                camera.orbit( e.deltay * 0.01, RD.LEFT);
                camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
            }
            else
            {
                walkingcamera.rotate( -e.deltax * 0.01, RD.UP );
            }
        }
        else if( objectSelected === null && selectedTool === "select" )
        {
            var ray = camera.getRay( e.canvasx, e.canvasy )
            if( ray.testPlane( RD.ZERO, RD.UP) )
            {
                target = ray.collision_point;
                returnObjectWhenHoovered( target );
            }
        }
        else if( objectSelected !== null && selectedTool === "select" )
        {
            var ray = camera.getRay( e.canvasx, e.canvasy );
            if(ray.testPlane( RD.ZERO, RD.UP))
            {
                target = ray.collision_point;
                target[1] += 24;
                objectSelected.position = target;
                getObjectFromObjectList(objectSelected.id).position = target;
                setInspectorValues();
            }
        }
    }

    context3D.onmousewheel = function(e)
	{
		//move camera forward
		camera.position = vec3.scale( camera.position, camera.position, e.wheel < 0 ? 1.1 : 0.9 );
    }

    context3D.captureKeys(true);

    var target = null;
    context3D.onmouseup = function( e )
    {
        if(e.click_time < 200) //fast click
		{
			//compute collision with floor plane
			var ray = camera.getRay( e.canvasx, e.canvasy );
            if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision
            {
                target = ray.collision_point;
                //target[0]+= canvas.width * 0.5;
                //target[2]+= canvas.height * 0.5;
                if( selectedTool === 'cube' )
                {
                    create3DCube( [target[0] + canvas.width * 0.5, target[2] + canvas.height * 0.5], true ); //convert to 2D coordinates
                    target = null;
                }
                else if( selectedTool === 'chair' )
                {
                    createObject([target[0] + canvas.width * 0.5, target[2] + canvas.height * 0.5], true, 'chair');
                    target = null;
                }
                else if( selectedTool === 'sofa' )
                {
                    createObject( [target[0] + canvas.width * 0.5, target[2] + canvas.height * 0.5], true, 'sofa' );
                    target = null;
                }
                else if (selectedTool === 'line')
                {
                    target[0]+= canvas.width * 0.5;
                    target[2]+= canvas.height * 0.5;

                    if( mouse.memory.x === 0 && mouse.memory.y === 0 )
                    {
                        mouse.memory.x = target[0];
                        mouse.memory.y = target[2];
                    }
                    else
                    {
                        createWall({x: target[0], y: target[2]}, {x: mouse.memory.x, y: mouse.memory.y}, true);
                        mouse.memory.x = target[0];
                        mouse.memory.y = target[2];
                    }
                }
                else if( selectedTool === 'select' )
                {
                    if(objectSelected === null)
                    {
                        target = ray.collision_point;
                        var node = scene.testRay( ray, undefined, undefined, 0x1, true );
                        if( node )
                        {
                            if( node.id !== 0)  //to avoid selecting the floor
                            {
                                objectSelected = node;
                                setInspectorValues();
                            }
                        }
                    }
                    else 
                    {   
                        objectSelected = null;
                    }
                }
                else if(selectedTool === 'erase')
                {
                    if( objectSelected === null )
                    {
                        target = ray.collision_point;
                        var node = scene.testRay( ray, undefined, undefined, 0x1, true );
                        if( node )
                        {
                            eraseObject( node );
                        }
                        //deleteObject( target ); TODO delete this function?
                    }
                }
            }
        }
    }
    //call for 3d loop
    context3D.animate();
};

function generateInitialObjects( initialObjects )
{
	for(var i = 0; i < initialObjects.length; i++)
	{
		if(initialObjects[i].type === "wall")
		{
			createWall(initialObjects[i].origin, initialObjects[i].final, false);
		}
		else if (initialObjects[i].type === "cube")
		{
			create3DCube(initialObjects[i].position, false);
		}
	}
}

function connect()
{
    connection = new WebSocket('ws://127.0.0.1:9022');

    connection.onopen = () => {

        init();
        connection.send( JSON.stringify("Message from client") );

        var room_name = {
        	type: "room_name",
        	room_name: roomName
        };

        connection.send( JSON.stringify( room_name ) );
    };

    connection.onmessage = function( msg ) {

        var message = JSON.parse( msg.data );

    	if(message.type === "initial_objects")
    	{
            console.log(message);
            console.log( message.data );
            generateInitialObjects( message.data[0].objects );            
        }
        else if ( message.type === 'init' )
        {
            user_ID = message.data;
            console.log("My ID: " + user_ID );
        }
        else if ( message.type === 'update_selectedObject_info' )
        {
            console.log( "Update message received: " );
            console.log( message.data );
            updateObjectMovement( message );
        }
        else if ( message.type === 'new_object' )
        {
            create3DCube( message.data.position, false );
        }
        else if( message.type === 'object_deleted' )
        {
            removeObjectFromScene( message.data );
        }
    };
};

function sendUpdateInfo( ws )
{
    if( objectSelected )
    {
        var info = {
            type: 'update_selectedObject_info',
            id: user_ID,
            room_name: roomName,
            data: {
                id: objectSelected.id,
                position: objectSelected.position,
                rotation: objectSelected.rotation,
                scale: objectSelected.scaling
            }
        }
        if( isOpen( ws )){ connection.send(JSON.stringify( info )); }
    }
}

function isOpen( ws ){ return ws.readyState === ws.OPEN };

window.addEventListener( 'load', connect, false );

//compute elapsed time between frames as dt
function computeDt()
{
    var now = performance.now();
    dt = (now - last)/1000;
    last = now;
};

function draw2D()
{
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(100);
    for(var i = 0; i < objects.length; i++)
    {
        if(objects[i].type === "wall")
        {
            drawLine(objects[i].origin, objects[i].final);
        }
        else if(objects[i].type === "cube")
        {
            drawCube( objects[i].position[0] + canvas.width * 0.5, objects[i].position[2] + canvas.height* 0.5 );
        }
    }
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
};

//update the position of the object that is being moved by other user
function updateObjectMovement( message )
{
    var object = retrieveObjectFromScene( message.data.id );
    object.position = message.data.position;
    object.rotation = message.data.rotation;
    object.scale = message.data.scale;
};

document.getElementById("lineBtn").addEventListener( 'click', function(){
    if(selectedTool != "line"){
        selectedTool = "line";
        this.style.border = "solid #0000FF";
        eraseBtn.style.border = "none";
        cubeBtn.style.border = "none";
        selectBtn.style.noder = "none";
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
        selectBtn.style.border = "none";
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
        selectBtn.style.border = "none";
    }
    else{
        selectedTool = null;
        this.style.border = 'none';
    }
});

document.getElementById("chairBtn").addEventListener( 'click', function(){
    if( selectedTool !== 'chair' )
    {
        selectedTool = 'chair';
        this.style.border = "solid #0000FF";
        lineBtn.style.border = "none";
        eraseBtn.style.border = "none";
        selectBtn.style.border = "none";
    }
    else{
        selectedTool = null;
        this.style.border = 'none';
    }
});

document.getElementById("sofaBtn").addEventListener( 'click', function(){
    if( selectedTool !== 'sofa' )
    {
        selectedTool = 'sofa';
        this.style.border = "solid #0000FF";
        lineBtn.style.border = "none";
        eraseBtn.style.border = "none";
        selectBtn.style.border = "none";
    }
    else{
        selectedTool = null;
        this.style.border = 'none';
    }
});

document.getElementById("selectBtn").addEventListener( 'click', function(){
    if( selectedTool !== 'select' )
    {
        selectedTool = 'select';
        this.style.border = "solid #0000FF";
        lineBtn.style.border = 'none';
        eraseBtn.style.border = 'none';
        cubeBtn.style.border = "none";
    }
    else{
        selectedTool = null;
        objectSelected = null;
        this.style.border = 'none';
    }
});

window.addEventListener('resize', resizeWindow, false);

//change canvas size when resizing window
function resizeWindow()
{
    canvas.height = canvas.parentNode.getBoundingClientRect().height;
    canvas.width = canvas.parentNode.getBoundingClientRect().width;
};

function resize3DWindow()
{
    //resizeWindow();
    context3D.canvas.width = canvas.width;
    context3D.canvas.height = canvas.height;
};

//draw background grid
function drawGrid( size )
{
    x = canvas.width;
    y = canvas.height;

    context.beginPath();
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

function drawLine ( origin, final )
{
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 5;
    context.moveTo( origin.x, origin.y );
    context.lineTo( final.x, final.y );
    context.stroke();
};

function createWall( origin, final, addToDB )
{
    //vector between the two points
    var vector = {
        x: final.x - origin.x,
        y: final.y - origin.y
    }

    //save the position where wall is gonna create
    var middlePoint = {
        x: origin.x + ( vector.x * 0.5 ), 
        y: origin.y + ( vector.y * 0.5 )
    }

    if( final.y > origin.y ) 
    {
        vector.y = -vector.y;
        vector.x = -vector.x;
    }

    var normalized = normalize( vector );
    var auxiliarVector = { x: 1, y: 0}
    
    var dotProduct = dot( normalized, auxiliarVector );
    var angleInRad = Math.acos( dotProduct );

    var wall = new RD.SceneNode({
        type: "wall",
        id: objectID,
        position: [middlePoint.x - canvas.width * 0.5, 55, middlePoint.y - canvas.height * 0.5],
        scaling: [vectorLength(vector), 115, 3],
        color: [1, 0, 1, 1],
        mesh: "cube",
        texture: "none",
        shader: "phong_texture"
    });

    var wall_object = {
        type: "wall",
        id: wall.id,
        position: wall.position,
        rotation: wall.rotation,
        scaling: wall.scaling,
        origin: origin,
        final: final
    };

    objects.push(wall_object);
    numObjects[0]++;
    objectID++;
    wall.rotate( angleInRad, RD.UP, false );
    scene.root.addChild( wall );

    if(addToDB === true)
    {
    	addObjectToList(wall_object);
    	connection.send(JSON.stringify(wall_object));
    }
    
};

function create3DCube( target, addToDB )
{
	if( addToDB )
	{
		target = [target[0] - canvas.width * 0.5, 24, target[1] - canvas.height * 0.5];
	}
    
    var cube = new RD.SceneNode( {
        type: "cube",
        id: objectID,
        position: target,
        scaling: [100, 50, 100],
        color: CUBE_COLOR,
        mesh: "cube",
        shader: "phong"
    });

    var cube_object = {
        type: "cube",
        id: cube.id,
        position: cube.position,
        rotation: cube.rotation,
        scaling: cube.scaling
    };

    objects.push(cube_object);
    numObjects[1]++;
    objectID++;
    scene.root.addChild( cube );

    var cube_message = {
        type: "new_object",
        id: user_ID,
        room_name: roomName,
    	data: cube_object
    };

	addObjectToList(cube_object);
	
    if(addToDB === true)
    {	
    	connection.send(JSON.stringify(cube_message));
    }
    
};

function createChair( target, addToDB )
{
    var object, o;
    object = new RD.SceneNode({
        type: 'chair',
        id: objectID,
        position: target,
        scaling: [0.25, 0.25, 0.25],
        color: [1, 1, 1, 1],
        mesh: "/meshes/chair.obj",
        shader: "phong_shader",
        texture: "/textures/chair_texture.jpeg"
    });

    o = {
        type: 'chair',
        id: object.id,
        position: object.position,
        rotation: object.rotation,
        scale: object.scaling
    }

    var obj_message = {
        type: "new_object",
        id: user_ID,
        room_name: roomName,
    	data: o
    };

    if( addToDB )
    {	
    	connection.send(JSON.stringify( obj_message ));
    }

    numObjects[2]++;
    objects.push( o );
    scene.root.addChild( object );
    objectID++;
};

function createSofa( target, addToDB )
{
    var object, o;
    object = new RD.SceneNode({
        type: 'sofa',
        id: objectID,
        position: target,
        scaling: [1000, 1000, 1000],
        color: [0.02, 0.08, 0.23, 1],
        mesh: "/meshes/sofa.obj",
        shader: "phong",
        texture: "/textures/sofa.png"
    });

    o = {
        type: 'sofa',
        id: object.id,
        position: object.position,
        rotation: object.rotation,
        scale: object.scaling
    }

    var obj_message = {
        type: "new_object",
        id: user_ID,
        room_name: roomName,
    	data: o
    };

    if( addToDB )
    {	
    	connection.send(JSON.stringify( obj_message ));
    }

    numObjects[3]++;
    objects.push( o );
    scene.root.addChild( object );
    objectID++;
};

function createShelf( target, addToDB )
{
    var object, o;
    object = new RD.SceneNode({
        type: 'shelf',
        id: objectID,
        position: target,
        scaling: [2, 2, 2],
        color: [1, 1, 1, 1],
        mesh: "/meshes/aquarium_shelf.obj",
        shader: "phong_shader",
        texture: "/textures/Albedo.png"
    });

    o = {
        type: 'shelf',
        id: object.id,
        position: object.position,
        rotation: object.rotation,
        scale: object.scaling
    }

    var obj_message = {
        type: "new_object",
        id: user_ID,
        room_name: roomName,
    	data: o
    };

    if( addToDB )
    {	
    	connection.send(JSON.stringify( obj_message ));
    }

    numObjects[4]++;
    objects.push( o );
    scene.root.addChild( object );
    objectID++;
}

function createObject( target, addToDB, type )
{
    if( addToDB )
	{
		target = [target[0] - canvas.width * 0.5, 0, target[1] - canvas.height * 0.5];
    }
    
    if( type === 'cube' )
    {
        create3DCube( target, addToDB );
    }
    else if( type === 'chair' )
    {
        createChair( target, addToDB );
    }
    else if( type === 'sofa' )
    {
        createSofa( target, addToDB );
    }
    else if( type === 'shelf' )
    {
        createShelf( target, addToDB );
    }
}

function drawCube( x, y )
{
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 5;
    context.moveTo( x - 50, y - 50 );
    context.lineTo( x + 50, y - 50);
    context.lineTo( x + 50, y + 50 );
    context.lineTo( x - 50, y + 50 );
    context.lineTo( x - 50, y - 50 );
    context.stroke();
};

function getObjectFromObjectList( id )
{ 
    for(var i = 0; i < objects.length; i++)
    {
        if(id === objects[i].id)
        {
            return objects[i];
        }
    }
};

//pass the node returned from the ray and delete the object
function eraseObject( node )
{
    var aux_id;
    for( var i = 0; i < objects.length; i++ )
    {
        if( objects[i].id === node.id )
        {
            aux_id = node.id;
            deleteObjectFromList( objects[i] ); //delete it from the inspector list
            objects.splice( i, 1 );             //delete it from the objects list
            scene.root.children.splice( scene.root.children.indexOf( node ), 1 );   //delete it from the scene nodes list
        }
    }

        //send object deleted info to other users
        var message = {
            type: 'object_deleted',
            id: user_ID,
            data: aux_id,
            room_name: roomName
        }
    
        connection.send(JSON.stringify(message));   //send the id of the object to erase

};

//delete object for user using the target where he clicked
//FIXME unused function
function deleteObject( target )
{
    var aux_id; //to send the id of the object erased to the other users
    for(var i = 0; i < objects.length; i++)
    {
        if(objects[i].type === "cube")
        {
            if ( 50 > vec3.distance( objects[i].position, target ))
            {
                aux_id = objects[i].id;
                removeObjectFromScene(objects[i].id);   //delete from the scene to avoid rendering it
                deleteObjectFromList(objects[i]);   //delete object from inspector list
                objects.splice(i, 1);
                numbDeletedObjects[1]++;
            }
        }
    }

    //send object deleted info to other users
    var message = {
        type: 'object_deleted',
        id: user_ID,
        data: aux_id,
        room_name: roomName
    }

    connection.send(JSON.stringify(message));   //send the id of the object to erase

};

//delete object using id
function deleteObjectFromOutside( object_id )
{
    for(var i = 0; i < objects.length; i++)
    {
        if( objects[i].id === object_id )
        {
            removeObjectFromScene( object_id );   //delete from scene to avoid rendering it on 3D
            deleteObjectFromList( objects[i] );   //delete object from inspector list
            objects.splice(i, 1);
            numbDeletedObjects[1]++;    
        }
    }
};

function returnObjectWhenHoovered( target )
{
    distance = 50;
    var object = checkDistanceWithObjects( target, distance );
    var goalObject;
    if( typeof object !== 'undefined' )
    {
        goalObject = retrieveObjectFromScene( object.id )
        goalObject.color = [0, 1, 0, 1];
    }
};

//return the closest object to the target up to the distance
function checkDistanceWithObjects( target, distance )
{
    var auxiliarDistance;
    var pivot = 9999;
    var objectToReturn;
    for( var i = 0; i < objects.length; i++ )
    {
        if( objects[i].type === 'cube' )
        {
            auxiliarDistance = vec3.distance( objects[i].position, target );
            if( distance > auxiliarDistance )
            {
                if( auxiliarDistance < pivot ){
                    pivot = auxiliarDistance;
                    objectToReturn = objects[i];
                } 
            }
            else
            {
                returnObjectsToNormalColor( retrieveObjectFromScene( objects[i].id ), objects[i].type );
            }
        }
    }
    return objectToReturn; //return closest object or undefined otherwise
};

//return to normal color of the object that is not hoovered
function returnObjectsToNormalColor( object, type )
{
    if( type === 'cube' )
    {
        object.color = CUBE_COLOR;  //only changing node color, what about list objects color?
    }
};

//FIXME unused function
//select object from 3D by the target point of the ray
function selectObject( target )
{
    var distance = 50;
    if( checkDistanceWithObjects( target, distance ) !== 'undefined' )
    {
        objectSelected = retrieveObjectFromScene( checkDistanceWithObjects( target, distance ).id );
        setInspectorValues();
    }
};

//search the object by id and returns it
function retrieveObjectFromScene( id )
{
    for(var i = 0; i < scene._nodes.length; i++)
    {
        if(scene._nodes[i].id === id)
        {
            return scene._nodes[i];
        }
    }
};

function removeObjectFromScene( id )
{
    for(var i = 0; i < scene.root.children.length; i++)
    {
        if(scene.root.children[i].id === id)
        {
            scene.root.children.splice(i, 1);
        }
    }
};

//select object from the inspector list
function selectObjectFromList( element )
{
    let type = element.innerText.split("(")[0];
    let number = parseInt(element.innerText.split("(")[1].split(")")[0]);
    let aux = 0;

    for(var i = 0; i < objects.length; i++)
    {
        if(type === objects[i].type)
        {
            aux++;
        }

        if(aux === number)
        {
            objectSelected = retrieveObjectFromScene(objects[i].id);
            setInspectorValues();
            break;
        }
    }
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
    };

    return aux;
};

function setInspectorValues() 
{
    let transform = objectInfo.querySelectorAll("input");

    transform[0].setAttribute("value", objectSelected.position[0]);
    transform[1].setAttribute("value", objectSelected.position[1]);
    transform[2].setAttribute("value", objectSelected.position[2]);

    transform[3].setAttribute("value", objectSelected.rotation[0]);
    transform[4].setAttribute("value", objectSelected.rotation[1]);
    transform[5].setAttribute("value", objectSelected.rotation[2]);

    transform[6].setAttribute("value", objectSelected.scaling[0]);
    transform[7].setAttribute("value", objectSelected.scaling[1]);
    transform[8].setAttribute("value", objectSelected.scaling[2]);

};

//change object values from inspector
function changeInspectorValues( )
{
    if( objectSelected != null)
    {
        //objectSelected.position[0]
        //var a = document.getElementById('translateX');
    }
};

function addObjectToList( object ) {
    var ul = document.getElementById("object-list");
    var li = document.createElement("li");
    
    li.onclick = function(){
        selectedTool = 'select';
        selectBtn.style.border = "solid #0000FF";
        lineBtn.style.border = 'none';
        eraseBtn.style.border = 'none';
        cubeBtn.style.border = "none";
        selectObjectFromList(li);
    };
    
    if(object.type === "wall")
    {
        li.innerText = "wall" + "(" + numObjects[0] + ")";
    }
    else if(object.type === "cube") 
    {
        li.innerText = "cube" + "(" + numObjects[1] + ")";
    }
    
    li.id = "objectID" + object.id;
    ul.appendChild( li );
};

function deleteObjectFromList( object ) {
    var liToDelete = document.getElementById( "objectID" + object.id );
    liToDelete.remove();
};

//camera movement
function moveCamera()
{
    if( context3D.keys.W )
    {
        if( view === 'free' ) { camera.move( camera.getFront(), velocity * dt ); }
        else { walkingcamera.move( walkingcamera.getFront(), velocity * dt ) }
    }
    if ( context3D.keys.S )
    {
        if( view === 'free' ) { camera.move( camera.getFront(), -velocity * dt ); }
        else { walkingcamera.move( walkingcamera.getFront(), -velocity * dt ) }
    }
    if ( context3D.keys.A )
    {
        if( view === 'free' ) { camera.moveLocal( RD.LEFT, velocity * dt ); }
        else { walkingcamera.moveLocal( RD.LEFT, velocity * dt ); }
    }
    if ( context3D.keys.D )
    {
        if( view === 'free' ) { camera.moveLocal( RD.RIGHT, velocity * dt ); }
        else { walkingcamera.moveLocal( RD.RIGHT, velocity * dt ); }
    }
    if ( context3D.keys.Q )
    {
        if( !objectSelected )
        {
            if( view === 'free' ) { camera.rotate(rotateSpeed * dt ,RD.UP); }
            else { walkingcamera.rotate(rotateSpeed * dt ,RD.UP); }
        }
        else
        {
            objectSelected.rotate( rotateSpeed * dt, RD.UP );
        }
    }
    if ( context3D.keys.E )
    {
        if( !objectSelected )
        {
            if( view === 'free' ) { camera.rotate(-rotateSpeed * dt ,RD.UP); }
            else { walkingcamera.rotate( -rotateSpeed * dt ,RD.UP); }
        }
        else
        {
            objectSelected.rotate( -rotateSpeed * dt, RD.UP );
        }
    }
};

function freeView()
{
    view = "free";
    camera.lookAt( freeMode.position, freeMode.target, freeMode.up );
}

function walkingView()
{
    view = "walking";
    walkingcamera.lookAt( walkingMode.position, walkingMode.target, walkingMode.up );   
};

//TODO: UPDATE TO TAKE INFO WHEN NOT FIRST ENTERING THE ROOM
function udpateRoomInfo( data )
{
    for( var i = 0; i < data.length; i++ )
    {
    }
};

//create button options ---------------
function showOptions()
{
    document.getElementById("dropdown").classList.toggle("show");
};

window.onclick = function( event )
{
    if( !event.target.matches('.dropbtn'))
    {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for( var i = 0; i < dropdowns.length; i++ )
        {
            var openDropdowns = dropdowns[i];
            if( openDropdowns.classList.contains('show'))
            {
                openDropdowns.classList.remove('show');
            }
        }
    }
};

//end creat button options -----------

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
                    createWall({x: this.x, y: this.y}, {x: this.memory.x, y: this.memory.y}, true);
                    this.memory.x = this.x;
                    this.memory.y = this.y;
                }
            }
            else if( selectedTool === 'cube' )
            {
                create3DCube( [this.x, this.y], true);
            }
            this.pressed = "false";
        }
    }
};