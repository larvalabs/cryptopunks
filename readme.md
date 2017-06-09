![CryptoPunks](/punk-variety.png)

## CryptoPunks: Collectible Characters on the Ethereum Blockchain

CryptoPunks are 10,000 unique collectible characters with proof of ownership stored on the Ethereum blockchain. No two are exactly alike, and each one of them can be officially owned by a single person as managed and verified by a contract running on the Ethereum blockchain. More general information about CryptoPunks is available over at https://www.larvalabs.com/cryptopunks

This repo contains the Ethereum contract used to manage the Punks, a verifiable image of all the punks, and a unit test to verify the contract's functionality.

### Some Questions

* **How much do the punks cost?** They're free! You just need pay the transaction fee that assigns the punk to your address.
* **How much is a punk worth?** Like many things, they're worth whatever someone will pay. Somewhere in the range of $0 to $1.8M, but currently closer to $0 end of that range right now.
* **How were the punk images created?** With a generator that was programmed to generate punks with a range of features and rarity. For example, there are only 88 Zombie Punks, 24 Apes, 9 Aliens and exactly 1 Alien Punk smoking a pipe.

### How to Use the CryptoPunks Contract

The main CryptoPunks contract can be found at address **0x00000**. Watch this contract in your Ethereum wallet using that address and [this ABI file](/compiled/CryptoPunks.abi). Now you can execute the following functions on the contract:

* ```getPunk(uint index)``` to claim ownership of a punk.
* ```transferPunk(address to, uint index)``` transfer ownership of a punk to someone without requiring any payment.
* ```offerPunkForSale(uint punkIndex, uint minSalePriceInWei)``` offer one of your punks for sale to anyone willing to pay the minimum price specified (in Wei).
* ```offerPunkForSaleToAddress(uint punkIndex, uint minSalePriceInWei, address toAddress)``` offer one of your punks for some minumum price, but only to the address specified. Use this to sell a punk to a specific person.
* ```buyPunk(uint punkIndex)``` buy punk at the specified index. That punk needs to be previously offered for sale, and you need to have sent at least the amount of Ether specified as the sale price for the punk.
* ```withdraw()``` claim all the Ether people have previously sent to buy your punks.

### Verifying the Punks are 100% Authentic and Legit CryptoPunks™

![All the CryptoPunks](/punks.png)

This is the official and genuine image of all of the CryptoPunks that have been created. To allow verification that the punks being managed by the CryptoPunks Ethereum contract are the same as what you see in the image, we have embedded a SHA256 hash of the image file into the contract. You can generate this hash for the punks image file via a command line similar to ```openssl sha -sha256 punks.png``` and compare that to the embedded hash in the contract ```ac39af4793119ee46bbff351d8cb6b5f23da60222126add4268e261199a2921b```.
