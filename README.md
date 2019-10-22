# Generate keys
 - Don't add passphrase
 - Key pair should be generated on server where it's used
 - Never let the private key leave the server, whether by sftp, graphql queries, or version control
ssh-keygen -t rsa -b 4096 -m PEM -f private.key
openssl rsa -in jwtRS256.key -pubout -outform PEM -out public.key
