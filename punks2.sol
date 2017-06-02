pragma solidity ^0.4.8;
contract Punk2 {
    /* Public variables of the token */
    string public standard = 'CryptoPunks';
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    //bool public allPunksAssigned = false;
    uint public punksRemainingToAssign = 0;
    uint public numberOfPunksDefined = 0;

    //mapping (address => uint) public addressToPunkIndex;
    mapping (uint => address) public punkIndexToAddress;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;

    event Punk(uint indexed punkIndex, string punkImageData);
    event Assign(address indexed to, uint256 punkIndex);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function Punk2(string tokenName, string tokenSymbol, uint numberOfPunks) {
//        balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
        punksRemainingToAssign = numberOfPunks;
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
        if (numberOfPunksDefined >= totalSupply) throw;
        Punk(numberOfPunksDefined, punkImageData);
        numberOfPunksDefined++;
    }

/*
    function getPunkImage(uint256 punkIndex) returns (string punkImageString) {
        return punks[punkIndex];
    }
*/

    function transferPunk(address to, uint punkIndex) {
        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        punkIndexToAddress[punkIndex] = to;
        balanceOf[msg.sender]--;
        Transfer(msg.sender, to, 1);
        PunkTransfer(msg.sender, to, punkIndex);
    }

}