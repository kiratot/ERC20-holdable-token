const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;

const HERC20 = artifacts.require("HERC20");

//helper function
const toWei = (n) => {
  return web3.utils.toWei(n, "ether");
};

contract("HERC20", (accounts) => {
  const name = "Holdable Token";
  const symbol = "htkn";
  const decimals = 18;
  const [owner, sender, recipient, spender] = accounts;
  const totalSupply = toWei("1000");
  const holdId = "holdId";

  let htkn;

  beforeEach(async () => {
    htkn = await HERC20.new(name, symbol, owner, totalSupply);
  });

  describe("HERC20: constructor", () => {
    it("should deploy the smart contract properly", async () => {
      const address = await htkn.address;
      assert.notEqual(address, "");
    });
    it("has a name", async () => {
      assert.equal(await htkn.name(), name);
    });
    it("has a symbol", async () => {
      assert.equal(await htkn.symbol(), symbol);
    });
    it("has decimals", async () => {
      assert.equal(await htkn.decimals(), decimals);
    });
    it("has a totalSupply", async () => {
      assert.equal(await htkn.totalSupply(), totalSupply);
    });
  });

  describe("HERC20: Hold behaviour", () => {
    it("holds the funds properly", async () => {
      const hold = await htkn.hold(holdId, recipient, 1000, { from: owner });
      const heldBalance = await htkn.heldBalanceOf(owner);
      assert.equal(heldBalance.toString(), "1000");
    });

    it("holds without transferring the funds", async () => {
      const hold = await htkn.hold(holdId, recipient, 1000);
      assert.equal(await htkn.balanceOf(recipient), 0);
    });

    it("should make the funds on hold unavailable for transfers", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      //sender holds the fund
      await htkn.hold(holdId, recipient, "1000", { from: sender });

      //Try to use the on hold funds for transfer
      await expectRevert(
        htkn.transfer(recipient, "1000", { from: sender }),
        "the (part of the) amount that's being held is not available for transfers"
      );
    });
    it("reverts when trying to use an already existing holdId", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      await htkn.hold(holdId, recipient, "1000", { from: sender });

      // try to hold the fund with an already used id;
      await expectRevert(
        htkn.hold(holdId, recipient, "1000", { from: sender }),
        "This holdId already exists"
      );
    });
    it("reverts when not enough available balance", async () => {
      await expectRevert(
        htkn.hold(holdId, recipient, "1000", { from: sender }),
        "not enough available balance"
      );
    });
    it("reverts if holdId is empty", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      //sender holds the fund
      await htkn.hold(holdId, recipient, "1000", { from: sender });

      await expectRevert(
        htkn.hold("", recipient, "1000", { from: sender }),
        "holdId should not be empty"
      );
    });
    it("reverts if the hold is not executed by the hold creator", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      //sender holds the fund
      await htkn.hold(holdId, recipient, "1000", { from: sender });

      await expectRevert(
        htkn.executeHold(holdId, { from: recipient }),
        "the hold must be executed by the hold creator"
      );
    });
    it("prevents unauthorized parties from cancelling the hold", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      //sender holds the fund
      await htkn.hold(holdId, recipient, "1000", { from: sender });

      await expectRevert(
        htkn.removeHold(holdId, { from: sender }),
        "Only owner can revert holds"
      );
    });

    it("allows owner of the contract to remove the hold", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      //sender holds the fund
      await htkn.hold(holdId, recipient, "1000", { from: sender });

      await htkn.removeHold(holdId, { from: owner });

      const heldBalance = await htkn.heldBalanceOf(sender);
      assert.equal(heldBalance, 0);
    });

    it("allows the funds to be available for transfer again when the hold is removed", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      //sender holds the fund
      await htkn.hold(holdId, recipient, "1000", { from: sender });

      await htkn.removeHold(holdId, { from: owner });

      await htkn.transfer(recipient, "1000", { from: sender });

      const recipientBalance = await htkn.balanceOf(recipient);
      const senderBalance = await htkn.balanceOf(sender);

      assert.equal(recipientBalance, 1000);
      assert.equal(senderBalance, 0);
    });
  });

  describe("HERC20: Hold From Behaviour", () => {
    it("reverts hold if spender has not been allowed with enough balance", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "700", { from: owner });

      await expectRevert(
        htkn.holdFrom(holdId, sender, recipient, "700", { from: spender }),
        "HERC20: Hold amount exceeds allowance"
      );
    });

    it("allows spender to hold funds on behalf of the sender if allowed", async () => {
      //give some funds to the sender
      await htkn.transfer(sender, "1000", { from: owner });

      await htkn.approve(spender, "90", { from: sender });
      //sender holds the fund
      await htkn.holdFrom(holdId, sender, recipient, "90", { from: spender });

      const heldBalance = await htkn.heldBalanceOf(sender);

      assert.equal(heldBalance, 90);
    });
  });
});
