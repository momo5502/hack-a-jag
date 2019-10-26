const colors = require('colors');
const CarControl = require('./car-control');
const CommandHandler = require('./command-handler');

(function printHeader() {
    console.log("##############".brightCyan);
    console.log("#".brightCyan + " hack-a-jag " + "#".brightCyan);
    console.log("##############\n".brightCyan);
})();

const carControl = new CarControl();
const commandHandler = new CommandHandler();

commandHandler.add("start", () => {
    console.log("Starting Jaguar...".brightGreen);
    carControl.start();
});

commandHandler.add("stop", () => {
    console.log("Stopping Jaguar...".brightGreen);
    carControl.start();
});

commandHandler.add("lock", () => {
    console.log("Locking Jaguar...".brightGreen);
    carControl.lock();
});

commandHandler.add("unlock", () => {
    console.log("Unlocking Jaguar...".brightGreen);
    carControl.lock();
});

carControl.connect();
commandHandler.accept();