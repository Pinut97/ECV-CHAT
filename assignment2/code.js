
//----------- SERVER PART -------------

//get the nickname of the user and connect to the server
var connection;
var mouse;

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

        if( msgParsed.type === 'init' )  //initialize the user when init
        {
            console.log("Mi posición: " + msgParsed.position);
            //add new instance of user
            var user = {
                name: msgParsed.name,
                posX: msgParsed.position,
                posY: canvas.height * 0.53,
                goalPosX: msgParsed.position,
                goalPosY: canvas.height * 0.53,
                imageIndex: msgParsed.imageIndex,
                flip: false,
                frame: idle,
                vel: 50,
                id: msgParsed.id,
                room_id: msgParsed.room_id
            };

            objects.push(user);

            var myPosition = {
                type: 'posRequest',
                id: objects[0].id,
                position: objects[0].posX
            }

            connection.send( JSON.stringify(myPosition));

        }
        else if ( msgParsed.type === 'posRequest')
        {
            updateUserPosition( msgParsed );
        }
        else if ( msgParsed.type === 'msg' ) //chat message from another user
        {
            console.log( "message received: " + msgParsed.data);
            if(msgParsed.room_id === objects[0].room_id)
            {
                for( var i = 0; i < objects.length; i++ )
                {
                    if( objects[i].id === msgParsed.id )
                    {
                        if( Math.abs(objects[0].posX - objects[i].posX) < distance )
                        {
                            console.log( "enters in distance" );
                            createMessage( msgParsed );
                        }
                    }
                }
            }
        }
        else if (msgParsed.type === 'systemMsg')
        {
            createMessage(msgParsed);
        }
        else if( msgParsed.type === 'id' )   //server returns id from the user (after init)
        {
            objects[0].id = msgParsed.data;
        }
        else if( msgParsed.type === 'update' )  //update position
        {
            for( var i = 0; i < objects.length; i++ )
            {
                if( objects[i].id === msgParsed.id )
                {
                    objects[i].goalPosX = msgParsed.goal;
                }
            }
        }
        else if(msgParsed.type === 'updateRoom')
        {
            console.log("update room client")
            for( var i = 0; i < objects.length; i++ )
            {
                if( objects[i].id === msgParsed.id )
                {
                    console.log("update de room");
                    objects[i].room_id = msgParsed.room_id;
                }
            }
        }
        else if( msgParsed.type === 'logout' )
        {
            for( var i = 0; i < objects.length; i++ )
            {
                if( objects[i].id === msgParsed.id )
                {
                    objects.splice( objects.indexOf(objects[i]), 1 );
                    console.log( objects );
                    break;
                }
            }
            createMessage( msgParsed );
        }
        else if ( msgParsed.type === 'whisper' )
        {
            createMessage( msgParsed );
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
        id: objects[0].id,
        room_id: objects[0].room_id
    };

    connection.send(JSON.stringify(msg));
};

//---------- LOGIC APP -----------

var canvas = document.getElementById("myCanvas");
var rect;
var connected = false;
var distance = 300;
var userToWhisper;

var messageHistory = [];
var transitions = [false, false, false, false];

var last = performance.now();
var objects = [];
var idle = [0];
var walking = [2, 3, 4, 5, 6, 7, 8];
var sprite_list = ["spritesheets/man1-spritesheet.png", "spritesheets/man2-spritesheet.png", "spritesheets/man3-spritesheet.png", "spritesheets/man4-spritesheet.png",
        "spritesheets/woman1-spritesheet.png", "spritesheets/woman2-spritesheet.png", "spritesheets/woman3-spritesheet.png", "spritesheets/woman4-spritesheet.png"]
var room_sprites = ["spritesheets/room1.jpg", "spritesheets/room2.png"];
var transition_sprites = ["spritesheets/transition0.png"];

//draw avatars
function draw()
{
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var background = new Image();
    if(objects[0].room_id === 0)
    {
        background.src = room_sprites[0];

    }
    else if (objects[0].room_id === 1)
    {
        background.src = room_sprites[1];
    }

    ctx.drawImage(background, 20, 0, canvas.width * 0.95, canvas.height * 0.95);


    var t = Math.floor(performance.now() * 0.001 * 10);

    for(var i = 0; i < objects.length; i++)
    {
        if(objects[i].room_id === objects[0].room_id)
        {
            if( userToWhisper && userToWhisper.id === objects[i].id )
            {
                ctx.lineWidth = 2;
                //ctx.strokeStyle = yellow;
                ctx.strokeRect(objects[i].posX, objects[i].posY, 75, 150 );
            }
            animation(ctx, sprite_list[objects[i].imageIndex] , 32, 64, objects[i].posX, objects[i].posY, objects[i].frame[t % objects[i].frame.length], objects[i].flip);
        } 
    }

    if(objects[0].room_id === 0)
    {
        if(transitions[0] === true)
        {
            var transition0 = new Image();
            transition0.src = transition_sprites[0];
            ctx.fillStyle = 'white';
            ctx.fillRect(canvas.width * 0.205, canvas.height * 0.44, canvas.width * 0.10, canvas.height * 0.10);
            ctx.fillStyle = 'black';
            ctx.drawImage( transition0, canvas.width * 0.155, canvas.height * 0.40, canvas.width * 0.2, canvas.height * 0.2);
        }
        else if (transitions[1] === true)
        {
            var transition1 = new Image();
            transition0.src = transition_sprites[0];
            ctx.fillStyle = 'white';
            ctx.fillRect(canvas.width * 0.05, canvas.height * 0.44, canvas.width * 0.10, canvas.height * 0.10);
            ctx.fillStyle = 'black';
            ctx.drawImage( transition0, canvas.width * 0.55, canvas.height * 0.40, canvas.width * 0.2, canvas.height * 0.2);
        }
    }
};

function animation(ctx, img, w, h, x, y, frame, flip)
{
    var image = new Image();
    image.src = img;
    if(flip)
    {
        ctx.drawImage( image, frame * w, 2*h, w, h, x, y, 75, 150 );
    }
    else
    {
        ctx.drawImage( image, frame * w, 0, w, h, x, y, 75, 150 );
    }
};

//calculate movement of avatars
function update( dt )
{
    document.body.addEventListener('mousemove', mouse.move);

    for( var i = 0; i < objects.length; i++ )
    {
        var o = objects[i];
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
    }

    //check if the user is close to a door
    checkTransitions();

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
        posY: canvas.height * 0.53,
        goalPosX: canvas.width * 0.5,
        goalPosY: canvas.height * 0.53,
        imageIndex: index,
        flip: false,
        frame: idle,
        vel: 50,
        id: null,
        room_id: 0
    };

    var welcome = {
        subtype: 'info',
        data: "Welcome to the server!"
    }

    objects.push(user);
    createMessage( welcome );

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

//send message on the chat
function sendMsg()
{
    if( !userToWhisper )
    {
        var text = document.getElementById("message-input").value;
        if( text )
        {
            var message = {
                name: objects[0].name,
                type: 'msg',
                id: objects[0].id,
                data: text,
                room_id: objects[0].room_id
            };
        
            messageHistory.push( message ); //add message to historic
        
            var li = document.createElement( "li" );
            li.textContent = "You: " + text;
            li.setAttribute("id", "ownMessage");
            document.getElementById( "message-list" ).appendChild( li );
        
            connection.send(JSON.stringify(message));
        
            document.getElementById("message-input").value = "";
        }
    }
    else
    {
        var text = document.getElementById("message-input").value;
        if( text )
        {
            var message = {
                name: objects[0].name,
                type: 'whisper',
                id: objects[0].id,
                target: userToWhisper.id,
                data: text
            }
        
            messageHistory.push( message ); //add message to historic
        
            var li = document.createElement( "li" );
            li.textContent = "You whispered to " + userToWhisper.name + ": " + text;
            li.setAttribute("id", "ownMessage");
            document.getElementById( "message-list" ).appendChild( li );
        
            connection.send(JSON.stringify(message));
        
            document.getElementById("message-input").value = "";
        }
        userToWhisper = null;
    }

};

//code to send messages with the enter button
var input = document.getElementById("message-input");
input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("add").click();
    }
});

function createMessage( msgParsed )
{
    if( msgParsed.subtype === 'info')
    {
        var message = document.createTextNode( msgParsed.data );
    }
    else if( msgParsed.type === 'logout' )
    {
        var message = document.createTextNode( msgParsed.name + " has disconnected!" );
    }
    else if( msgParsed.type === 'whisper' )
    {
        var message = document.createTextNode( msgParsed.name + " whispers: " + msgParsed.data );
    }
    else if( msgParsed.type === 'systemMsg')
    {
        var message = document.createTextNode( msgParsed.data );
    }
    else{
        var message = document.createTextNode( msgParsed.name + ": " + msgParsed.data );
    }

    var li = document.createElement( "LI" );
    li.setAttribute("id", "otherMessage")
    li.appendChild( message );
    document.getElementById( "message-list" ).appendChild( li );
};

function updateUserPosition( msgParsed )
{
    for( var i = 0; i < objects.length; i++ )
    {
        if( objects[i].id === msgParsed.id )
        {
            objects[i].posX === msgParsed.position;
            break;
        }
    }
};

window.onload = function()
{
    this.addEventListener('mousemove', mouse.move );
};

//mouse class
mouse = {
    x: 0, 
    y: 0,

    move:function( event )
    {
        rect = canvas.parentNode.getBoundingClientRect(),
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    },

    onClick:function( e )
    {
        rect = canvas.parentNode.getBoundingClientRect();
        var canvasx = e.clientX - rect.left;
        var o = objects[0]; //tenir en compte id del user
        var collision;
        if(pressTransition())
        {
        }
        else 
        {
            for( users of objects )
            {
                collision = mouse.checkMouseCollision( users )
                if( collision )
                {
                }
            }
            if( connected && canvasx < rect.right && !collision )
            {
                userToWhisper = null;
                o.goalPosX = canvasx;
                var msgUpdate = {
                    type: 'update',
                    id: o.id,
                    goal: canvasx
                };
                connection.send( JSON.stringify( msgUpdate ));
            }
        }

    },

    checkMouseCollision:function( box )
    {
        if( mouse.x > box.posX && mouse.x < box.posX + (75) && mouse.y > box.posY 
            && mouse.y < box.posY + (150) && box.room_id === objects[0].room_id)
        {
            if(box.id != objects[0].id)
            {
                userToWhisper = box;
                return true;
            }
        }
        return false;
    }

};


function pressTransition()
{
    if(transitions[0] === true)
    {
        if(mouse.x > canvas.width * 0.205 && mouse.x < canvas.width * 0.305 
        && mouse.y > canvas.height * 0.44 && mouse.y < canvas.height * 0.54)
        {
            transitions[0] = false;
            objects[0].room_id = 1;

            var message = {
                type: 'updateRoom',
                id: objects[0].id,
                room_id: objects[0].room_id
            };
            connection.send( JSON.stringify(message));
            return true;
        }
    }
    return false;
}

function checkTransitions()
{
    if(objects[0].room_id === 0)
    {
        if(objects[0].posX > canvas.width * 0.12 && objects[0].posX < canvas.width * 0.29)
        {
            console.log("puerta jiji");
            transitions[0] = true;
        }
        else 
        {
            transitions[0] = false;
        }
    }
};

document.body.addEventListener('click', mouse.onClick);
