
const ABI = [
    "function joinGame() external payable",
    "function spin() external",
    "function getCurrentGame() external view returns (tuple(uint256 gameId, uint8 status, uint256 totalPool, uint256 playerCount, address winner, uint256 winningNumber, uint256 createdAt, uint256 completedAt))",
    "function getGamePlayers(uint256 gameId) external view returns (tuple(address playerAddress, uint256 spinResult, bool hasSpun)[])",
    "function getPlayerInfo(address player) external view returns (bool hasJoined, bool hasSpun, uint256 spinResult)",
    "event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 playerCount)",
    "event PlayerSpun(uint256 indexed gameId, address indexed player, uint256 spinResult)",
    "event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 winningNumber, uint256 prize)"
];

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
    }
    
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        
        const address = await signer.getAddress();
        document.getElementById('connectBtn').textContent = 
            address.slice(0, 6) + '...' + address.slice(-4);
        
        loadGameInfo();
    } catch (error) {
        console.error('Connection error:', error);
    }
}
