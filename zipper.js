// 请求模块
var fs = require('fs');
var archiver = require('archiver');
 
// 创建生成的压缩包路径
var output = fs.createWriteStream(__dirname + '/wwww.zip');
var archive = archiver('zip', {
	zlib: {
		level: 9
	} // 设置压缩等级
});
 
// pipe 方法
archive.pipe(output);
  
// 添加一个目录，且文件包含在新目录new-subdir中
archive.directory('./www/', 'site/wwwroot');
 
//执行
archive.finalize();
