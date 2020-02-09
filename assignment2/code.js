
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
        id: objects[0].id
    };

    connection.send(JSON.stringify(msg));
}

//---------- LOGIC APP -----------

var canvas = document.getElementById("myCanvas");
var rect;
var connected = false;
var distance = 300;
var userToWhisper;

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
        /*
        if( userToWhisper && userToWhisper.id === objects[i].id )
        {
            ctx.lineWidth = 2;
            ctx.strokeStyle = yellow;
            ctx.strokeRect(objects[i].posX, objects[i].posY, 32 * 4, 64 * 4 );
        }*/
        animation(ctx, sprite_list[objects[i].imageIndex] , 32, 64, objects[i].posX, objects[i].posY, objects[i].frame[t % objects[i].frame.length], objects[i].flip);
    }
};

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
                data: text
            }
        
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
}

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
        for( users of objects )
        {
            collision = mouse.checkMouseCollision( users )
            if( collision )
            {
                //userToWhisper = box;
                console.log( "user to whisper: " + userToWhisper.name );
            }
        }
        if( connected && canvasx < rect.right && !collision )
        {
            o.goalPosX = canvasx;
            var msgUpdate = {
                type: 'update',
                id: o.id,
                goal: canvasx
            }
            connection.send( JSON.stringify( msgUpdate ));
        }
    },

    checkMouseCollision:function( box )
    {
        if( mouse.x > box.posX && mouse.x < box.posX + (32 * 4) && mouse.y > box.posY && mouse.y < box.posY + (64 * 4) )
        {
            userToWhisper = box;
            return true;
        }
        console.log("NOTHING!")
        return false;
    }
};

document.body.addEventListener('click', mouse.onClick);
