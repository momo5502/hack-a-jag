const readline = require('readline');

class CommandHandler {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.commands = [];
    }

    add(name, callback) {
        this.commands[name] = callback;
    }

    accept() {
        this.rl.question('\n# ', commandLine => {
            const args = this.parse(commandLine);
            const command = args.shift();

            if (command == "quit") {
                this.rl.close();
                return;
            }

            const handler = this.commands[command];
            if (!handler) {
                console.log(`Command ${command} not available.'`);
            } else {
                handler.call(command, args);
            }

            this.accept();
        });
    }

    parse(input) {
        return input.split(" ");
    }

    static readLine(mute) {
        return new Promise(resolve => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl._writeToOutput = function _writeToOutput(stringToWrite) {
                if (!mute) {
                    rl.output.write(stringToWrite);
                }
            };

            rl.question('', line => {
                rl.close();
                
                if (mute) {
                    console.log("");
                }

                resolve(line);
            });
        });
    }
}

module.exports = CommandHandler;
