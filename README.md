# Pay For Email

## Installing

To run Haraka with email payment plugins, you need to clone this repository
and configure the plugins.

```shell
git clone http://github.com/meetmorrowsolonmars/pay-to-send-mail
cd pay-to-send-mail
cat smtp-server/config/pay_for.ini
```

Project settings are stored in `smtp-server/config/pay_for.ini`.

* `socket.server_url` — the address of the server that implements the API for
  user searching, email payment, and email hashing.
* `socket.cli_auth_token` — authorization api token.
* `template.banner_plain` — plain banner template to insert in paid email.
* `template.banner_plain_verification` — plain banner template with
  verification link.
* `template.banner_html` — html banner template to insert in paid email.
* `template.email_verification_url` — verification link template (should
  be available on the internet).

To work with other mail services, you need ssl certificates. You can issue
self-signed certificates for a test run.

```shell
openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
                            -out smtp-server/config/tls_cert.pem \
                            -keyout smtp-server/config/tls_key.pem
```

It remains only to build the docker image and run it.

```shell
docker build -t pay-to-send-mail .

docker run -itd --network your_network -p 25:25 -p 587:587 pay-to-send-mail
```
