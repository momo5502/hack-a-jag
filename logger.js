const colors = require('colors');

module.exports = {
    log: console.log,
    logNoBreak: message => {
        process.stdout.write(message)
    },
    error: error => {
        return console.error(error.brightRed);
    },
    info: info => {
        return console.info(info.cyan);
    },
    success: message => {
        return console.log(message.brightGreen);
    },
    warn: warning => {
        return console.warn(warning.yellow);
    }
};