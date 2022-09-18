// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol'; 
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';

contract MetaborgStars is ERC721Upgradeable {

    using SafeMathUpgradeable for uint256;
 
    uint private randomizerIndex;
    uint public pagesAvailable;
    address public owner;
    uint private ownerBalance;
    uint8[] public availablePagesArray;
    uint public blockDelay;

    mapping(uint => uint) priceToPackNumber;
    mapping(uint => bytes32) burnToPhysicalEdition;
    mapping(uint => uint) expirationBlock;

    event withdrawOwnerBalanceEvent(address indexed to, uint amount);
    event setPriceToPackNumberEvent(uint price, uint packNumber);
    event setContactPhysicalEditionEvent(uint tokenID, bytes32 email);
    event setBlockDelayEvent(uint oldDelay, uint newDelay);

    mapping(uint => string) IPFSOverrideConnectionURI;
    
    modifier onlyOwner {
        require(owner == msg.sender, "ONLY_OWNER_CAN_RUN_THIS_FUNCTION");
        _;
    }

    function initialize(string[] memory _IPFSList) initializer public {
        __ERC721_init("Metaborg Stars by Giovanni Motta", "Metaborg-Stars"); 
        owner = msg.sender;
        pagesAvailable = _IPFSList.length;
        require(_IPFSList.length < uint(256), "IPFS_LIST_TOO_LONG"); // Due to uint8 and project requirements
        for(uint index = uint(0); index < _IPFSList.length; index++){
            IPFSOverrideConnectionURI[index] = _IPFSList[index];
            availablePagesArray.push(uint8(index.add(1)));
        }
    }

    function setPriceToPackNumber(uint _price, uint _packNumber) public onlyOwner returns(bool){
        priceToPackNumber[_price] = _packNumber;
        emit setPriceToPackNumberEvent(_price, _packNumber);
        return true;
    }

    function setWaitToBurn(uint _blocks) public onlyOwner returns(bool){
        emit setBlockDelayEvent(blockDelay, _blocks);
        blockDelay = _blocks;
        return true;
    }

    // OPENSEA COMPATIBILITY OVERRIDE

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        return IPFSOverrideConnectionURI[_tokenId];
    }

    // RANDOMIZER LOGIC

    function bytesToUint(bytes32 b) public pure returns (uint256){
        uint256 number;
        for(uint i=uint(0);i<b.length;i++){
            number = number + uint8(b[i]);
        }
        return number;
    }

    function getRandom(uint _externalMax) private returns(uint){
        uint randomNumber = bytesToUint(bytes32(keccak256(abi.encodePacked(msg.sender, block.timestamp, block.number, address(this), randomizerIndex++))));
        return randomNumber.mod(_externalMax);
    }

    function shiftArray(uint8[] memory _array, uint _indexToDelete) public pure returns(uint8[] memory){
        for(uint index = uint(0); index < _array.length.sub(1); index++){
            if(index >= _indexToDelete) {
                _array[index] = _array[index.add(1)];            
            }
        }
        return _array;
    }

    function buyMetaborgStars() public payable returns(uint8[] memory){
        uint packsPagesNumber = priceToPackNumber[msg.value];
        uint8[] memory randomIDList = new uint8[](uint(packsPagesNumber)); 
        require(packsPagesNumber > 0, "NOT_VALID_MSG_VALUE");
        require(pagesAvailable >= packsPagesNumber, "NOT_ENOUGH_PAGES_AVAILABLE");
        for(uint index = uint(0); index < packsPagesNumber; index++) {
            randomIDList[index] = buySinglePageAndGetPageID();
        }
        ownerBalance = ownerBalance.add(msg.value);
        return randomIDList;
    }    

    function buySinglePageAndGetPageID() private returns(uint8){
        uint tmpPagesAvailable = pagesAvailable;
        uint8[] memory availablePagesArrayTmp = availablePagesArray;
        uint randomIndex = getRandom(tmpPagesAvailable);
        uint pageID = availablePagesArrayTmp[randomIndex];
        availablePagesArray = new uint8[](uint(tmpPagesAvailable.sub(1)));
        availablePagesArray = shiftArray(availablePagesArrayTmp, randomIndex);
        availablePagesArray.pop();
        pagesAvailable = tmpPagesAvailable.sub(1);
        _safeMint(msg.sender, pageID);
        expirationBlock[pageID] = (block.number).add(blockDelay);
        return uint8(pageID);
    }

    function withdrawOwnerBalance(address payable _to) public onlyOwner returns(bool){
        uint balance = ownerBalance;
        ownerBalance = uint(0);
        (bool sent, ) = _to.call{value : balance}("");
        require(sent, "ETHERS_NOT_SENT");
        emit withdrawOwnerBalanceEvent(_to, balance);
        return true;
    }

    function getPackNumber(uint _price) public view returns(uint){
        return priceToPackNumber[_price];
    }

    function burnAndReceivePhysicalEdition(uint _tokenID, string memory _email) public returns(bool){
        require(expirationBlock[_tokenID] <= block.number, "TOKEN_NOT_EXPIRED_YET");
        _burn(_tokenID); //owner check is inside the function
        bytes32 encryptEmail = keccak256(abi.encodePacked(address(this), _tokenID, _email));
        burnToPhysicalEdition[_tokenID] = encryptEmail;
        emit setContactPhysicalEditionEvent(_tokenID, encryptEmail);
        return true;
    }

    function checkEmail(uint _tokenID, string memory _email) public view returns(bool){
        bool result;
        burnToPhysicalEdition[_tokenID] == keccak256(abi.encodePacked(address(this), _tokenID, _email)) ? result = true : result = false;
        return result;
    }

    function blockToExpiration(uint _tokenID) public view returns(uint){
        uint result;
        uint expiration = expirationBlock[_tokenID];
        expiration <= block.number ? result = 0 : result = expiration.sub(block.number);
        return result;
    }
}