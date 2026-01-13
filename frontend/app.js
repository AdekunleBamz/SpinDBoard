
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
