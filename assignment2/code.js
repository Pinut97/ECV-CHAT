//import { listenerCount } from "cluster";

//----------- SERVER PART -------------

//get the nickname of the user and connect to the server
var connection;

//user clicks connect button
function connect()
{
    var name = document.getElementById("connect").value;
    //check that a username has been introduced
    if( name )
    {
        connection = new WebSocket('ws://127.0.0.1:9022');
    }
    else
    {
        alert( "Name is empty" );
    }

    //start of the connection
    connection.onopen = function()
    {
        //main app loop
        init( name, connection );
        connected = true;

        loop();
    };

    //server message manager
    connection.onmessage = function( message )
    {
        var msgParsed = JSON.parse( message.data );
        console.log(msgParsed);

        if( msgParsed.type === 'init' )  //initialize the user when init
        {
            console.log( msgParsed );

            //add new instance of user
            var user = {
                name: msgParsed.name,
                posX: msgParsed.position,
                posY: canvas.height * 0.5,
                goalPosX: msgParsed.position,
                goalPosY: canvas.height * 0.5,
                imageIndex: msgParsed.imageIndex,
                flip: false,
                frame: idle,
                vel: 50,
                id: msgParsed.id
            }
            objects.push(user);
        }
        else if ( msgParsed.type === 'msg') //chat message from another user
        {
            var message = document.createTextNode( msgParsed.name + ": " + msgParsed.data );
            var li = document.createElement( "LI" );
            li.setAttribute("id", "otherMessage")
            li.appendChild( message );
            document.getElementById( "message-list" ).appendChild( li );
        }
        else if( msgParsed.type === 'id')   //server returns id from the user (after init)
        {
            objects[0].id = msgParsed.data;
        }
        else if ( msgParsed.type === 'prevUser') { //receives data from a user connected before this one
            objects.push(msgParsed.data);
        }
    };
};

//send init info to server
function sendInitInfoToServer( connection ) 
{
    var msg = {
        name: objects[0].name,
        position: objects[0].posX,
        type: 'init',
        imageIndex: objects[0].imageIndex,
        id: objects[0].id
    };

    connection.send(JSON.stringify(msg));
}

//---------- LOGIC APP -----------

var canvas = document.getElementById("myCanvas");
var rect;
var connected = false;

var messageHistory = [];

var last = performance.now();
var objects = [];
var idle = [0];
var walking = [2, 3, 4, 5, 6, 7, 8];
var sprite_list = ["spritesheets/man1-spritesheet.png", "spritesheets/man2-spritesheet.png", "spritesheets/man3-spritesheet.png", "spritesheets/man4-spritesheet.png",
        "spritesheets/woman1-spritesheet.png", "spritesheets/woman2-spritesheet.png", "spritesheets/woman3-spritesheet.png", "spritesheets/woman4-spritesheet.png"]

//draw avatars
function draw()
{
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var t = Math.floor(performance.now() * 0.001 * 10);

    for(var i = 0; i < objects.length; i++)
    {
        console.log("Objeto: " + objects[i]);
        animation(ctx, sprite_list[objects[i].imageIndex] , 32, 64, objects[i].posX, objects[i].posY, objects[i].frame[t % objects[i].frame.length], objects[i].flip);
    }
}
function animation(ctx, img, w, h, x, y, frame, flip)
{
    var image = new Image();
    image.src = img;
    if(flip)
    {
        ctx.drawImage( image, frame * w, 2*h, w, h, x, y, 128, 256 );
    }
    else
    {
        ctx.drawImage( image, frame * w, 0, w, h, x, y, 128, 256 );
    }
}

//calculate movement of avatars
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

//init the app with the creation of the user
function init( name, connection )
{
    //init canvas size
    var parent = canvas.parentNode;
    var rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    var index = Math.floor(Math.random() * 8)

    //creation of the user info
    user = {
        name: name,
        posX: canvas.width * 0.5,
        posY: canvas.height * 0.5,
        goalPosX: canvas.width * 0.5,
        goalPosY: canvas.height * 0.5,
        imageIndex: index,
        flip: false,
        frame: idle,
        vel: 50,
        id: null
    };

    objects.push(user);

    sendInitInfoToServer( connection );

};

//main app loop
function loop()
{
    draw();

    //calculate time elapsed
    var now = performance.now();
    var dt = (now - last)/1000;
    last = now;

    update( dt );

    requestAnimationFrame( loop );  //call loop again
};

function onMouse ( e )
{
    rect = canvas.parentNode.getBoundingClientRect();
    var canvasx = e.clientX - rect.left;
    var o = objects[0]; //tenir en compte id del user

    if(e.type == 'click' && connected)
    {
        o.goalPosX = canvasx;
    }
};

document.body.addEventListener('click', onMouse);

//send message on the chat
function sendMsg()
{
    var text = document.getElementById("message-input").value;
    var message = {
        name: objects[0].name,
        type: 'msg',
        id: objects[0].id,
        data: text
    }

    messageHistory.push( message ); //add message to historic

    var li = document.createElement( "li" );
    li.textContent = "You: " + text;
    li.setAttribute("id", "ownMessage");
    document.getElementById( "message-list" ).appendChild( li );

    connection.send(JSON.stringify(message));

    document.getElementById("message-input").value = "";
};

//code to send messages with the enter button
var input = document.getElementById("message-input");
input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("add").click();
    }
});


