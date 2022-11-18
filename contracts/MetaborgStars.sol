// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol'; 
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol'; 
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol'; 

contract MetaborgStars is ERC721Upgradeable {

    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint8;
    using StringsUpgradeable for uint256; 

    uint private randomizerIndex;
    address public owner;
    uint private ownerBalance;
    uint8[] private availablePagesArray; 
    uint8[] private availableStarsArray; 
    uint public blockDelay;
    address public ERC1155Address;
    string public baseURI;
    uint8 visibility;

    /*
        @dev: It will be a waterfall check based on the order specified by priority
    */

    enum visibilityInfo {
        OPEN,
        WHITELISTED,
        OWNER,
        OWNER_OR_WHITELISTED,
        OWNER_AND_WHITELISTED,
        CLOSED
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
    event revealURIEvent(string oldURI, string newURI);
    
    modifier onlyOwner {
        require(owner == msg.sender, "ONLY_OWNER_CAN_RUN_THIS_FUNCTION");
        _;
    }

    function initialize(uint[] memory _availableIDs, uint8[] memory _stars, string memory _baseURI, address _ERC1155Address) initializer public {
        __ERC721_init("Metaborg Five Stars by Giovanni Motta", "Metaborg Five Stars"); 
        owner = msg.sender;
        ERC1155Address = _ERC1155Address;
        require(_stars.length < uint(256), "IPFS_LIST_TOO_LONG"); // Due to uint8 and project requirements
        for(uint index = uint(0); index < _stars.length; index++){
            require(_stars[index] >= 0 && _stars[index] <= 5, "STAR_VALUE_NOT_VALID");
            availableStarsArray.push(uint8(_stars[index]));
            availablePagesArray.push(uint8(_availableIDs[index]));
        }
        baseURI = _baseURI;
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
        uint result = uint(visibilityInfo.OPEN); // = 0
        uint METABORG_DIAMOND_ID = uint(1);
        uint METABORG_GOLD_ID = uint(2);
        uint METABORG_ORIGINAL_ID = uint(3);
        IERC1155Upgradeable IERC1155 = IERC1155Upgradeable(ERC1155Address);
        require(ERC1155Address != address(0), "ERC1155_NOT_SET");
        if(isWhitelisted[_address]) {
            result = result.add(uint(visibilityInfo.WHITELISTED)); // = 1
        }
        if(IERC1155.balanceOf(_address, METABORG_DIAMOND_ID) > 0 || IERC1155.balanceOf(_address, METABORG_GOLD_ID) > 0 || IERC1155.balanceOf(_address, METABORG_ORIGINAL_ID) > 0) {
            result = result.add(uint(visibilityInfo.OWNER)); // 2
        }
        // = 3 if both
        return result;
    }
    /*
        @dev: Group ID is equals to 0 (open), 1 (whitelisted), 2 (owner), 3 (whitelisted+owner)
    */
    function setGroupMetaData(uint[] memory _prices, uint[] memory _packs, uint _groupID) public onlyOwner returns(bool){
        require(_prices.length == uint(3), "PRICE_ARRAY_LENGTH_DISMATCH");
        require(_packs.length == uint(3), "PACKS_ARRAY_LENGTH_DISMATCH");
        require(_groupID < uint(visibilityInfo.CLOSED), "GROUP_ID_NOT_VALID");
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

    function setVisibility(uint8 _visibility) public onlyOwner returns(bool){
        require(visibility != _visibility, "SWITCH_DISMATCH");
        visibility = _visibility;
        return true;
    }

    // OPENSEA COMPATIBILITY OVERRIDE
    // BaseURI Example: "https://<your-gateway>.mypinata.cloud/ipfs/<CID-Folder>/"

    function tokenURI(uint256 _tokenId) public override view returns (string memory) {
        return string(abi.encodePacked(baseURI,_tokenId.toString(),".json"));
    }

    function revealURI(string memory _newBaseURI) public onlyOwner returns(bool){
        string memory oldBaseURI = baseURI;
        baseURI = _newBaseURI;
        emit revealURIEvent(oldBaseURI, _newBaseURI);
        return true;
    }

    // RANDOMIZER LOGIC

    function bytesToUint(bytes32 b) public pure returns (uint256){
        uint256 number;
        for(uint i=uint(0);i<b.length;i++){
            number = number + uint8(b[i]);
        }
        return number;
    }

    function getRandom(uint _externalMax) public returns(uint){ // _externalmax = numberOfElements
        require(_externalMax > 0, "CANT_DIVIDE_BY_ZERO");
        uint randomNumber = bytesToUint(bytes32(keccak256(abi.encodePacked(msg.sender, block.timestamp, block.number, address(this), randomizerIndex++))));
        return randomNumber.mod(_externalMax);
    }

    function shiftArray8(uint8[] memory _array, uint8[] memory _indexesToDelete) public pure returns(uint8[] memory){ 
        uint k;
        bool f;
        uint8[] memory r = new uint8[](_array.length.sub(_indexesToDelete.length));
        for(uint i = uint(0); i < _array.length; i++){
            for(uint j = uint(0); j < _indexesToDelete.length; j++){
                f || i == _indexesToDelete[j] ? f = true : true; 
            }
            !f ? r[k++] = _array[i]: uint(0);
            f = false;
        }
        return r;
    }
 
    function buyMetaborgStars() public payable returns(uint8[] memory){
        uint checkUserGroup = getUserGroup(msg.sender);
        // VISIBILITY CHECKING
        if(visibility == uint8(visibilityInfo.OPEN)){ // OPEN TO EVERYONE
            require(checkUserGroup <= uint(3), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.OWNER)){ // OPEN TO OWNER
            require(checkUserGroup == uint(1), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.WHITELISTED)){ // OPEN TO WHITELISTED
            require(checkUserGroup == uint(2), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.OWNER_OR_WHITELISTED)){ // OPEN TO OWNER OR WHITELISTED
            require(checkUserGroup == uint(1) || checkUserGroup == uint(2), "RESERVED_FUNCTION");
        }
        if(visibility == uint8(visibilityInfo.OWNER_AND_WHITELISTED)){ // OPEN TO OWNER AND WHITELISTED
            require(checkUserGroup == uint(3), "RESERVED_FUNCTION");
        }
        if(visibility >= uint8(visibilityInfo.CLOSED)){ // CLOSED
             revert();
        }
        // GET METADATA
        (uint8 pack1, uint8 pack2, uint8 pack3, uint price1, uint price2, uint price3) = getAddressMetadata(msg.sender);
        require(pack1 > uint(0), "UNDETECTED_METADATA");
        uint8 packsPagesNumber;
        uint8[] memory tmpPagesAvailable = availablePagesArray;
        uint8[] memory tmpStarsAvailable = availableStarsArray;
        if(price1 == msg.value) packsPagesNumber = pack1;
        if(price2 == msg.value) packsPagesNumber = pack2;
        if(price3 == msg.value) packsPagesNumber = pack3;
        uint8[] memory randomIDList = new uint8[](uint(packsPagesNumber)); 
        require(packsPagesNumber > 0, "NOT_VALID_MSG_VALUE");
        require(tmpPagesAvailable.length >= packsPagesNumber, "NOT_ENOUGH_PAGES_AVAILABLE");
        // BUYING SYSTEM
        bool forceStar;
        bool specialPage;
        uint8 pageID;
        uint stars;
        for(uint index = uint(0); index < packsPagesNumber; index++) {
            if(index == packsPagesNumber.sub(1) && !forceStar && !specialPage && (packsPagesNumber == pack2 || packsPagesNumber == pack3)) forceStar = true;
            (pageID, tmpPagesAvailable, tmpStarsAvailable, stars) = buySinglePageAndGetPageID(tmpPagesAvailable, tmpStarsAvailable, forceStar);
            if(stars == uint(3) || stars == uint(4)) specialPage = true; 
            randomIDList[index] = uint8(pageID);
        }
        availablePagesArray = new uint8[](tmpPagesAvailable.length);
        availableStarsArray = new uint8[](tmpStarsAvailable.length);
        availablePagesArray = tmpPagesAvailable;
        availableStarsArray = tmpStarsAvailable;
        ownerBalance = ownerBalance.add(msg.value);
        return randomIDList;
    }    

    function airdropManga(address[] memory _addresses, uint[] memory _IDs) public onlyOwner returns(bool){
        require(_addresses.length == _IDs.length, "LENGHT_DISMATCH");
        for(uint index = uint(0); index < _addresses.length; index++){
            _safeMint(_addresses[index], _IDs[index]);
        }
        return true;
    }

    function getForcedStarArray(uint8[] memory _starsArray) public pure returns(uint8[] memory, uint){
        uint resultIndex = 0;
        for(uint index = uint(0); index < _starsArray.length; index++){
            if(_starsArray[index] == uint(3) || _starsArray[index] == uint(4)) {
                _starsArray[resultIndex] = uint8(index);
                resultIndex++;
            }
        }
        return (_starsArray, resultIndex); 
    }

    function buySinglePageAndGetPageID(uint8[] memory _pagesAvailable, uint8[] memory _starsAvailable, bool _forceStar) private returns(uint8, uint8[] memory, uint8[] memory, uint8){ 
        uint8[] memory randomIndex = new uint8[](1);
        uint8[] memory pageID = new uint8[](1);
        if(_forceStar) {
            (uint8[] memory availableForcedPagesArray, uint elements) = getForcedStarArray(_starsAvailable);
            elements > 0 ? randomIndex[0] = availableForcedPagesArray[getRandom(elements)] : randomIndex[0] = uint8(getRandom(_pagesAvailable.length));    
        } else {
            randomIndex[0] = uint8(getRandom(_pagesAvailable.length));           
        }
        pageID[0] = _pagesAvailable[randomIndex[0]];
        _safeMint(msg.sender, pageID[0]);
        expirationBlock[pageID[0]] = (block.number).add(blockDelay);
        uint8 stars = _starsAvailable[randomIndex[0]];
        return (uint8(pageID[0]), shiftArray8(_pagesAvailable, randomIndex), shiftArray8(_starsAvailable, randomIndex), stars);
    }

    function withdrawOwnerBalance(address payable _to) public onlyOwner returns(bool){
        uint balance = ownerBalance;
        ownerBalance = uint(0);
        (bool sent, ) = _to.call{value : balance}("");
        require(sent, "ETHERS_NOT_SENT");
        emit withdrawOwnerBalanceEvent(_to, balance);
        return true;
    }

    function getAddressMetadata(address _address) public view returns(uint8, uint8, uint8, uint, uint, uint){
        groupPriceStruct memory groupPrice = groupPriceMetaData[getUserGroup(_address)];
        if(groupPrice.price1 == uint(0)) groupPrice = groupPriceMetaData[0]; 
        return (uint8(groupPrice.pack1), uint8(groupPrice.pack2), uint8(groupPrice.pack3), groupPrice.price1, groupPrice.price2, groupPrice.price3);
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