const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;
    plugin.register_hook('data_post', 'pay_for');
}

exports.pay_for = function (next, connection, params) {
    const plugin = this;

    if (!connection.transaction.notes.isNeedPay) {
        next();
        return;
    }

    this.loginfo(JSON.stringify(connection.transaction.notes));
    this.loginfo(JSON.stringify(connection.transaction.body.bodytext));

    // TODO: get server address from config
    fetch(`http://localhost:9999/api/mails/pay`, {
        method: 'post',
        body: JSON.stringify({
            mail: {
                from: connection.transaction.notes.email,
                data: connection.transaction.body.bodytext
            }
        }),
        // TODO: get auth token from config
        headers: {'Content-Type': 'application/json', 'CliAuth': '123123'}
    }).then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    }).then(data => {
        this.loginfo(JSON.stringify(data));
        for (const header of data.mail.headers) {
            connection.transaction.add_header(header.key, header.value);
        }
        next();
    }).catch(err => {
        plugin.logerror(`can't pay for mail user ${connection.transaction.notes.email}: ${err}`);
        next();
    });
    // TODO: handle response
}
