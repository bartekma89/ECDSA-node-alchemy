import { useState } from "react";
import * as secp256k1 from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";

import server from "./server";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  const hashMessage = (msg) => keccak256(utf8ToBytes(msg));
  const signMessage = async (message, privateKey) =>
    await secp256k1.sign(hashMessage(message), privateKey, {
      recovered: true,
    });

  async function transfer(evt) {
    evt.preventDefault();

    try {
      const signature = await signMessage(sendAmount, privateKey);

      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        amount: sendAmount,
        recipient,
        signature,
      });
      setBalance(balance);
    } catch (ex) {
      console.error(ex);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        />
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        />
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
