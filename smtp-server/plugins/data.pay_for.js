'use strict';

const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.register_hook('data', 'pay');
}

exports.load_config = function () {
    const plugin = this;

    plugin.pay_for_config = plugin.config.get('pay_for.ini', () => {
        plugin.load_config();
    });
}

exports.pay = async function (next, connection) {
    const plugin = this;
    const url = `${plugin.pay_for_config.socket.server_url}/api/mails/pay`;
    connection.transaction.parse_body = true;

    if (!connection.transaction.notes.is_need_pay) {
        next();
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'post',
            body: JSON.stringify({
                mail: {
                    from: connection.transaction.notes.email,
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
        connection.transaction.notes.mail_id = data.mail.id;

        for (const header of data.mail.headers) {
            connection.transaction.add_header(header.key, header.value);
        }

        const template = plugin.pay_for_config.template;
        const email_verification_url = template.email_verification_url.replace('%MAIL_ID%', data.mail.id);
        const banner_plain = template.banner_plain.replace('%TRANSACTION_ID%', data.transaction.id);
        const banner_plain_verification = template.banner_plain_verification
            .replace('%EMAIL_VERIFICATION_URL%', email_verification_url);
        const banner_html = template.banner_html
            .replace('%TRANSACTION_ID%', data.transaction.id)
            .replace('%EMAIL_VERIFICATION_URL%', email_verification_url);

        connection.transaction.set_banner(`${banner_plain}\n${banner_plain_verification}`, banner_html);
    } catch (err) {
        plugin.logwarn(`can not pay for mail user ${connection.transaction.notes.email}: ${err}`);
    }

    next();
}
