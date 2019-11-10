const rp = require('request-promise');
const mid = require('node-machine-id');
const getUuid = require('uuid-by-string');
const logger = require('./logger');

const IFAS_BASE_URL = 'https://ifas.prod-row.jlrmotor.com/ifas/jlr';
const IFOP_BASE_ULR = 'https://ifop.prod-row.jlrmotor.com/ifop/jlr';
const IF9_BASE_URL = 'https://if9.prod-row.jlrmotor.com/if9/jlr';

class InControl {
    async send(url, data, headers) {
        const requestHeaders = {
            'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : 'Basic YXM6YXNwYXNz',
            'Content-Type': 'application/json',
            'X-Device-Id': this.deviceId
        };

        if (headers) {
            const keys = Object.keys(headers);
            for (var i = 0; i < keys.length; ++i) {
                const key = keys[i];
                requestHeaders[key] = headers[key];
            }
        }

        const options = {
            method: data ? 'POST' : 'GET',
            uri: url,
            headers: requestHeaders,
            body: data,
            json: true
        };

        return await rp(options);
    }

    async generateDeviceId() {
        if (!this.deviceId) {
            const machineId = await mid.machineId();
            this.deviceId = getUuid(machineId);
        }
    }

    async getTokens(email, password) {
        const result = await this.send(IFAS_BASE_URL + '/tokens', {
            'grant_type': 'password',
            'username': email,
            'password': password
        });

        this.email = email;
        this.accessToken = result['access_token'];
        this.authorizationToken = result['authorization_token'];
        this.refreshToken = result['refresh_token'];
        this.expiresIn = new Date().getTime() + parseInt(result['expires_in']);
    }

    async registerDevice() {
        await this.send(IFOP_BASE_ULR + `/users/${this.email}/clients`, {
            'access_token': this.accessToken,
            'authorization_token': this.authorizationToken,
            'expires_in': '86400',
            'deviceID': this.deviceId
        });
    }

    async loginUser() {
        const result = await this.send(IF9_BASE_URL + `/users?loginName=${this.email}`, undefined, {
            'Accept': 'application/vnd.wirelesscar.ngtp.if9.User-v3+json'
        });

        this.userId = result['userId'];
        return result;
    }

    async connect(email, password) {
        logger.log('Connecting to Jaguar...');

        try {
            logger.logNoBreak('[*] Generating device id... ');
            await this.generateDeviceId();
            logger.success('Success.');

            logger.logNoBreak('[*] Generating authentication tokens... ');
            await this.getTokens(email, password);
            logger.success('Success.');

            logger.logNoBreak('[*] Registering device... ');
            await this.registerDevice();
            logger.success('Success.');

            logger.logNoBreak('[*] Performing authentication... ');
            const user = await this.loginUser();
            logger.success('Success.');

            logger.info(`\nLogged in as ${user.contact.firstName} ${user.contact.lastName}`);
        } catch (e) {
            logger.error('Failed.');
            throw e;
        }
    }

    async getVehicles() {
        const result = await this.send(IF9_BASE_URL + `/users/${this.userId}/vehicles?primaryOnly=true`);

        const vehicles = [];

        if (result.vehicles) {
            result.vehicles.forEach(v => {
                vehicles.push(new Vehicle(this, v.vin));
            });
        }

        return vehicles;
    }
}

class Vehicle {
    constructor(inControl, vin) {
        this.inControl = inControl;
        this.vin = vin;
    }

    async getAttributes() {
        return await this.send('attributes', undefined, {
            'Accept': 'application/vnd.ngtp.org.VehicleAttributes-v3+json'
        });
    }

    async getPosition() {
        return await this.send('position');
    }

    async lock(pin) {
        const data = await this.pin_authenticate("RDL", pin);
        await this.send('lock', data, {
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.StartServiceConfiguration-v2+json'
        });
    }

    async unlock(pin) {
        const data = await this.pin_authenticate("RDU", pin);
        await this.send('unlock', data, {
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.StartServiceConfiguration-v2+json'
        });
    }

    async start(pin) {
        const data = await this.pin_authenticate("REON", pin);
        await this.send('engineOn', data, {
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.StartServiceConfiguration-v2+json'
        });
    }

    async stop(pin) {
        const data = await this.pin_authenticate("REOFF", pin);
        await this.send('engineOff', data, {
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.StartServiceConfiguration-v2+json'
        });
    }

    async alarmOff() {
        const data = await this.vin_authenticate("ALOFF");
        await this.send('unlock', data, {
            'Accept': 'application/vnd.wirelesscar.ngtp.if9.ServiceStatus-v4+json',
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.StartServiceConfiguration-v3+json; charset=utf-8'
        });
    }

    async honkBlink() {
        const data = await this.vin_authenticate("HBLF");
        await this.send('honkBlink', data, {
            'Accept': 'application/vnd.wirelesscar.ngtp.if9.ServiceStatus-v4+json',
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.StartServiceConfiguration-v3+json; charset=utf-8'
        });
    }

    async pin_authenticate(service, pin) {
        return await this.send(`/users/${this.inControl.userId}/authenticate`, {
            'serviceName': service,
            'pin': '' + pin
        }, {
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.AuthenticateRequest-v2+json; charset=utf-8'
        });
    }

    async vin_authenticate(service) {
        return await this.send(`/users/${this.inControl.userId}/authenticate`, {
            'serviceName': service,
            'pin': this.vin.substring(this.vin.length - 4)
        }, {
            'Content-Type': 'application/vnd.wirelesscar.ngtp.if9.AuthenticateRequest-v2+json; charset=utf-8'
        });
    }

    async send(command, data, headers) {
        return await this.inControl.send(IF9_BASE_URL + `/vehicles/${this.vin}/${command}`, data, headers);
    }
}

module.exports = InControl;