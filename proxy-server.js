const cors_proxy = require('cors-anywhere');
   
   const host = '0.0.0.0';
   const port = 8081;
   
   cors_proxy.createServer({
     originWhitelist: [], // 允许所有域
     requireHeader: [], // 不要求特定的header
     removeHeaders: [], // 不移除任何header
     handleInitialRequest: function(req, res) {
       res.setHeader('Access-Control-Allow-Origin', '*');
       res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
       res.setHeader('Access-Control-Allow-Headers', '*');
       return false; // 继续处理请求
     }
   }).listen(port, host, function() {
     console.log('增强版CORS代理服务器运行在 ' + host + ':' + port);
   });
