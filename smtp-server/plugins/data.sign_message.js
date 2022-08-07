'use strict';

// https://haraka.github.io/core/Plugins/#register-a-hook
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

    if (!connection.transaction.notes.is_need_pay) {
        next();
        return;
    }

    let message = '';

    connection.transaction.message_stream.on('data', function (chunk) {
        message += chunk.toString();
    });

    connection.transaction.message_stream.on('end', async function () {
    });

    next();
}
