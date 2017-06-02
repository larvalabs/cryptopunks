pragma solidity ^0.4.8;
contract CryptoPunks {

    address owner;

    string public standard = 'CryptoPunks';
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    //bool public allPunksAssigned = false;
    uint public punksRemainingToAssign = 0;
    uint public numberOfPunksDefined = 0;
    uint numberOfPunksToReserve = 0;

    //mapping (address => uint) public addressToPunkIndex;
    mapping (uint => address) public punkIndexToAddress;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;

    struct Offer {
    bool isForSale;
    uint punkIndex;
    address seller;
    uint minValue;          // in ether
    address onlySellTo;     // specify to sell only to a specific person
    }

    // A record of punks that are offered for sale at a specific minimum value, and perhaps to a specific person
    mapping (uint => Offer) public punksOfferedForSale;

    mapping (address => uint) pendingWithdrawals;

    event Punk(uint indexed punkIndex, string punkImageData);
    event Assign(address indexed to, uint256 punkIndex);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);
    event PunkOffered(uint indexed punkIndex, uint minValue, address indexed toAddress);
    event PunkBought(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress);
    event PunkNoLongerForSale(uint indexed punkIndex);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function CryptoPunks(string tokenName, string tokenSymbol, uint numberOfPunks) payable {
        //        balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
        owner = msg.sender;
        punksRemainingToAssign = numberOfPunks;
        numberOfPunksToReserve = numberOfPunks / 10;
        numberOfPunksDefined = 0;
        totalSupply = numberOfPunks;                        // Update total supply
        name = tokenName;                                   // Set the name for display purposes
        symbol = tokenSymbol;                               // Set the symbol for display purposes
        decimals = 0;                                       // Amount of decimals for display purposes
        //balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
    }

    function getPunk() returns (uint punkIndexAssigned) {
        if (punksRemainingToAssign == 0) throw;
        uint targetPunkIndex = block.number % totalSupply;
        uint emptyPunkIndex = 0;
        uint i=0;
        while (emptyPunkIndex<=targetPunkIndex) {
            if (punkIndexToAddress[i] == 0x0) {
                if (emptyPunkIndex == targetPunkIndex) {
                    punkIndexToAddress[emptyPunkIndex] = msg.sender;
                    balanceOf[msg.sender]++;
                    punksRemainingToAssign--;
                    Assign(msg.sender, emptyPunkIndex);
                    return emptyPunkIndex;
                }
                emptyPunkIndex++;
            }
            i = (i+1) % totalSupply;
        }
        // should never get here
        throw;
    }

    function definePunk(string punkImageData) {
        if (msg.sender != owner) throw;
        if (numberOfPunksDefined >= totalSupply) throw;
        Punk(numberOfPunksDefined, punkImageData);
        if (numberOfPunksDefined < numberOfPunksToReserve) {
            punkIndexToAddress[numberOfPunksDefined] = owner;
            punksRemainingToAssign--;
        }
        numberOfPunksDefined++;
    }

    /*
        function getPunkImage(uint256 punkIndex) returns (string punkImageString) {
            return punks[punkIndex];
        }
    */

    // Transfer ownership of a punk to another user without requiring payment
    function transferPunk(address to, uint punkIndex) {
        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        punkIndexToAddress[punkIndex] = to;
        balanceOf[msg.sender]--;
        Transfer(msg.sender, to, 1);
        PunkTransfer(msg.sender, to, punkIndex);
    }

    function punkNoLongerForSale(uint punkIndex) {
        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        punksOfferedForSale[punkIndex] = Offer(false, punkIndex, msg.sender, 0, 0x0);
        PunkNoLongerForSale(punkIndex);
    }

    function offerPunkForSale(uint punkIndex, uint minValue) {
        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        punksOfferedForSale[punkIndex] = Offer(true, punkIndex, msg.sender, minValue, 0x0);
        PunkOffered(punkIndex, minValue, 0x0);
    }

    function offerPunkForSaleToAddress(uint punkIndex, uint minValue, address toAddress) {
        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        punksOfferedForSale[punkIndex] = Offer(true, punkIndex, msg.sender, minValue, toAddress);
        PunkOffered(punkIndex, minValue, toAddress);
    }

    function buyPunk(uint punkIndex) payable {
        Offer offer = punksOfferedForSale[punkIndex];
        if (!offer.isForSale) throw;                // punk not actually for sale
        if (offer.onlySellTo != 0x0 && offer.onlySellTo != msg.sender) throw;  // punk not supposed to be sold to this user
        if (msg.value < offer.minValue) throw;      // Didn't send enough ETH
        if (offer.seller != punkIndexToAddress[punkIndex]) throw; // Seller no longer owner of punk

        transferPunk(msg.sender, punkIndex);
        punkNoLongerForSale(punkIndex);
        pendingWithdrawals[offer.seller] += msg.value;
        PunkBought(punkIndex, msg.value, offer.seller, msg.sender);
    }

    function withdraw() {
        uint amount = pendingWithdrawals[msg.sender];
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
    }
}