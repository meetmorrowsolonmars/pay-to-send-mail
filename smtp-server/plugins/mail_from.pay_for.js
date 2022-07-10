const fetch = require('node-fetch');

// https://haraka.github.io/core/Plugins/#register-a-hook
exports.register = function () {
    const plugin = this;
    plugin.register_hook('mail', 'pay_for');
}

exports.pay_for = function (next, connection, params) {
    const plugin = this;

    const {user, host} = params[0];
    const email = `${user}@${host}`;

    // TODO: get server address from config
    fetch(`http://localhost:9999/api/users?email=${email}`)
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
            next();
        })
        .catch(err => {
            plugin.logerror(`can't find user ${email}: ${err}`);
            next();
        })
}
