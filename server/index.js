const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");
const { recoverPublicKey } = require("ethereum-cryptography/secp256k1");
const express = require("express");

const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "04f639820049b543b9f7ea8e72216080da8da37413de0f017c09bf70de33dc7367dae96986a0ec8d59e37fa06b6d8b330a8dbac0ac518d90bd5cdf36d5f0be9402": 100,
  "040c5d2406abb5144e9cfe4de894f9108392f613aeace5a5db0db2ffa30d1709215174fd8f2e7bb1e93267523b8d35ca30cebc8b7c2c946e801ad435b9f962845f": 50,
  "04e87a72db83fbe89856e7d4ffbfd570cd2ff9e8e34b0b5217ef7d1b2374bf88b46d2fc02b3549cccdd186f2dc98fbd7f43d18958efc1eabea64e2ff434d4262b4": 75,
};

const hashMessage = (msg) => keccak256(utf8ToBytes(msg));

function recoverKey(message, signature, recoveryBit) {
  return recoverPublicKey(
    hashMessage(message),
    new Uint8Array(Object.values(signature)),
    recoveryBit
  );
}

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature } = req.body;

  const [sign, recoveryBit] = signature;

  const recoveredPublicKey = recoverKey(amount, sign, recoveryBit);

  if (sender !== toHex(recoveredPublicKey)) {
    res.status(403).send({ message: "The signature is not correct" });
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const amountInt = parseInt(amount);
  if (balances[sender] < amountInt) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amountInt;
    balances[recipient] += amountInt;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
