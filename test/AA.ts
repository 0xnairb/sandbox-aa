import { ethers } from "hardhat";
import { hardhat } from "viem/chains"
import { Address, createClient, createPublicClient, createWalletClient, custom, encodeFunctionData, http, parseEther } from "viem";
import { bundlerActions, getAccountNonce, getSenderAddress, signUserOperationHashWithECDSA } from "permissionless"
  
  describe("AA", function () {

    const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
    const SMART_ACCOUNT_FACTORY = "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985";
    const ETH_RPC = "http://127.0.0.1:8545"
    const BUNDLER_RPC = "http://127.0.0.1:3000/rpc"

    const mUSDC = "0x"
    const caas = "0x"
    const lending = "0x"
    
    describe("Send UserOp", function () {
      it("Should send", async function () {
        const publicClient = createPublicClient({
            chain: hardhat,
            transport: http(ETH_RPC),
          })
          
          // Create the required clients.
          const bundlerClient = createClient({
            chain: hardhat,
            transport: http(BUNDLER_RPC)
          }).extend(bundlerActions(ENTRY_POINT));
      
          // EOA address
          const [account] = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as [Address]
          console.log('address', account)
      
          const client = createWalletClient({
            account, 
            chain: hardhat,
            transport: custom(window.ethereum)
          })
      
          const estFee = await publicClient.estimateFeesPerGas();
      
          // calculate body
          const initCode = encodeFunctionData({
            abi: [
              {
                inputs: [
                  { name: "owner", type: "address" },
                  { name: "salt", type: "uint256" },
                ],
                name: "createAccount",
                outputs: [{ name: "ret", type: "address" }],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            args: [account, 0n],
          })
          
          console.log("Generated factoryData:", initCode)
      
          const sender = await getSenderAddress(publicClient, {
            factory: SMART_ACCOUNT_FACTORY,
            factoryData: initCode,
            entryPoint: ENTRY_POINT,
          })
      
          const nonce = await getAccountNonce(publicClient, {
            sender,
            entryPoint: ENTRY_POINT,
            key: 0n // optional
          })
      
          console.log('sender address', sender)
          console.log('init code', initCode)
          console.log('nonce', nonce)
      
          // function execute(address dest, uint256 value, bytes calldata func) external
          // function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external    
      
          // approve 1 mUSDC
          const approveCaasFeeCallData = encodeFunctionData({
            abi: [
              {
                inputs: [
                  {
                    name: "spender",
                    type: "address"
                  },
                  {
                    name: "value",
                    type: "uint256"
                  }
                ],
                name: "approve",
                outputs: [
                  {
                    "name": "",
                    "type": "bool"
                  }
                ],
                stateMutability: "nonpayable",
                type: "function"
              }
            ],
            args: [caas, parseEther("1")]
          })
      
          // call execService with 1 mUSDC
          const execServiceCallData = encodeFunctionData({
            abi: [
              {
                inputs: [
                  {
                    name: "_service",
                    type: "string"
                  }
                ],
                name: "executeService",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
              }
            ],
            args: ["KYC"]
          })
      
          // approve 10 mUSDC
          const approveDepositCallData = encodeFunctionData({
            abi: [
              {
                inputs: [
                  {
                    name: "spender",
                    type: "address"
                  },
                  {
                    name: "value",
                    type: "uint256"
                  }
                ],
                name: "approve",
                outputs: [
                  {
                    "name": "",
                    "type": "bool"
                  }
                ],
                stateMutability: "nonpayable",
                type: "function"
              }
            ],
            args: [lending, parseEther("10")]
          })
      
          // deposit 10 mUSDC to lending
          const depositCallData = encodeFunctionData({
            abi: [
              {
                inputs: [
                  {
                    name: "_amount",
                    type: "uint256"
                  }
                ],
                name: "deposit",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
              }
            ],
            args: [parseEther("10")]
          })
          
          const callData = encodeFunctionData({
            abi: [
              {
                inputs: [
                  { name: "dest", type: "address[]" },
                  { name: "value", type: "uint256[]" },
                  { name: "func", type: "bytes[]" },
                ],
                name: "executeBatch",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            args: [
              [mUSDC, caas, mUSDC, lending], 
              [0n, 0n, 0n, 0n], 
              [approveCaasFeeCallData, execServiceCallData, approveDepositCallData, depositCallData]
            ],
          })
          
          console.log("Generated callData:", callData)
      
          let userOperation = {
            sender,
            nonce,
            // factory: SMART_ACCOUNT_FACTORY,
            // factoryData: initCode,
            // initCode,
            callData,
            callGasLimit: 50305n,
            maxFeePerGas: estFee.maxFeePerGas || 50305n,
            maxPriorityFeePerGas: estFee.maxPriorityFeePerGas || 113000100n,
            signature: "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
          }
      
          const gasEstimate = await bundlerClient.estimateUserOperationGas({
            userOperation,
            entryPoint: ENTRY_POINT
          });
      
          console.log('est fee', estFee)
          console.log('est gas', gasEstimate)
      
          userOperation.callGasLimit = gasEstimate.callGasLimit;
          userOperation.preVerificationGas = gasEstimate.preVerificationGas + 3000n;
          userOperation.verificationGasLimit = gasEstimate.verificationGasLimit + 3000n;
      
          console.log('userop:', userOperation)
      
          // sign
          const signature = await signUserOperationHashWithECDSA({
            client,
            userOperation,
            chainId: hardhat.id,
            entryPoint: ENTRY_POINT,
          })
          userOperation.signature = signature
          
          // send userop
          const userOperationHash = await bundlerClient.sendUserOperation({
            userOperation,
          })
                 
          console.log("Received User Operation hash:", userOperationHash)
           
          // let's also wait for the userOperation to be included, by continually querying for the receipts
          console.log("Querying for receipts...")
          const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: userOperationHash,
          })
          const txHash = receipt.receipt.transactionHash
           
          console.log(`UserOperation hash: ${txHash}`)
      });
    });
  });
  