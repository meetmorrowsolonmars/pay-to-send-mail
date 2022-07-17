'use strict';

const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.register_hook('data', 'pay_for');
}

exports.pay_for = function (next, connection, _) {
    const plugin = this;

    if (!connection.transaction.notes.isNeedPay) {
        plugin.loginfo('skip pay');
        next();
        return;
    }

    connection.transaction.parse_body = true;

    fetch(`${plugin.cfg.socket.server_url}/api/mails/pay`, {
        method: 'post', body: JSON.stringify({
            mail: {
                from: connection.transaction.notes.email,
                // TODO: read body
                data: 'mail body',
            }
        }), headers: {'Content-Type': 'application/json', 'CliAuth': plugin.cfg.socket.cli_auth_token}
    }).then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    }).then(data => {
        for (const header of data.mail.headers) {
            connection.transaction.add_header(header.key, header.value);
        }

        const html = `<div><p>Transaction ID: ${data.transaction.id}</p></div>`;
        connection.transaction.set_banner(`Transaction ID: ${data.transaction.id}`, html);

        next();
    }).catch(err => {
        plugin.logwarn(`can't pay for mail user ${connection.transaction.notes.email}: ${err}`);
        next();
    });
}

exports.load_config = function () {
    const plugin = this;

    plugin.cfg = plugin.config.get('pay_for.ini', () => {
        plugin.load_config();
    });
}

