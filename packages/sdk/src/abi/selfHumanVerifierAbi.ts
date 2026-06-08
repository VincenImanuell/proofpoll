// Auto-generated from Foundry build artifacts (contracts/out). Do not edit by hand.
// Regenerate: pnpm --filter @proofpoll/sdk gen:abi

export const selfHumanVerifierAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "hub_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "scopeSeed",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getConfigId",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hub",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isHuman",
    "inputs": [
      {
        "name": "subject",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "verified",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nullifierOf",
    "inputs": [
      {
        "name": "subject",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onVerificationSuccess",
    "inputs": [
      {
        "name": "output",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "userData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "scope",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verify",
    "inputs": [
      {
        "name": "subject",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "HumanVerified",
    "inputs": [
      {
        "name": "subject",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "nullifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "NotVerified",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyHub",
    "inputs": []
  }
] as const;
