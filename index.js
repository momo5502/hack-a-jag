const colors = require('colors');
const opn = require('opn');
const InControl = require('./in-control');
const CommandHandler = require('./command-handler');
const logger = require('./logger');

(async function () {
    logger.log("##############".cyan);
    logger.log("#".cyan + " hack-a-jag " + "#".cyan);
    logger.log("##############\n".cyan);

    logger.log('Enter your e-mail address:');
    const email = await CommandHandler.readLine();

    logger.log('Enter your password:');
    const password = await CommandHandler.readLine(true);

    const inControl = new InControl();
    const commandHandler = new CommandHandler();

    try {
        await inControl.connect(email, password);
    } catch (e) {
        logger.error("\nFailed to connect to Jaguar!");
        commandHandler.close();
        return;
    }

    const vehicles = await inControl.getVehicles();
    if (vehicles.length == 0) {
        logger.warn('No vehicles registered!');
        commandHandler.close();
        return;
    } else {
        logger.warn(`${vehicles.length} vehicle(s) registered:`);
        for(var i = 0; i < vehicles.length; ++i) {
            const vehicle = vehicles[i];
            const attributes = await vehicle.getAttributes();
            logger.log(`[${i}] ${attributes.nickname}`);
        }
    }

    const getVehicle = (vehicle) => {
        return vehicles[parseInt(vehicle)];
    };

    commandHandler.add("start", (vehicle, pin) => {
        logger.info("Starting Jaguar...");
        getVehicle(vehicle).start(pin);
    });

    commandHandler.add("stop", (vehicle, pin) => {
        logger.info("Stopping Jaguar...");
        getVehicle(vehicle).stop(pin);
    });

    commandHandler.add("lock", (vehicle, pin) => {
        logger.info("Locking Jaguar...");
        getVehicle(vehicle).lock(pin);
    });

    commandHandler.add("unlock", (vehicle, pin) => {
        logger.info("Unlocking Jaguar...");
        getVehicle(vehicle).unlock(pin);
    });

    commandHandler.add("honkBlink", (vehicle) => {
        logger.info("Activating alarm...");
        getVehicle(vehicle).honkBlink();
    });

    commandHandler.add("alarmOff", (vehicle) => {
        logger.info("Stopping alarm...");
        getVehicle(vehicle).alarmOff();
    });

    commandHandler.add("locate", async (vehicle) => {
        logger.info("Locating Jaguar...");
        const position = await getVehicle(vehicle).getPosition();
        opn(`http://maps.google.com/maps?&z=14&mrt=yp&t=k&q=${position.position.latitude}+${position.position.longitude}`);
    });

    commandHandler.accept();
})();
