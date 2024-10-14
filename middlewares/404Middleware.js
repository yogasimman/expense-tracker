const path = require('path');

module.exports = (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html')); // Adjust the path as needed
}