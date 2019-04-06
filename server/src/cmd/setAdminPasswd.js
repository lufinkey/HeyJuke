// setAdminPasswd

const argon2 = require('argon2');
const fs = require('fs');
const readline = require('readline');
const process = require('process');

exports.command = 'setAdminPassword <config>';

exports.handler = function(argv) {
    const config = argv.config;

    const contents = JSON.parse(fs.readFileSync(config));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("New password: ", a => {
        argon2.hash(a).then(hash => {
            contents['main_password_hash'] = hash;
            fs.writeFileSync(config, JSON.stringify(contents,  null, 4));
            console.log("\npassword set.");
            process.exit(0);
        });
    });

    rl._writeToOutput = toWrite => {
        return;
    };
};
