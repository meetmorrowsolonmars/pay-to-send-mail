'use strict';

const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.register_hook('mail', 'is_user_exists');
}

exports.load_config = function () {
    const plugin = this;

    plugin.pay_for_config = plugin.config.get('pay_for.ini', () => {
        plugin.load_config();
    });
}

exports.is_user_exists = async function (next, connection, params) {
    const plugin = this;
    connection.transaction.notes.is_need_pay = false;

    const url_template = `${plugin.pay_for_config.socket.server_url}/api/users`;
    const {user, host} = params[0];
    const email = `${user}@${host}`;

    try {
        const response = await fetch(`${url_template}?email=${email}`);
        if (!response.ok) {
            plugin.logwarn(`request execution error ${response.statusText}`);
            next();
            return;
        }

        const users = await response.json();
        if (1 !== users.length) {
            plugin.logwarn(`no users were found for the ${email} email or more than one user was found`);
            next();
            return;
        }
    } catch (err) {
        plugin.logwarn(`can't find user ${email}: ${err}`);
        next();
        return;
    }

    connection.transaction.notes.is_need_pay = true;
    connection.transaction.notes.email = email;
    next();
}
