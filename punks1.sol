pragma solidity ^0.4.8;
contract Punk1 {
    /* Public variables of the token */
    string public standard = 'CryptoPunks';
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    //bool public allPunksAssigned = false;
    uint public punksRemainingToAssign = 0;

    //mapping (address => uint) public addressToPunkIndex;
    mapping (uint => address) public punkIndexToAddress;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;

    event Assign(address indexed to, uint256 punkIndex);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function Punk1(string tokenName, string tokenSymbol) {
//        balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
        punksRemainingToAssign = punks.length;
        totalSupply = punks.length;                        // Update total supply
        name = tokenName;                                   // Set the name for display purposes
        symbol = tokenSymbol;                               // Set the symbol for display purposes
        decimals = 0;                            // Amount of decimals for display purposes
        //balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
    }

    function getPunk() returns (uint punkIndexAssigned) {
        if (punksRemainingToAssign == 0) throw;
        uint targetPunkIndex = block.number % punks.length;
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
            i = (i+1) % punks.length;
        }
        // should never get here
        throw;
    }

    function getPunkImage(uint256 punkIndex) returns (string punkImageString) {
        return punks[punkIndex];
    }

    function transferPunk(address to, uint punkIndex) {
        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        punkIndexToAddress[punkIndex] = to;
        balanceOf[msg.sender]--;
        Transfer(msg.sender, to, 1);
        PunkTransfer(msg.sender, to, punkIndex);
    }

    string[2] public punks = [
        "data:image/gif;base64,R0lGODlhGAAYAPMAAAAAAFYmAGg8CHI3CXE/HRQsfIVRFP/ZJhY3pBpDyGOFlp6engAAAAAAAAAAAAAAACH5BAAAAAAALAAAAAAYABgAAAR+UMlJq7046817R2AIegqSnOiJfGm7YomJFHGIIoAWFwDh+yFCLpMoKHq/pFAnQQYCvydguMAghYMfYDBVLL6Xq9JHBVcAB7FyqJmukeyqdaztqJPxjHjqZrfHAAZdfF0Wd0KCRwaLfhNXhFOCAAIGAo1NdRSBi5ZzZIZ8JBwRADs=",
        "data:image/gif;base64,R0lGODlhGAAYAPMAAAAAAFYmAGg8CHI3CXE/HRQsfIVRFP/ZJhY3pBpDyGOFlp6engAAAAAAAAAAAAAAACH5BAAAAAAALAAAAAAYABgAAAR+UMlJq7046817R2AIegqSnOiJfGm7YomJFHGIIoAWFwDh+yFCLpMoKHq/pFAnQQYCvydguMAghYMfYDBVLL6Xq9JHBVcAB7FyqJmukeyqdaztqJPxjHjqZrfHAAZdfF0Wd0KCRwaLfhNXhFOCAAIGAo1NdRSBi5ZzZIZ8JBwRADs=",
    ];

}