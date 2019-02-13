// setAdminPasswd

exports.command = 'setAdminPassword <password>'

exports.handler = function(argv) {
    console.log(`Your password is ${argv.password}`)
}
