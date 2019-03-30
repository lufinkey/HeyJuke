#!/usr/bin/env node

require('yargs')
    .usage('Usage: $0 <command> [options]')
    .commandDir('./src/cmd')
    .demandCommand()
    .help()
    .argv
