import type { Address } from "viem";

/**
 * Base Sepolia deployment — update this file to rotate contract addresses
 * instead of touching .env.
 */
export const deployment = {
  chainId: 84532,
  network: "base-sepolia",
  deployedAt: 1781778358,
  cpfImplementation: "0x9c780Eb8Ef6E3F990619d79CC2163F35Ed2E443F" as Address,
  feeRouter: "0x34811a1C1DD2f9A977de74C8F07B509AA99D132A" as Address,
  mockConditionalTokens: "0x91233E8358Bd36D9F1D96Aa1a1138B8165DCB81c" as Address,
  mockMerklDistributor: "0xBD89211845017872a90936c21B3ffFAeD10E32D9" as Address,
  mockMorphoVault: "0xC3e2B5feAe4EA4Ac78F623B724D1CfB7fE039B75" as Address,
  mockRewardToken: "0xD1492837B36f42DF03704bA825aAfB909c4159fe" as Address,
  mockSwapRouter: "0x0fcFe619359DA9fa8F6842A93c45afe005DaA451" as Address,
  mockUSDC: "0xA5FDa3E3f96006C5752Eba26Af3CFBaD90Feb7c8" as Address,
  mockVRFCoordinatorV2: "0xC5f5565642482DAD37A9C008B4E9a11c0419849d" as Address,
  owner: "0x9f2b4D0552a662c1Cc38C8200C3dF779A76124b1" as Address,
  praxisRegistry: "0x050378e7CE5BC6a3EbE316Cf4c44B2bB856559D9" as Address,
  protocolTreasury: "0x9f2b4D0552a662c1Cc38C8200C3dF779A76124b1" as Address,
  resolver: "0x9f2b4D0552a662c1Cc38C8200C3dF779A76124b1" as Address,
  rydImplementation: "0x0242aD115413E3E6A8226eB1843A99a66b64eD58" as Address,
  rydRegistry: "0x6D1CaE4675E36271d3E5191e3178446AAE8D8873" as Address,
  rydRegistryImplementation: "0xDFB015c0504BE03Ec6cffcC314F8926980354a2f" as Address,
  twoPoolRegistry: "0x92106AdAf8640a4d8dc911269A0Db5A81615a491" as Address,
  vaultImplementation: "0x623D7bA9Aa3aF29E470a8e701bF8f864FAC16ADa" as Address,
} as const;
