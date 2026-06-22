import type { Address } from "viem";

/**
 * Base Sepolia deployment — update this file to rotate contract addresses
 * instead of touching .env.
 */
export const deployment = {
  chainId: 84532,
  cpfImplementation: "0x78afE9482B39d081AD27BD6687F66fA898b19087",
  deployedAt: 1782144668,
  feeRouter: "0xfb9169b806A0f6AAAb59028CEEF14FB9D229Bb81",
  mockConditionalTokens: "0xA8311241Db53d18b4B58963aaF44B9277bb2dB3B",
  mockMerklDistributor: "0x649606c4a94d108C1a50e32da4F585c612b024A5",
  mockMorphoVault: "0xd7A95F49773527CBdFB009f2E99A5a76D6dcbB98",
  mockRewardToken: "0xc96E9946EaA9d9DF560f74B4af3f0BaC5F0d4b3a",
  mockSwapRouter: "0xAbbD5dEffaa6e932210C30e9375078f5285D0AF2",
  mockUSDC: "0xf3020e0F53e15Ee52C0304DD617b2d3091a31fbD",
  mockVRFCoordinatorV2: "0x901b34AF4bA6e1d071bF60033AaBa2F030a7BC0A",
  network: "base-sepolia",
  owner: "0x9f2b4D0552a662c1Cc38C8200C3dF779A76124b1",
  praxisRegistry: "0x78F9147666117870B92742e8fc1269dA6B515b33",
  protocolTreasury: "0x9f2b4D0552a662c1Cc38C8200C3dF779A76124b1",
  resolver: "0x9f2b4D0552a662c1Cc38C8200C3dF779A76124b1",
  rydImplementation: "0xDAC449AA3580386eb67d879a3172ab08FD988fE3",
  rydRegistry: "0x2667A13aa21D84dDF375C210832620195A0B595A",
  rydRegistryImplementation: "0xdD4948b0f15D743f0C18E3611CB6c09A1528fE60",
  twoPoolRegistry: "0xe1B5FC91A0794b393102bd1ee7E987B1D7cf171b",
  twoPoolRegistryImplementation: "0xCd6DB4fe1a8e9b0251645B17d3970119aFEc8A6D",
  vaultImplementation: "0x26F372D1d0f12bFbA3237A4d45Ac6bb77B8EC487",
} as const;
