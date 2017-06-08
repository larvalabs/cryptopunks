![CryptoPunks](/punk-variety.png)

### CryptoPunks Collectible Characters on the Ethereum Blockchain

CryptoPunks are 10,000 unique collectible characters with proof of ownership stored on the Ethereum blockchain. No two are exactly alike, and each one of them can be officially owned by a single person as managed and verified by a contract running on the Ethereum blockchain. More general information about CryptoPunks is available over at https://www.larvalabs.com/cryptopunks This repo contains the Ethereum contract used to manage the Punks, a verifiable image of all the punks, and a unit test to verify the contract's functionality.

### Verifying the Punks are 100% Authentic and Legit CryptoPunks™

![All the CryptoPunks](/punks.png)

This is the official and genuine image of all of the CryptoPunks that have been created. To allow verification that the punks being managed by the CryptoPunks Ethereum contract are the same as what you see in the image, we have embedded a SHA256 hash of the image file into the contract. You can generate this hash for the punks image file via a command line similar to ```openssl sha -sha256 punks.png``` and compare that to the embedded hash in the contract ```ac39af4793119ee46bbff351d8cb6b5f23da60222126add4268e261199a2921b```.
