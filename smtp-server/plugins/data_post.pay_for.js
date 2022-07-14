const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;
    plugin.register_hook('data_post', 'pay_for');
}

exports.pay_for = function (next, connection, params) {
    if (!connection.transaction.notes.isNeedPay) {
        next()
        return;
    }

    // TODO: get server address from config
    fetch(`http://localhost:9999/api/mails/pay`, {
        body: {
            mail: {
                from: connection.transaction.notes.email,
                data: params[0]
            }
        }
    })
    // TODO: handle response
}
