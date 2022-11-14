// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol'; 
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol'; 
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol'; 

contract MetaborgStars is ERC721Upgradeable {

    using SafeMathUpgradeable for uint256;
    using StringsUpgradeable for uint256; 

    uint private randomizerIndex;
    uint public pagesAvailable;
    address public owner;
    uint private ownerBalance;
    uint8[] public availablePagesArray;
    uint8[] public availableStarsArray;
    uint public blockDelay;
    address public ERC1155Address;
    string public baseURI;
    uint8 visibility;

    /*
        @dev: It will be a waterfall check based on the order specified by priority
    */

    enum userGroup {
        OPEN,           // priority 0
        WHITELISTED,    // priority 1
        OWNER           // priority 2
    }

    enum visibilityInfo {
        OPEN,
        OWNER,
        WHITELISTED,
        OWNER_AND_WHITELISTED,
        CLOSED
    }

    struct pagesStruct {
        uint8 pageNumber;
        uint8 stars;
    }

    struct groupPriceStruct {
        uint price1;
        uint pack1;
        uint price2;
        uint pack2;
        uint price3;
        uint pack3;
    }

    mapping(uint => groupPriceStruct) groupPriceMetaData;
    mapping(uint => bytes32) burnToPhysicalEdition;
    mapping(uint => uint) expirationBlock;
    mapping(address => bool) isWhitelisted;

    event initializeDataEvent(uint elements, bytes32 baseURI, address ERC1155Address);
    event withdrawOwnerBalanceEvent(address indexed to, uint amount);
    event setGroupPriceEvent(uint groupID, uint pack1, uint pack2, uint pack3, uint price1, uint price2, uint price3);
    event deletePriceEvent(uint price);
    event setContactPhysicalEditionEvent(uint tokenID, bytes32 email);
    event setBlockDelayEvent(uint oldDelay, uint newDelay);
    event setWhitelistEvent(address indexed to, bool isWhitelisted);

    
    modifier onlyOwner {
        require(owner == msg.sender, "ONLY_OWNER_CAN_RUN_THIS_FUNCTION");
        _;
    }

    function initialize(uint[] memory _stars, string memory _baseURI, address _ERC1155Address) initializer public {
        __ERC721_init("Metaborg Five Stars by Giovanni Motta", "Metaborg Five Stars"); 
        owner = msg.sender;
        ERC1155Address = _ERC1155Address;
        require(_stars.length < uint(256), "IPFS_LIST_TOO_LONG"); // Due to uint8 and project requirements
        for(uint index = uint(0); index < _stars.length; index++){
            require(_stars[index] >= 0 && _stars[index] <= 5, "STAR_VALUE_NOT_VALID");
            availableStarsArray.push(uint8(_stars[index]));
            availablePagesArray.push(uint8(index));
        }
        baseURI = _baseURI;
        pagesAvailable = _stars.length;
        emit initializeDataEvent(_stars.length, keccak256((abi.encodePacked(_baseURI))), _ERC1155Address);
    }

    function setWhitelistedAddresses(address[] memory _addresses, bool _toWhitelist) public onlyOwner returns(bool){
        require(_addresses.length > uint(0), "NOT_ENOUGH_ADDRESSES");
        for(uint index = uint(0); index < _addresses.length; index++){
            isWhitelisted[_addresses[index]] = _toWhitelist;
            emit setWhitelistEvent(_addresses[index], _toWhitelist);
        }
        return true;
    }

    /*
        @dev: By default the user group is OPEN
        @usr: We can have 4 cases: 0 (open), 1 (whitelisted), 2 (owner), 3 (whitelisted + owner)
    */
    function getUserGroup(address _address) public view returns(uint){
        uint result = uint(userGroup.OPEN); // = 0
        uint METABORG_DIAMOND_ID = uint(1);
        uint METABORG_GOLD_ID = uint(2);
        uint METABORG_ORIGINAL_ID = uint(3);
        IERC1155Upgradeable IERC1155 = IERC1155Upgradeable(ERC1155Address);
        require(ERC1155Address != address(0), "ERC1155_NOT_SET");
        if(isWhitelisted[_address]) {
            result = result.add(uint(userGroup.WHITELISTED)); // = 1
        }
        if(IERC1155.balanceOf(_address, METABORG_DIAMOND_ID) > 0 || IERC1155.balanceOf(_address, METABORG_GOLD_ID) > 0 || IERC1155.balanceOf(_address, METABORG_ORIGINAL_ID) > 0) {
            result = result.add(uint(userGroup.OWNER)); // 2
        }
        // = 3 if both
        return result;
    }
    /*
        @dev: Group ID is equals to 0 (open), 1 (whitelisted), 2 (owner)
    */
    function setGroupMetaData(uint[] memory _prices, uint[] memory _packs, uint _groupID) public onlyOwner returns(bool){
        require(_prices.length == uint(3), "PRICE_ARRAY_LENGTH_DISMATCH");
        require(_packs.length == uint(3), "PACKS_ARRAY_LENGTH_DISMATCH");
        require(_groupID <= uint(userGroup.OWNER), "GROUP_ID_NOT_VALID");
        groupPriceMetaData[_groupID].pack1 = _packs[0];
        groupPriceMetaData[_groupID].pack2 = _packs[1];
        groupPriceMetaData[_groupID].pack3 = _packs[2];
        groupPriceMetaData[_groupID].price1 = _prices[0];
        groupPriceMetaData[_groupID].price2 = _prices[1];
        groupPriceMetaData[_groupID].price3 = _prices[2];
        emit setGroupPriceEvent(_groupID, _packs[0], _packs[1], _packs[2], _prices[0], _prices[1], _prices[2]);
        return true;
    }

    function setWaitToBurn(uint _blocks) public onlyOwner returns(bool){
        blockDelay = _blocks;
        emit setBlockDelayEvent(blockDelay, _blocks);
        return true;
    }

    function changeVisibility(uint8 _visibility) public onlyOwner returns(bool){
        require(visibility != _visibility, "SWITCH_DISMATCH");
        visibility = _visibility;
        return true;
    }

    // OPENSEA COMPATIBILITY OVERRIDE
    // BaseURI Example: "https://<your-gateway>.mypinata.cloud/ipfs/<CID-Folder>/"

    function tokenURI(uint256 _tokenId) public override view returns (string memory) {
        return string(abi.encodePacked(baseURI,_tokenId.toString(),".json"));
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

    function shiftArray8(uint8[] memory _array, uint _indexToDelete) public pure returns(uint8[] memory){
        for(uint index = uint(0); index < _array.length.sub(1); index++){
            if(index >= _indexToDelete) {
                _array[index] = _array[index.add(1)];            
            }
        }
        return _array;
    }

    function buyMetaborgStars() public payable returns(uint8[] memory){
        uint userGroup = getUserGroup(msg.sender);
        if(visibility == uint8(visibilityInfo.OPEN)){ // OPEN TO EVERYONE
            require(userGroup == uint(0), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.OWNER)){ // OPEN TO OWNER
            require(userGroup == uint(1), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.WHITELISTED)){ // OPEN TO WHITELISTED
            require(userGroup == uint(2), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.OWNER_AND_WHITELISTED)){ // OPEN TO OWNER AND WHITELISTED
            require(userGroup == uint(3), "RESERVED_FUNCTION");
        }
        if(visibility >= uint8(visibilityInfo.CLOSED)){ // CLOSED
             revert();
        }
        (uint pack1, uint pack2, uint pack3, uint price1, uint price2, uint price3) = getAddressMetadata(msg.sender);
        require(pack1 > uint(0), "UNDETECTED_METADATA");
        uint packsPagesNumber;
        if(price1 == msg.value) packsPagesNumber = pack1;
        if(price2 == msg.value) packsPagesNumber = pack2;
        if(price3 == msg.value) packsPagesNumber = pack3;
        uint8[] memory randomIDList = new uint8[](uint(packsPagesNumber)); 
        require(packsPagesNumber > 0, "NOT_VALID_MSG_VALUE");
        require(pagesAvailable >= packsPagesNumber, "NOT_ENOUGH_PAGES_AVAILABLE");
        bool forceStar;
        for(uint index = uint(0); index < packsPagesNumber; index++) {
            if(index == packsPagesNumber.sub(1) && !forceStar){
                forceStar = true;
            }
            randomIDList[index] = buySinglePageAndGetPageID(forceStar);
        }
        ownerBalance = ownerBalance.add(msg.value);
        return randomIDList;
    }    

    function getForcedStarArray(uint8[] memory _starsArray) private returns(uint8[] memory, uint){
        uint resultIndex = 0;
        for(uint index = uint(0); index < _starsArray.length; index++){
            if(_starsArray[index] == uint(3) || _starsArray[index] == uint(4)) {
                _starsArray[resultIndex] = uint8(index);
                resultIndex++;
            }
        }
        return (_starsArray, resultIndex); 
    }

    function buySinglePageAndGetPageID(bool _forceStar) private returns(uint8){
        uint tmpPagesAvailable = pagesAvailable;
        uint8[] memory availablePagesArrayTmp = availablePagesArray;
        uint randomIndex;
        uint pageID;
        if(_forceStar) {
            (uint8[] memory availableForcedPagesArray, uint elements) = getForcedStarArray(availablePagesArrayTmp);
            randomIndex = availableForcedPagesArray[getRandom(elements.sub(1))];    // Filtered random Index research
        } else {
            randomIndex = getRandom(tmpPagesAvailable);                             // Full random Index research
        }
        pageID = availablePagesArrayTmp[randomIndex];
        availablePagesArray = new uint8[](uint(tmpPagesAvailable));
        availablePagesArray = shiftArray8(availablePagesArrayTmp, randomIndex);
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

    function getAddressMetadata(address _address) public view returns(uint, uint, uint, uint, uint, uint){
        groupPriceStruct memory groupPrice = groupPriceMetaData[getUserGroup(_address)];
        if(groupPrice.price1 == uint(0)){ // if not defined
            groupPrice = groupPriceMetaData[0]; // default
        }

        return (groupPrice.pack1, groupPrice.pack2, groupPrice.pack3, groupPrice.price1, groupPrice.price2, groupPrice.price3);
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