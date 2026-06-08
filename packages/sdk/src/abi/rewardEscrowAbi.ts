// Auto-generated from Foundry build artifacts (contracts/out). Do not edit by hand.
// Regenerate: pnpm --filter @proofpoll/sdk gen:abi

export const rewardEscrowAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "payToken_",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "verifier_",
        "type": "address",
        "internalType": "contract IHumanVerifier"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "closeSurvey",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createSurvey",
    "inputs": [
      {
        "name": "rewardPerResponse",
        "type": "uint96",
        "internalType": "uint96"
      },
      {
        "name": "maxResponses",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "schemaHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getSurvey",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct RewardEscrow.Survey",
        "components": [
          {
            "name": "organizer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "rewardPerResponse",
            "type": "uint96",
            "internalType": "uint96"
          },
          {
            "name": "balance",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "maxResponses",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "responseCount",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "schemaHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "open",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasResponded",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextSurveyId",
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
    "name": "payToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "remainingSlots",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "internalType": "uint256"
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
    "type": "function",
    "name": "submitResponse",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "responseHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "proof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifier",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IHumanVerifier"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ResponseSubmitted",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "respondent",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "nullifier",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "responseHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "reward",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SurveyClosed",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "refunded",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SurveyCreated",
    "inputs": [
      {
        "name": "surveyId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "organizer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "rewardPerResponse",
        "type": "uint96",
        "indexed": false,
        "internalType": "uint96"
      },
      {
        "name": "maxResponses",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "funded",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "schemaHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyResponded",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidParams",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotOrganizer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PoolTooLarge",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "SurveyFull",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SurveyNotOpen",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
] as const;
