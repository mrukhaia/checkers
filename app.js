var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = 0,
	roomid = 0,
	rooms =[];

app.use('/public', express.static(__dirname + '/public'));	
server.listen(82);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('*', function(req, res) {
    res.sendFile(__dirname + '/error404.html');
});

io.sockets.on('connection', function(socket){
	users++;
	socket.nickname ='user' + users;
	socket.room = 'Looby';
	updateRooms();

	socket.on('new room', function(data, callback){
		if(data === 'addnewroom'){
			if(socket.room === 'Looby'){
				roomid++;
				var newroom = 'room' + roomid;
				socket.room = newroom;
				var stonePos = builtBoard();
				var killarray = [];
				var room = {
					'roomid': roomid,
					'stonePos' : stonePos,
					'currentTurn' : 'player1',
					'gameStared' : false,
					'killarray' : killarray,
					'users' : [],
					'players' : []
				};
				
				rooms.push(room);
				socket.join(newroom);
				updateRooms();
				var roomindex = socket.room.substring(4);
				switchRoom(roomindex, socket.room);
				callback(true);
			}else{
				callback(false);
			}
		}else{
			callback(false);
		}
	});
	socket.on('changeroom',function(data, callback){
		var b = socket.room;
		socket.leave(socket.room);
		socket.join('room'+ data);
		socket.room = ('room' + data);
		if(switchRoom(data, b)){callback(true);}
		else{callback(false);}
	});
	function killes(checkx,checky,lastx,lasty,roomindex,play){

		var thisRoom = rooms[roomindex];
		var nowpl,secpl=0;
		if(!play && thisRoom.currentTurn == 'player1'){
			nowpl=1;
			secpl=2;
		}else{
			nowpl=2;
			secpl=1;
		}
		var goindx = [
				{
					nx:checkx+1,
					ny:checky-1,
					gox:checkx+2,
					goy:checky-2
				},{
					nx:checkx+1,
					ny:checky+1,
					gox:checkx+2,
					goy:checky+2
				},{
					nx:checkx-1,
					ny:checky+1,
					gox:checkx-2,
					goy:checky+2
				},{
					nx:checkx-1,
					ny:checky-1,
					gox:checkx-2,
					goy:checky-2
				}
			];

			for(var b = 0; b<goindx.length;b++){

			if(thisRoom.stonePos[goindx[b].nx][goindx[b].ny]==secpl){
				if((goindx[b].gox>0 && goindx[b].gox<=8) && (goindx[b].goy>0 && goindx[b].goy<=8)){
					
					if(thisRoom.stonePos[goindx[b].gox][goindx[b].goy]!=secpl &&  thisRoom.stonePos[goindx[b].gox][goindx[b].goy]!=nowpl){

						if(lastx==0 && lasty==0){
						//	console.log(goindx[b].gox+ ' ' +goindx[b].goy);
							
							thisRoom.killarray.push({
								nowx:checkx,
								nowy:checky,
								stoneX:goindx[b].nx,
								stoneY:goindx[b].ny,
								deltax:goindx[b].gox,
								deltay:goindx[b].goy
							});
						    killes(goindx[b].gox, goindx[b].goy, checkx, checky,roomindex,play);
						} else {
							if(lastx!=goindx[b].gox || lasty!=goindx[b].goy){
								//console.log(goindx[b].gox+ ' ' +goindx[b].goy);

								thisRoom.killarray.push({
									nowx:checkx,
									nowy:checky,
									stoneX:goindx[b].nx,
									stoneY:goindx[b].ny,
									deltax:goindx[b].gox,
									deltay:goindx[b].goy
								});
								killes(goindx[b].gox, goindx[b].goy, checkx, checky,roomindex,play);
							}

						}	
					}
				}		
		}
	}
			
	}


	socket.on('newTurn' , function(data, callback){

		var roomindex = socket.room.substring(4);
		var delindex;
		for(var k = 0; k< rooms.length ; k++){
			if(rooms[k].roomid == roomindex) {
				delindex = k;
				break;
			}
		}
		currentRoom = rooms[delindex];

		

		//console.log(data);
		if(!data.init && currentRoom.currentTurn == 'player1') { //First Player
			if(currentRoom.stonePos[data.lastindex.lastx][data.lastindex.lasty]==1 ){
				console.log(11);
				if(!data.killes){//Dont Killes
					console.log(1);
					if((data.x-data.lastindex.lastx==-1 && data.y-data.lastindex.lasty==1) || (data.x-data.lastindex.lastx==-1 && data.y-data.lastindex.lasty==-1)){
						if(currentRoom.stonePos[data.x][data.y]==0){ //There Is no Stone
							currentRoom.stonePos[data.x][data.y]=1;
							currentRoom.killarray = [];
							currentRoom.stonePos[data.lastindex.lastx][data.lastindex.lasty]=0;
							io.to(socket.room).emit('changePos', {'action':'move',gotox:data.x,gotoy:data.y,init:false, lastindex : data.lastindex});
							callback(true);
							currentRoom.currentTurn='player2';
						}else{//Thereisstone
							callback(false);
						}
					}else{
						callback(false);
					}
				}else{//Killes
					console.log(2);
					currentRoom.killarray = [];
					killes(data.lastindex.lastx,data.lastindex.lasty,0,0,delindex,data.init);
					console.log(currentRoom.killarray);
					for(var a=0;a<currentRoom.killarray.length;a++){

						var thisl = currentRoom.killarray[a];
						var nextl = currentRoom.killarray[a];

						if(a+1<currentRoom.killarray.length){
							nextl = currentRoom.killarray[a+1];
						}

						if(thisl.nowx == data.lastindex.lastx
						 && thisl.nowy == data.lastindex.lasty
						 && thisl.deltax == data.x
						 && thisl.deltay == data.y
						  ){

							io.to(socket.room).emit('changePos', {'action':'kill',arr : thisl,init:false});
							currentRoom.stonePos[thisl.deltax][thisl.deltay]=1;
							currentRoom.stonePos[thisl.nowx][thisl.nowy]=0;
							currentRoom.currentTurn='player2';
							break;
						}else if(nextl.nowx == thisl.deltax
						 && nextl.nowy == thisl.deltay
						 ){
							io.to(socket.room).emit('changePos', {'action':'kill',arr : thisl,init:false});
							currentRoom.stonePos[thisl.deltax][thisl.deltay]=1;
							currentRoom.stonePos[thisl.nowx][thisl.nowy]=0;
							currentRoom.currentTurn='player2';
							break;
						}else{
							callback(false);
						}
					}
					
					//currentRoom.killarray.splice(delindex,1);
				}
			}else{
				callback(false);
			}
		}else if(currentRoom.currentTurn == 'player2'){ // Second Player
			if(currentRoom.stonePos[data.lastindex.lastx][data.lastindex.lasty]==2){
				if(!data.killes){//Dont Killes
					console.log(3);
					if((data.x-data.lastindex.lastx==1 && data.y-data.lastindex.lasty==-1) || (data.x-data.lastindex.lastx==1 && data.y-data.lastindex.lasty==1)){
						if(currentRoom.stonePos[data.x][data.y]==0){ //There Is no Stone
							currentRoom.stonePos[data.x][data.y]=2;
							currentRoom.stonePos[data.lastindex.lastx][data.lastindex.lasty]=0;
							io.to(socket.room).emit('changePos', {'action':'move',gotox:data.x,gotoy:data.y,init:true, lastindex : data.lastindex});
							callback(true);
							currentRoom.currentTurn='player1';
						}else{//Thereisstone
							callback(false);
						}
					}else{
						callback(false);
					}
				}else{//Killes
					console.log(4);
					currentRoom.killarray = [];
					killes(data.lastindex.lastx,data.lastindex.lasty,0,0,delindex,data.init);
					console.log(currentRoom.killarray);
					
					for(var a=0;a<currentRoom.killarray.length;a++){
						thisl = currentRoom.killarray[a];
						var nextl = currentRoom.killarray[a];
						if(a+1<currentRoom.killarray.length){
							nextl = currentRoom.killarray[a+1];
						}
						if(thisl.nowx == data.lastindex.lastx
						 && thisl.nowy == data.lastindex.lasty
						 && thisl.deltax == data.x
						 && thisl.deltay == data.y
						  ){
						  
							io.to(socket.room).emit('changePos', {'action':'kill',arr : thisl,init:true});
							currentRoom.currentTurn='player1';
							currentRoom.stonePos[thisl.deltax][thisl.deltay]=2;
							currentRoom.stonePos[thisl.nowx][thisl.nowy]=0;
							break;
						}else if(nextl.nowx == thisl.deltax
						 && nextl.nowy == thisl.deltay
						 ){
							io.to(socket.room).emit('changePos', {'action':'kill',arr : thisl,init:false});
							currentRoom.currentTurn='player1';
							currentRoom.stonePos[thisl.deltax][thisl.deltay]=2;
							currentRoom.stonePos[thisl.nowx][thisl.nowy]=0;
							break;
						}else{
							callback(false);
						}
					}
					
				}
			}else{
				callback(false);
			}
		}
		//console.log(rooms[delindex].stonePos);
	});
	function builtBoard(){
		var newBoard = new Array();
		for(var t1=1;t1<=8;t1++){
			newBoard[t1]= new Array();
			for(var t2=1;t2<=8;t2++){
				if((t1>=1 && t1<=3) || (t1>=6 && t1<=8)){

					if((t1%2==1 && t2%2==0) || (t1%2==0 && t2%2==1)){
						if(t1>=6) newBoard[t1][t2] = 1;
						else newBoard[t1][t2] = 2;
					}else{
						newBoard[t1][t2] = 0;
					}
				}else{
					newBoard[t1][t2] = 0;
				}
			}
		}
	//	console.log(newBoard);
		return newBoard;
	}
	function updateRooms() {
		io.sockets.emit('updateRooms', rooms);
	}
	function switchRoom(roomindex, oldroom){
		for(var k = 0; k< rooms.length ; k++){
			if(rooms[k].roomid == roomindex) {
				delindex = k;
				break;
			}
		}
		if(rooms[delindex].users.length==0){
			io.to(socket.room).emit('switchRoom',  {status:true, cond: 'notstarted'});
			if(rooms[delindex].users.usersessionid == socket.id)  return false;
			rooms[delindex].users.push({'username':socket.nickname, 'usersessionid':socket.id});
		}else if(rooms[delindex].users.length==1){
			io.to(socket.room).emit('switchRoom', true);

			currentRoom = rooms[delindex];

			socket.broadcast.to(currentRoom.users[0].usersessionid).emit('switchRoom', {status:true, cond: 'started'});
			io.to(socket.room).emit('gameStart', currentRoom.users[0].username);
			socket.broadcast.to(currentRoom.users[0].usersessionid).emit('gameStart', socket.nickname);

			currentRoom.users.push({'username':socket.nickname, 'usersessionid':socket.id});
			currentRoom.players.push({'username':rooms[delindex].users[0].username, 'player':'player1'});
			currentRoom.players.push({'username':socket.nickname, 'player':'player2'});
			currentRoom.currentTurn = 'player1';
			currentRoom.gameStared = true;
			for (var i = rooms[delindex].players.length - 1; i >= 0; i--) {
			//	console.log(rooms[delindex].players[i]);
			};
		}else{
			socket.leave('room' + roomindex);
			socket.join(oldroom);
			socket.room = (oldroom);
			return false;
		}
		return true;
	}
	function destroyRoom(){
		var roomindex = socket.room.substring(4);
		var delindex;
		for(var k = 0; k< rooms.length ; k++){
			if(rooms[k].roomid == roomindex) {
				delindex = k;
				break;
			}
		}
		if(rooms[delindex].users.length>1){
				var b=0;
			if(rooms[delindex].users[0].usersessionid == socket.id){
				b=1;
			}

			var newsocket = io.sockets.connected[rooms[delindex].users[b].usersessionid];
			if(newsocket!= undefined){
				newsocket.room = 'Looby';
				newsocket.leave('room' + delindex);
				newsocket.join('Looby');
				newsocket.emit('leftroom', {answer:'Oponent Leaved The Room : room' + rooms[delindex].roomid + ' You are Winner!!!'});	
				}
			}
		rooms.splice(delindex,1);
	}
	socket.on('disconnect',function (data) {
		if(socket.room == 'Looby') return;
		destroyRoom();
		updateRooms();
	});
});

