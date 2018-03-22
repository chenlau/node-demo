
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
// cache 是用来缓存文件内容的对象
var cache = {};
// 404处理
function send404(res) {
	res.writeHead(404, {
		'Content-Type': 'text/plain'
	})
	res.write('Error 404: resource not found.')
	res.end()
}
// 发送文件
function sendFile(res, filePath, fileContents){
	res.writeHead(200, {
		'Content-Type': mime.getType(path.basename(filePath))
	});
	res.end(fileContents);
}
// 提供静态文件服务
function serveStatic(res, cache, absPath) {
	// 检查文件是否缓存在内存中
	if(cache[absPath]){
		// 从内存中返回文件
		sendFile(res, absPath, cache[absPath]);
	} else {
		// 检查文件是否存在
		fs.exists(absPath, function(exists){
			if(exists) {
				// 从硬盘中读取文件
				fs.readFile(absPath, function(err, data){
					if(err){
						send404(res);
					}else{
						// 从硬盘中读取文件并返回
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				})
			} else{
				// 发送HTTP 404 响应
				send404(res);
			}
		});
	}
}

// 创建HTTP服务器
var server = http.createServer(function(req, res){
	var filePath = false;
	if(req.url == '/'){
		// 确定返回的默认HTML文件
		filePath = 'public/index.html'
	}else{
		// 将URL路径转为文件的相对路径
		filePath = 'public' + req.url;
	}
	var absPath = './' + filePath;
	// 返回静态文件
	serveStatic(res, cache, absPath);
});
server.listen(3000, function() {
	console.log("Server listening on port 3000");
})

// 设置socket.io服务器
var chatServer = require('./lib/chat_server.js');
chatServer.listen(server);
