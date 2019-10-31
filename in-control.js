const rp = require('request-promise');
const mid = require('node-machine-id');
const getUuid = require('uuid-by-string')

IFAS_BASE_URL = 'https://ifas.prod-row.jlrmotor.com/ifas/jlr'
IFOP_BASE_ULR = 'https://ifop.prod-row.jlrmotor.com/ifop/jlr'
IF9_BASE_URL = 'https://if9.prod-row.jlrmotor.com/if9/jlr'

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
            method: 'GET',
            uri: url,
            headers: requestHeaders,
            json: true
        };

        if (data) {
            options.method = 'POST';
            options.body = data;
        }

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
        console.log('Connecting to Jaguar...');
        await this.generateDeviceId();

        console.log('Generating authentication tokens...');
        await this.getTokens(email, password);

        console.log('Registering device...');
        await this.registerDevice();

        console.log('Performing authentication...');
        const user = await this.loginUser();

        console.log(`Logged in as ${user.contact.firstName} ${user.contact.lastName}`);
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
    constructor(inControl, data) {
        this.inControl = inControl;

        const keys = Object.keys(data);
        for (var i = 0; i < keys.length; ++i) {
            const key = keys[i];
            this[key] = data[key];
        }
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