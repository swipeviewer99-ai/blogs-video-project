const fs = require('fs');
const path = require('path');

const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
};

module.exports = {
  ensureDirectoryExists,
};
