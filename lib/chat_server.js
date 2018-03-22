
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = ();
// 启动socket.io服务器
exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);
	// 定义每个用户连接的处理逻辑
	io.sockets.on('connection', function(socket){
		// 在用户连接上来时赋予其一个访问名
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		// 在用户连接上来时把他放入聊天室Lobby
		joinRoom(socket, 'Lobby');
		// 处理用户的消息，更名，以及聊天室的创建和变更
		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);
		// 用户发出请求时，向其提供已经被占用的聊天室的列表
		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		// 定义用户断开连接后的清除逻辑
		handleClientDisconnection(socket, nickNames, namesUsed);
	})
}

// 分配昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
	// 生成新昵称
	var name = 'Guest' + guestNumber;
	// 把用户昵称跟客户端连接ID关联上
	nickNames[socket.id] = name;
	// 让用户知道他们的昵称
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	// 存放已经被占用的昵称
	namesUsed.push(name);
	// 增加用来生成昵称的计数器
	return guestNumber + 1;
}

// 进入聊天室
function joinRoom(socket, room){
	// 让用户进入房间
	socket.join(room);
	// 记录用户的当前房间
	currentRoom[socket.id] = room;
	// 让用户知道他们进入了新的房间
	socket.emit('joinResult', {
		room: room
	});
	// 让房间里的其他用户知道有新用户进入了房间
	socket.broadcast.to(room).emit('message', {
		text: nickNames[sockets.id] + 'has joined' + room + '.'
	});
	// 确定有哪些用户在这个房间里
	var usersInRoom = io.socket.clients(room);
	// 如果不止一个用户在这个房间，汇总下都是谁
	if(usersInRoom.length > 1){
		var usersInRoomSummary = 'Users currently in ' + room + ':';
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id){
				if(index > 0){
					usersInRoomSummary += ',';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
	}
	usersInRoomSummary += '.';
	// 将房间里的其他用户的汇总发送给这个用户
	socket.emit('message', {
		text: usersInRoomSummary
	})
}
