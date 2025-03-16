const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 端口和主机设置
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.txt': 'text/plain',
  '.md': 'text/markdown'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 解析请求URL
  const parsedUrl = url.parse(req.url);
  
  // 规范化路径，并将没有扩展名的路径解析为index.html
  let pathname = parsedUrl.pathname;
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 获取请求的文件路径
  const filePath = path.join(process.cwd(), pathname);
  
  // 获取文件扩展名
  const extname = path.extname(filePath).toLowerCase();
  
  // 设置默认的内容类型
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // 尝试读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 如果文件不存在，返回404
      if (err.code === 'ENOENT') {
        console.error(`文件未找到: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<h1>404 未找到</h1><p>文件 ${pathname} 不存在。</p>`);
        return;
      }
      
      // 其他服务器错误
      console.error(`服务器错误: ${err.code}`);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>500 服务器错误</h1><p>${err.code}</p>`);
      return;
    }
    
    // 成功读取文件，返回内容
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log(`
  ==========================================
   前端开发服务器运行中 🚀
  ==========================================
   - 地址: http://${HOST}:${PORT}
   - 根目录: ${process.cwd()}
   - 时间: ${new Date().toLocaleString()}
  ==========================================
  按 Ctrl+C 停止服务器
  `);
}); 