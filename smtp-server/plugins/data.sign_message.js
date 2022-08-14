'use strict';

// https://haraka.github.io/core/Plugins/#register-a-hook
const fetch = require("node-fetch");

exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.register_hook('data_post', 'sign_message');
}

exports.load_config = function () {
    const plugin = this;

    plugin.pay_for_config = plugin.config.get('pay_for.ini', () => {
        plugin.load_config();
    });
}

exports.sign_message = async function (next, connection) {
    const plugin = this;
    const url = `${plugin.pay_for_config.socket.server_url}/api/mails/sign`;

    if (!connection.transaction.notes.is_need_pay || !connection.transaction.notes.mail_id) {
        next();
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'post',
            body: JSON.stringify({
                mail: {
                    id: connection.transaction.notes.mail_id,
                    data: connection.transaction.body.bodytext,
                }
            }),
            headers: {
                'Content-Type': 'application/json', 'CliAuth': plugin.pay_for_config.socket.cli_auth_token,
            }
        });
        if (!response.ok) {
            plugin.logwarn(`request execution error ${response.statusText}`);
            next();
            return;
        }

        const data = await response.json();
        plugin.loginfo(`message ${data.mail.id} sign ${data.mail.sign}`);
    } catch (err) {
        plugin.logwarn(`can not sign email from ${connection.transaction.notes.email} mail ` +
            `${connection.transaction.notes.mail_id}: ${err}`);
    }

    next();
}
