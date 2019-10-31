const colors = require('colors');
const InControl = require('./in-control');
const CommandHandler = require('./command-handler');

(async function () {
    console.log("##############".brightCyan);
    console.log("#".brightCyan + " hack-a-jag " + "#".brightCyan);
    console.log("##############\n".brightCyan);

    console.log('Enter your e-mail address:');
    const email = await CommandHandler.readLine();

    console.log('Enter your password:');
    const password = await CommandHandler.readLine(true);

    const inControl = new InControl();
    const commandHandler = new CommandHandler();

    try {
        await inControl.connect(email, password);
    } catch (e) {
        console.error("Failed to connect to Jaguar!".red);
        //console.log(e);
        return;
    }

    const vehicles = await inControl.getVehicles();
    if (vehicles.length == 0) {
        console.log('No vehicles registered!');
    } else {
        vehicles.forEach((vehicle, index) => {
            console.log(`[${index}] ${vehicle.nickname}`);
        });
    }

    commandHandler.add("start", (vehicle, pin) => {
        console.log("Starting Jaguar...".brightGreen);
        vehicles[parseInt(vehicle)].start(pin);
    });

    commandHandler.add("stop", (vehicle, pin) => {
        console.log("Stopping Jaguar...".brightGreen);
        vehicles[parseInt(vehicle)].stop(pin);
    });

    commandHandler.add("lock", (vehicle, pin) => {
        console.log("Locking Jaguar...".brightGreen);
        vehicles[parseInt(vehicle)].lock(pin);
    });

    commandHandler.add("unlock", (vehicle, pin) => {
        console.log("Unlocking Jaguar...".brightGreen);
        vehicles[parseInt(vehicle)].unlock(pin);
    });

    commandHandler.add("honkBlink", (vehicle, ) => {
        console.log("Unlocking Jaguar...".brightGreen);
        vehicles[parseInt(vehicle)].honkBlink();
    });

    commandHandler.add("alarmOff", (vehicle) => {
        console.log("Unlocking Jaguar...".brightGreen);
        vehicles[parseInt(vehicle)].alarmOff();
    });

    commandHandler.accept();
})();
