const request = require('request');

class CarControl {

    constructor() {
        this.baseUrl = "https://if9.prod-row.jlrmotor.com/if9/jlr/vehicles/";
    }

    connect() {
        console.log("Connecting to car...");
        this.deviceId = '489a3776-b49b-4dd2-bb83-a8159a9bc69c'; // random
        this.vehicleId = "";
    }

    start() {
        const action = "engineOn";
        return this.runAction(action);
    }

    stop() {
        const action = "engineOff";
        return this.runAction(action);
    }

    lock() {
        const action = "lock";
        return this.runAction(action);
    }

    unlock() {
        const action = "unlock";
        return this.runAction(action);
    }

    heaterOn() {
        const action = "heaterOn";
        return this.runAction(action);
    }

    heaterOff() {
        const action = "heaterOff";
        return this.runAction(action);
    }

    alarmOn() {
        const action = "alarmOn";
        return this.runAction(action);
    }

    alarmOff() {
        const action = "alarmOff";
        return this.runAction(action);
    }

    honkBlink() {
        const action = "honkBlink";
        return this.runAction(action);
    }

    runAction(action) {
        return request({
            url: this.baseUrl + this.vehicleId + "/" + action,
            headers: {
              'Content-Type': 'application/json',
              'X-Originator-Type': 'app',
              'X-OS-Type': 'Android', // haHAA
              'X-OS-Version': '9.0',
              'X-Client-Version': '1.80.1',
              'Locale': 'en-us',
              'Authorization': 'Bearer ' + this.token,
              'X-Device-Id:': this.deviceId,
              'x-telematicsprogramtype': 'jaguarprogram'
            }
          });
    }
}

module.exports = CarControl;
