const {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} = require("@solana/web3.js");
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
  AccountLayout,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
// import rawKeypair from './id.json' assert { type: 'json' };
// const rawKeypair = require('./id.json')
const rawKeypair = require("./id.json");

const DECIMAL_POINT = 4;

let connection = new Connection(
  clusterApiUrl(process.env.SOLANA_NETWORK || "devnet"),
  "confirmed"
);
const getConnection = () => connection;

const requestAirdrop = async (wallet, quantity = 1) => {
  const connection = getConnection();
  // check how many SOL can be airdropped at once
  const fromAirdropSignature = await connection.requestAirdrop(
    wallet.publicKey,
    quantity * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(fromAirdropSignature);
};

const getLocalWallet = () => {
  const secretKey = Uint8Array.from(rawKeypair);
  const fromWallet = Keypair.fromSecretKey(secretKey);
  return fromWallet;
};

const createNewWallet = () => Keypair.generate();

const createNewMint = async (fromWallet) => {
  const connection = getConnection();
  const mint = await createMint(
    connection,
    fromWallet,
    fromWallet.publicKey,
    null,
    DECIMAL_POINT
  );
  console.log(`New mint public address: ${mint.toString()}`);

  // Get the token account of the fromWallet address, and if it does not exist, create it
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );

  const tokenAccountInfo = await getAccount(
    connection,
    fromTokenAccount.address
  );

  console.log(
    `Token account address: ${tokenAccountInfo.address}, amount: ${tokenAccountInfo.amount}`
  );
  return mint;
};

const mintToWallet = async (wallet, mint, amount) => {
  const connection = getConnection();
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );
  const tokenAmount = amount * Math.pow(10, DECIMAL_POINT);
  const signature = await mintTo(
    connection,
    wallet,
    mint,
    tokenAccount.address,
    wallet.publicKey,
    tokenAmount
  );
  console.log(
    `Mint transaction complete for amount: ${tokenAmount} and signature: ${signature}`
  );
  return signature;
};

const transferToken = async (fromWallet, toWallet, mint, amount) => {
  // We fund the creation of token account if not present in toWallet
  const connection = getConnection();
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWallet.publicKey
  );
  const tokenAmount = amount * Math.pow(10, DECIMAL_POINT);
  const signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    tokenAmount
  );
  console.log(
    `Transfer complete for amount: ${tokenAmount} and signature: ${signature}`
  );
  return signature;
};

const printTokenAccountDetails = async (publicKey) => {
  // publicKey type is PublicKey
  const connection = getConnection();
  const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });
  console.log("Token                                         Balance");
  console.log("------------------------------------------------------------");
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    console.log(`${new PublicKey(accountData.mint)}   ${accountData.amount}`);
  });
};

const getTokenAmountDetails = async (wallet, mint) => {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );
  const tokenAccountInfo = await getAccount(connection, tokenAccount.address);
  return tokenAccountInfo.amount;
};

module.exports = {
  transferToken,
  mintToWallet,
  createNewMint,
  requestAirdrop,
  createNewWallet,
  getLocalWallet,
  printTokenAccountDetails,
  getTokenAmountDetails,
};

