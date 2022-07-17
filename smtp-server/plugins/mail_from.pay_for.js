'use strict';

const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.register_hook('mail', 'pay_for');
}

exports.pay_for = function (next, connection, params) {
    const plugin = this;

    const {user, host} = params[0];
    const email = `${user}@${host}`;
    connection.transaction.parse_body = true;

    fetch(`${plugin.cfg.socket.server_url}/api/users?email=${email}`)
        .then(response => {
            if (!response.ok) throw new Error(response.statusText);
            return response.json();
        })
        .then(users => {
            if (1 !== users.length) {
                throw new Error(`no users were found for the ${email} email or more than one user was found`);
            }

            const user = users[0];
            plugin.loginfo({
                id: user['id'],
                username: user['username'],
                email: user['email'],
            });

            connection.transaction.notes.isNeedPay = true;
            connection.transaction.notes.email = email;
            next();
        })
        .catch(err => {
            plugin.logwarn(`can't find user ${email}: ${err}`);
            connection.transaction.notes.isNeedPay = false;
            next();
        });
}

exports.load_config = function () {
    const plugin = this;

    plugin.cfg = plugin.config.get('pay_for.ini', () => {
        plugin.load_config();
    });
}
