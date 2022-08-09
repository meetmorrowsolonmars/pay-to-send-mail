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

exports.sign_message = function (next, connection) {
    const plugin = this;
    const url = `${plugin.pay_for_config.socket.server_url}/api/mails/sign`;

    if (!connection.transaction.notes.is_need_pay) {
        next();
        return;
    }

    let message = '';

    connection.transaction.message_stream.on('data', function (chunk) {
        message += chunk.toString();
    });

    connection.transaction.message_stream.on('end', async function () {
        const response = await fetch(url, {
            method: 'post',
            body: JSON.stringify({
                mail: {
                    id: connection.transaction.notes.mail_id,
                    data: message,
                }
            }),
            headers: {
                'Content-Type': 'application/json', 'CliAuth': plugin.pay_for_config.socket.cli_auth_token,
            }
        });
        if (!response.ok) {
            plugin.logwarn(`request execution error ${response.statusText}`);
            return;
        }

        const data = await response.json();
        plugin.loginfo(`message ${data.mail.id} sign ${data.mail.sign}`);
    });

    next();
}
