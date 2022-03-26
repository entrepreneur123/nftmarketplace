//SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage{
//state variable keeps track of number of token . sataew variable are varibale 
//that are decalared withthe contract but outside any function within that contract 
//only the function within the contract can modify state variables and these state variables are stored in the blockchain

uint public tokenCount;
//construction function is only call once after a contract is being deployed to the blockchain 
constructor() ERC721("DAPP NFT", "DAPP"){
    //we are going to call constructor in inheritant ERC721
    


}
// we will be writting function that allow us to mint nft
//here _tokenURI is metadata and whatever we are passing we specify memory location of argument and we need to 
//set visibility of this function so we want this function to be call from outside but not from within this contract 
// and we also want this function to return current token count 
function mint(string memory _tokenURI) external returns(uint) {
    tokenCount ++;
    // we mint new nft by calling _safemint  which we get from inheritant ERC721 contract 
    _safeMint(msg.sender, tokenCount);
    _setTokenURI(tokenCount, _tokenURI);
    return(tokenCount);

}

//in solidity , if you declare variable but don't initailize it, solidity will atomatically initailize that variable  with 
//default value of that datatype 



}
