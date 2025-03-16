const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose错误处理
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Mongoose重复键错误
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: '数据已存在，请勿重复添加'
    });
  }

  // Mongoose ID错误
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      message: '资源不存在'
    });
  }

  // 默认是500服务器错误
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器错误'
  });
};

module.exports = errorHandler; 