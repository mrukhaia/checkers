var socket = io.connect();
var gameStarted = false;
var lastClicked;
var mePlayer = true;
var lsd = 0;
var Moveis = 'player1';
var Killes = false;
var killArr=[];
$(document).ready(function(){
	var $addRoom = $('#addRoom');

	$addRoom.submit(function(e){
		e.preventDefault();
		socket.emit('new room', 'addnewroom' , function(data){
			if(data){
				$('#board').show();
				builtBoard(true);
			}else{
				$('div').hide();
				$('#Rooms').show();
				$('#rg').show();
				$('#gamerr').html('Error Creating Room');
				$('#gamerr').show();
			}
			gameStarted=false;
			mePlayer= true;
			Moveis = 'player1';
		});
		
	});

	socket.on('updateRooms',function(data){
		var html = '';
		for(var i=0;i<data.length;i++){
			html+= '<div onclick="enterroom('+data[i].roomid+')">room '+data[i].roomid+ '</div>' + '<br/>';
		}
		$('#rg').html(html);
		
	});
	socket.on('switchRoom', function(data){
		if(data.status){
			$('div').hide();
			$('#room').show();
			$('#room').html(data);
			if(data.cond=='started') builtBoard(true);
			else{ builtBoard(false); }
			mePlayer= false;
			Moveis = 'player1';
			$('#board').show();
			$('#board div').show();
		}
	});
	socket.on('leftroom', function(data){
		$('div').hide();
		$('#Rooms').show();
		$('#rg').show();
		$('#gamerr').html(data.answer);
		$('#gamerr').show();
		$('#board').hide();
	});
	socket.on('gameStart',function(data){
		$('#Rooms').hide();
		$('#rg').hide();
		var html = 'You are Playing Vs ' + data;
		gameStarted = true;
		$('#room').show();
		$('#room').html(html);
	});
	socket.on('changePos', function(data){
		if(data.action=='move'){
			var nextDiv = $("div[data-x='"+(data.gotox)+"'][data-y='"+(data.gotoy)+"']");
			var oldDiv = $("div[data-x='"+(data.lastindex.lastx)+"'][data-y='"+(data.lastindex.lasty)+"']");
			if(mePlayer == data.init) {
				nextDiv.addClass('red');
				oldDiv.removeClass('red');
				nextDiv.attr('onclick', 'blackclicked('+data.gotox+','+data.gotoy+','+data.init+')');
				oldDiv.attr('onclick', 'blackclicked('+data.lastindex.lastx+','+data.lastindex.lasty+','+data.init+',15)');
			}
			else {
				nextDiv.addClass('blue');
				oldDiv.removeClass('blue');
			}	
			if(Moveis == 'player1'){
				Moveis = 'player2';
			}else{
				Moveis = 'player1';
			}
		}else if(data.action=='kill'){
			console.log(data);
			var nextDiv = $("div[data-x='"+(data.arr.deltax)+"'][data-y='"+(data.arr.deltay)+"']");
			var oldDiv = $("div[data-x='"+(data.arr.nowx)+"'][data-y='"+(data.arr.nowy)+"']");
			var blueDiv = $("div[data-x='"+(data.arr.stoneX)+"'][data-y='"+(data.arr.stoneY)+"']");
			if(mePlayer == data.init) {
				nextDiv.addClass('red');
				oldDiv.removeClass('red');
				blueDiv.removeClass('blue');
				nextDiv.attr('onclick', 'blackclicked('+data.arr.deltax+','+data.arr.deltay+','+data.init+')');
				oldDiv.attr('onclick', 'blackclicked('+data.arr.nowx+','+data.arr.nowy+','+data.init+',15)');
			}
			else {
				nextDiv.addClass('blue');
				oldDiv.removeClass('blue');
				blueDiv.removeClass('red');
			}
			if(Moveis == 'player1'){
				Moveis = 'player2';
			}else{
				Moveis = 'player1';
			}

		}
	});
});

function enterroom(b){
	socket.emit('changeroom', b, function(data){
		if(data){
			$('#board').show();
			builtBoard();
		}else{
			
		}
	});
}
function builtBoard(b){
	$('#board').html('');
	for(var t1=1;t1<=8;t1++){
		var b1,b2,nextlnk;
		for(var t2=1;t2<=8;t2++){
			var newdiv = '';
			if((t1%2==1 && t2%2==0) || (t1%2==0 && t2%2==1)){	
				var classi = '';
				if(t1>=1 && t1<=3){
					classi='black blue';
				}else if(t1>=6 && t1<=8){
					classi='black red';
				}else{
					classi='black';
				}
				nextlnk = '';
				b1=t1;
				b2=t2;
				if(!b) {
					 nextlnk = Math.abs(9-t1)+','+Math.abs(9-t2) +','+ true;
					 b1= Math.abs(9-t1);
					 b2= Math.abs(9-t2);
				}
				else nextlnk = t1+','+t2+','+false;
				var clc = '';

				if(t1>=6){
					clc = 'onclick="blackclicked('+nextlnk+')"';
				}
				if(classi != 'black') newdiv = '<div '+clc +' data-x="' +b1+'" data-y="' +b2+'" class="'+classi+'"></div>';
				else {
					classi = 'class="'+classi+'" onclick="blackclicked('+nextlnk+',15'+')"';
					newdiv = '<div data-x="' +b1+'" data-y="' +b2+'"'+classi+ '></div>';
				}

			}else{
				newdiv = '<div class="white"></div>';
			}
			$('#board').append(newdiv);
			if(classi=='black blue'){
			var oldDiv = $("div[data-x='"+(b1)+"'][data-y='"+(b2)+"']");
				oldDiv.attr('onclick', 'blackclicked('+nextlnk+',15)');
			}
		}	
	}		
	//	if((t1>=1 && t1<=3) || (t1>=6 && t1<=8)){}		
}

function blackclicked(thisx,thisy,k,stoke){
	if(gameStarted){
		
		if(stoke != 15){
			var b = $('div.checked');
		if(b!=null){
			b.each(function() {
				$(this).removeClass('checked').attr('active', 0);
			});
		}
			if($("div[data-x='"+(thisx)+"'][data-y='"+(thisy)+"']").hasClass('red')){
				lsd = 0;
				var result;

				if(k==false && mePlayer == false){
					result = checkindex(thisx,thisy,false);
				}else{
					result = checkindex(thisx,thisy,true);
				}
				lastClicked = {
					lastx : thisx,
					lasty : thisy
				};
				if(result !=false){
					for (var ki = 0; ki < result.length; ki++) {
						$("div[data-x='"+result[ki].deltax+"'][data-y='"+result[ki].deltay+"']").addClass('checked').attr('active', 1);
					}

				}

			}
		}else{
			var checkd = $("div[data-x='"+thisx+"'][data-y='"+thisy+"']").attr('active');
			
			console.log(lsd);
			if(stoke == 15 && lsd==0 && (lastClicked!=undefined || lastClicked!=null) && checkd != undefined && checkd== true){
				lsd=1;
				
				var b = $('div.checked');
				if(b!=null){
					b.each(function() {
						$(this).removeClass('checked').attr('active', 0);
					});
				}
				var	result = {
						x:thisx,
						y:thisy,
						init:k,
						killes : Killes,
						lastindex : lastClicked
				}
				

				socket.emit('newTurn', result, function(data){
				});

			}
		}
			

	}else{
		alert('Game Haven"t Started');
	}
}

function checkindex(checkx,checky,pl){
		killArr = [];
		checkkill(checkx,checky,pl,0,0);	
		if(killArr.length!==0){
			//console.log(killArr);
			Killes = true;
			return killArr;
		}	
		Killes = false;
		var ansArr=[];
		var check1x,check1y,check2x,check2y;

		if(Moveis == 'player1' && mePlayer==true){
			return false;
		}else if(Moveis == 'player2' && mePlayer==false){
			return false;
		}
		if(pl) {
			check1x = checkx+1;
			check1y = checky-1;
			
			check2x = checkx+1;
			check2y = checky+1;
		}else{
			check1x = checkx-1;
			check1y = checky+1;
			
			check2x = checkx-1;
			check2y = checky-1;
		}

		if(check1x>0 && check1y<=8){

			if($("div[data-x='"+(check1x)+"'][data-y='"+(check1y)+"']").hasClass('red')==false && $("div[data-x='"+(check1x)+"'][data-y='"+(check1y)+"']").hasClass('blue')==false){
				ansArr.push({
	                'deltax' : check1x, 
	                'deltay' : check1y
           		 });
			}
		}
		if(check2x>0 && check2y>0){	
			if($("div[data-x='"+(check2x)+"'][data-y='"+(check2y)+"']").hasClass('red')==false && $("div[data-x='"+(check2x)+"'][data-y='"+(check2y)+"']").hasClass('blue')==false){
				ansArr.push({
	                'deltax' : check2x, 
	                'deltay' : check2y 
           		 });
			}
		}
		if(ansArr.length>0){
			return ansArr;
		}
		else{
			return false;
		}
}
function checkkill(checkx,checky,pl,lastx,lasty){

		if(Moveis == 'player1' && mePlayer==true){
			return false;
		}else if(Moveis == 'player2' && mePlayer==false){
			return false;
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
			var narr = [];
			var stoneDiv = $("div[data-x='"+(goindx[b].nx)+"'][data-y='"+(goindx[b].ny)+"']");

			if(stoneDiv.hasClass('blue')){
				if((goindx[b].gox>0 && goindx[b].gox<=8) && (goindx[b].goy>0 && goindx[b].goy<=8)){
					var emptyDiv = $("div[data-x='"+(goindx[b].gox)+"'][data-y='"+(goindx[b].goy)+"']");

					if(emptyDiv.hasClass('blue')===false &&  emptyDiv.hasClass('red')===false ){

						if(lastx==0 && lasty==0){
						//	console.log(goindx[b].gox+ ' ' +goindx[b].goy);
							
							killArr.push({
								nowx:checkx,
								nowy:checky,
								deltax:goindx[b].gox,
								deltay:goindx[b].goy
							});

						    checkkill(goindx[b].gox, goindx[b].goy, true, checkx, checky);
						} else {
							if(lastx!=goindx[b].gox || lasty!=goindx[b].goy){
								//console.log(goindx[b].gox+ ' ' +goindx[b].goy);

								killArr.push({
									nowx:checkx,
									nowy:checky,
									deltax:goindx[b].gox,
									deltay:goindx[b].goy
								});
								checkkill(goindx[b].gox,goindx[b].goy,true,checkx,checky);
							}

						}	
					}
				}		
			}
	}

}
			
	//	if((check1x>0 && check1y<=8) && ){

	//		if($("div[data-x='"+(check1x)+"'][data-y='"+(check1y)+"']").hasClass('red')==false){
	//			ansArr.push({
	//                'deltax' : check1x, 
	 //               'deltay' : check1y
     //      		 });
	//		}
	//	}

