//SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;



import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//in solidity , you can interact with other contract without having to know its code using an interface
contract Marketplace is ReentrancyGuard{
    //state variables
    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;


    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }

    //itemId => Item
    mapping(uint => Item) public items ;
    event Offered (
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller

    );
    event Bought(
        unit itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    constructor(uint _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feepercent;
    }

    //make item to offer on the marketplace
    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
        require(_price > 0, "price must be greater than zero");
        //increment itemCount
        itemCount ++;
        //transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        //add new item to items mapping
        items[itemCount] = Item (
            itemCount,
            _nft,
            _tokenId,
            _price,
            msg.sender
        );
    } 

    function purchaseItem(uint _itemId) external payable nonReentrant {
        uint _totalPrice = getTotalPrice(_itemId);
    }



