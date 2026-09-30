Drop extra root CA certificates here as `*.pem` (gitignored) and Node trusts them while the image
installs its packages (`npm ci`). Only needed behind a TLS-intercepting corporate proxy; on a normal
network leave this folder as it is.
