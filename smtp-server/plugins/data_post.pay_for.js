'use strict';

const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.register_hook('data_post', 'pay_for');
}

exports.pay_for = function (next, connection, _) {
    const plugin = this;

    if (!connection.transaction.notes.isNeedPay) {
        plugin.loginfo('skip pay');
        next();
        return;
    }

    plugin.loginfo(JSON.stringify(connection.transaction.notes));
    plugin.loginfo(JSON.stringify(connection.transaction.body.bodytext));

    fetch(`${plugin.cfg.socket.server_url}/api/mails/pay`, {
        method: 'post', body: JSON.stringify({
            mail: {
                from: connection.transaction.notes.email,
                data: connection.transaction.body.bodytext,
            }
        }), headers: {'Content-Type': 'application/json', 'CliAuth': plugin.cfg.socket.cli_auth_token}
    }).then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    }).then(data => {
        plugin.loginfo(JSON.stringify(data));

        for (const header of data.mail.headers) {
            connection.transaction.add_header(header.key, header.value);
        }

        // TODO: can add html banner
        const html = null;
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

