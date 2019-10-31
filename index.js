const colors = require('colors');
const InControl = require('./in-control');
const CommandHandler = require('./command-handler');

(async function () {
    console.log("##############".brightCyan);
    console.log("#".brightCyan + " hack-a-jag " + "#".brightCyan);
    console.log("##############\n".brightCyan);

    const inControl = new InControl();

    console.log('Enter your e-mail address:');
    const email = await CommandHandler.readLine();

    console.log('Enter your password:');
    const password = await CommandHandler.readLine(true);

    try {
        await inControl.connect(email, password);
    } catch (e) {
        console.error("Failed to connect to Jaguar!".red);
        //console.log(e);
        return;
    }

    const vehicles = await inControl.getVehicles();
    if(vehicles.length == 0) {
        console.log('No vehicles registered!');
    }
})();


//const carControl = new CarControl();
/*const commandHandler = new CommandHandler();

commandHandler.add("start", () => {
    console.log("Starting Jaguar...".brightGreen);
    //carControl.start();
});

commandHandler.add("stop", () => {
    console.log("Stopping Jaguar...".brightGreen);
    //carControl.start();
});

commandHandler.add("lock", () => {
    console.log("Locking Jaguar...".brightGreen);
    //carControl.lock();
});

commandHandler.add("unlock", () => {
    console.log("Unlocking Jaguar...".brightGreen);
    //carControl.lock();
});

commandHandler.accept();*/