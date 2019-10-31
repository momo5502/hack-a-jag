const rp = require('request-promise');
const mid = require('node-machine-id');
const getUuid = require('uuid-by-string')

IFAS_BASE_URL = 'https://ifas.prod-row.jlrmotor.com/ifas/jlr'
IFOP_BASE_ULR = 'https://ifop.prod-row.jlrmotor.com/ifop/jlr'
IF9_BASE_URL = 'https://if9.prod-row.jlrmotor.com/if9/jlr'

class InControl {

    constructor() {

    }

    async send(url, data, headers) {
        const requestHeaders = {
            'Authorization': this.accessToken ? 'Bearer ' + this.accessToken : 'Basic YXM6YXNwYXNz',
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
        this.expiresIn = new Date(new Date().getTime() + parseInt(result['expires_in']));
    }

    async registerDevice() {
        await this.send(IFOP_BASE_ULR + '/users/' + this.email + '/clients', {
            'access_token': this.accessToken,
            'authorization_token': this.authorizationToken,
            'expires_in': '86400',
            'deviceID': this.deviceId
        });
    }

    async loginUser() {
        const result = await this.send(IF9_BASE_URL + '/users?loginName=' + this.email, undefined, {
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
        
        console.log('Logged in as ' + user.contact.firstName + ' ' + user.contact.lastName);
    }

    async getVehicles() {
        const result = await this.send(IF9_BASE_URL + '/users/' + this.userId + '/vehicles?primaryOnly=true');
        
        const vehicles = [];

        if(result.vehicles) {
            console.log('TODO: Implement vehicle parsing!');
        }

        return vehicles;
    }
}

module.exports = InControl;