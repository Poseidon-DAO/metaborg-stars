import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const IPFS_CONNECTION_LIST = ["/ipfs/QmXVvoJz5GSrhzPWdDKVLbEBzfdvE8HHKAM681yRyNqRwS?filename=1.jpg",
"/ipfs/QmQGr1rgHYMRY8mxTsDtCJRfwWCzFU2AdFAvg3HTszcEBt?filename=10.jpg",
"/ipfs/QmXGHpL27rqSrNagcttJtC6RutHobP7ptSD7AJDv2wZB56?filename=100.jpg",
"/ipfs/QmV7ZXC3e1KmiAgQbYhHwSckKRPRdPtCD72ajMCd3VVGJ5?filename=101.jpg",
"/ipfs/Qma9dzManyPg4tsA5Xuj9ZCvQurtLRF3HZnEDrWAXyJeDb?filename=102.jpg",
"/ipfs/QmVTgdGzV77oZvJP8zVkLxuB27NZnBoWynCJ7XwapQZ23c?filename=103.jpg",
"/ipfs/Qmch3d4WThNSstjzSS3nsoDPvHLMoeDEDzDQc8tJjNtbXe?filename=104.jpg",
"/ipfs/QmVAPobbow72C93GFLEE26sJFYSq3XpzzmREJvzTjoY4dc?filename=105.jpg",
"/ipfs/QmTGcmWCpDcayjqH8FJKHpChJinGf4g3igZ5v1drFMCTG6?filename=106.jpg",
"/ipfs/QmdynMfRu1No8TWbjk4tGYW9K9b4WtyZxyXzCYKLstGeVJ?filename=107.jpg",
"/ipfs/QmTszSHxXcjZEBdqJmthbNSCtntghqhWppEmKXHPmpsFcr?filename=108.jpg",
"/ipfs/QmTEuAUAJVxaA96VZJJoCYzwdXNsqB98kapYEV7Qf987Ys?filename=109.jpg",
"/ipfs/QmTMGBPzYbMttYHgqE5fA94cERfmSqZSwfi9zqzUWZKH4B?filename=11.jpg",
"/ipfs/QmNhYTfuQP2MyiFdqRjrsfnGJKmh9adweWRpdo1DHGX5CF?filename=110.jpg",
"/ipfs/QmY2wREcsr1nBPrWq7pTJpj8p1hsaMQoDQ12tsqfFdgz8Q?filename=111.jpg",
"/ipfs/QmTwU8jo7CafgcGb1jidayGULWTWzrptghVYQJtFuuzZaW?filename=112.jpg",
"/ipfs/QmQXfJ597o7ejNEcTAuZ1iKPHD5N3XRqekQDEjxh3HEz36?filename=113.jpg",
"/ipfs/QmNzL5MrUyAomB8g77B8xfTgHtT8fAS3f1d5PFKCPb3wd4?filename=114.jpg",
"/ipfs/QmR3n58z3BdBYXZKPv9geHcmeeX9yFchReHUES2YR33TU8?filename=115.jpg",
"/ipfs/QmRQrzSZFyNRG69FcCUibdGFteweofKaU6SfRcKYYGMKwk?filename=116.jpg",
"/ipfs/QmV6KTZLMdD2JbQZ9X2Qt6X4bwUys6M65MNisH3JDJsyE9?filename=117.jpg",
"/ipfs/QmUu2ygyV7GF3QF1GMqF5LKBG7S8ip9VHBGNiUMTbhXmFZ?filename=118.jpg",
"/ipfs/QmWgpnRBrGUX3yXGU9kQUfCEZPviP21hkdMHD33ezfRgiV?filename=119.jpg",
"/ipfs/Qmbk9oqyVDb2mX3verCSLsiaWYPTvcQ3zCpR1NZZYgixKH?filename=12.jpg",
"/ipfs/QmedZZLRR8ZbvbQnWbYiufW5RUkEYmcCngefLU5xXWSqwB?filename=120.jpg",
"/ipfs/QmeS1VAphfFZJewmLBALNzH6YW9ZSwS562Q5domm3PxA8b?filename=121.jpg",
"/ipfs/QmXMY113yzET5QekctubyP7APeijqx84hcKsv7SKQTih4X?filename=122.jpg",
"/ipfs/QmWrG2WR6JuSYxjNbEzp6A4nPBLUCSnRmKpXBoTmJws6fZ?filename=123.jpg",
"/ipfs/QmfV9bd1ius8eCzF4bJ9VKSsvbGHPy6tZiLKi9pVh8fY9h?filename=124.jpg",
"/ipfs/QmNeQWNo9zm4hhXrXGmgdzzbZAUY4m7ofboK4pHZtm6X1Z?filename=125.jpg",
"/ipfs/QmWEzp1bS5ga9aqpVBopURr9wjrarDU9je4D5mgd7cPGSx?filename=126.jpg",
"/ipfs/QmTuBSX5yBCoThrcHzfAYVn5oU1YVEoWthu2c587jANbgd?filename=127.jpg",
"/ipfs/Qmced3gxjZbjXbdA2A3y6Utxr8KCyxKBRchADz4oCxZ6zp?filename=128.jpg",
"/ipfs/QmcPp3QWD3UiQZ7oqmwby7ym968csxPgU9NM58LCQsjyrP?filename=129.jpg",
"/ipfs/QmSxHPb7VsE88sSsQ2wLtCuaWvdfvXL7uotnCCjtzbsPqY?filename=13.jpg",
"/ipfs/QmSATWjwWRUWe7GrpFy2HzQHPD3S3PsafwoMY2MqHi2KWg?filename=130.jpg",
"/ipfs/QmQzMnXRKHf8YjyCNhoWLLPNppfy5Aq9yGMBXk6jB3z6rx?filename=131.jpg",
"/ipfs/QmSsU6sTkreV6QPwpHTxAFWuufWC6XT97mB2wrGCUJiQzG?filename=132.jpg",
"/ipfs/QmcUNvKpWPGstAvGr3iT3JfntMSKSMCu1U9Qf7qLS1KHyB?filename=133.jpg",
"/ipfs/QmYwRBGAPqF72BqQWQqKjWdmsytpYqAc63UmxQK5gtJZHf?filename=134.jpg",
"/ipfs/QmNsxwUy45iChLinsU9VWW6Ehup6BGqwMMbyBKo1pMHanB?filename=135.jpg",
"/ipfs/QmYNdxrxxmm7g429zoPC2Ga9cyEMRHNiop7Y2s32EBWmyC?filename=136.jpg",
"/ipfs/QmZ3JKe3JvUK4H1d8tGdidrevNXpcrW4ajPVP5Qo4BBPG6?filename=137.jpg",
"/ipfs/QmeXtkmkT4zfrCxQxJtgftF5rfER6qvFxeZra6FNdD9L9c?filename=138.jpg",
"/ipfs/QmaKFJk51rxuSnY5VxPuNHiKr4JDfuHhWbraAGnV9D41Gh?filename=139.jpg",
"/ipfs/Qmb545mZgzJe91eyfsTHfMD7DvrDsM7zt4MUUaccVHsZmC?filename=14.jpg",
"/ipfs/QmbZZC8ecY9JeBHWCxsiiAHH19bELTCYh6Z5Jhznj6cFkS?filename=140.jpg",
"/ipfs/QmbCY9p8tmCiW5FrXSTQixMyAzpWfeg1wYJRuETvZSg75D?filename=141.jpg",
"/ipfs/Qmf7cu9apXaBQqbS2SxCeNie6MzxWrzoifSafxR9JHWxBg?filename=142.jpg",
"/ipfs/QmdnVoz5YEDrNQw4bKUwpdWFKZ4zX2q5jU2Ed5WFGMDoSh?filename=143.jpg",
"/ipfs/QmRQz1iP6qdv1zVDaS78WBpnehzUi7E4Pfpr18nySMfJyG?filename=144.jpg",
"/ipfs/QmSViWg9rs9aDredJ4yA54d7tMjKnzfcRNbYiUpFF2cUoU?filename=15.jpg",
"/ipfs/QmPcTLqNmTN4vTAFgMpwHMTCZTJo9mhzNzNRVkwwq45RPo?filename=16.jpg",
"/ipfs/QmVna1ShmRartwPsNjiYvvgmGcPmciuepP8N9xyH2vG31S?filename=17.jpg",
"/ipfs/Qmce4T2ZcdskgDyX458wAKxxCy4YL21ERtk9zkktZFrWbZ?filename=18.jpg",
"/ipfs/QmNoid3TWQjcd4DsmHy8BGgkcjzwTZpEkxEdtJMNC38JaU?filename=19.jpg",
"/ipfs/QmdnVoz5YEDrNQw4bKUwpdWFKZ4zX2q5jU2Ed5WFGMDoSh?filename=2.jpg",
"/ipfs/QmUtqZH4D6pg1ZvZb3a9jQhLDDV7kU6qpoTMH235KaKq4x?filename=20.jpg",
"/ipfs/QmcV5q6iHVgGGMiXLFqDz6dcpAsn2YTTCMG5a2do6mmEBk?filename=21.jpg",
"/ipfs/QmNYypiFfmdTicnNZEf5psXcovqC5MGEyZzRJCM1253Xod?filename=22.jpg",
"/ipfs/QmdBfyxVvcCEkpHFG4nZrCLhst1iN1Cz6kSUW8qfcWtW6x?filename=23.jpg",
"/ipfs/Qmb6vkfKsGnGvRG4g4a7kPn99ggQzEnqdMzTvKcDoVNjQy?filename=24.jpg",
"/ipfs/QmNk8n78nC4t5hPn3Kd1Ym7umtEGXsH5YECN47qwseXisC?filename=25.jpg",
"/ipfs/QmY13YiytW7FU26AKi3cUypNF9oPEJzNS9DzpRysDcvfDB?filename=26.jpg",
"/ipfs/QmR4Vm1rpjbuK2it3aNGfCGBm1Vt1eEh3Ehxb8Wdaxkbi3?filename=27.jpg",
"/ipfs/QmUETRFTWmX6hZXhqWbAvScNLqMVDKwSXBRVWCTqUGwjb3?filename=28.jpg",
"/ipfs/QmaQe8AggdTb9bMCZQhavv3dzUvao3t3JX4sN1x2Abu26h?filename=29.jpg",
"/ipfs/Qmb4BtBmioXhHjkkueEx5fqxLJCgx7wHcWP8k33PJqCA2x?filename=3.jpg",
"/ipfs/Qmex6oV4bWCNhQTkkGuDttAp5FN8ZxtEVgCPjYhgj1QrhC?filename=30.jpg",
"/ipfs/QmccE9qSJWfvAm2kDmW3sPkrvDW6wwHgZCDXto725ZnV2j?filename=31.jpg",
"/ipfs/QmUSH7JdFh4quLLqkUnXJgUsE8sJDu59zQZJQBt4JpHAgy?filename=32.jpg",
"/ipfs/QmXoQicsL9BHbRsMNh1CU8czvB3hC7gcbkb7G8ad6mkFdy?filename=33.jpg",
"/ipfs/QmbzwxHEBA7EGbyuVcnH8NzMzucjqVu3ojRk1pvt7ms3zD?filename=34.jpg",
"/ipfs/QmbpdA9cgaaGAUkbbdQd84AAaRvNXBp2kmBYdNRJegZYQZ?filename=35.jpg",
"/ipfs/QmWqnMGGeTgEmRYugw8Xse6gZvNXHYBFnKLGWUHRKdz9ep?filename=36.jpg",
"/ipfs/QmcTbzzWtQhpPcJX23fDKWvQhvH6a3fVjfmJEQSMXAQTU2?filename=37.jpg",
"/ipfs/QmU1cEr9v3X2rsghxgMHgFo1K295YiichXAzgwciXokpbV?filename=38.jpg",
"/ipfs/QmYkFKAMsNiXttXZ6faR6SEeXdTZSooiqDyMkYvDhVe4Yr?filename=39.jpg",
"/ipfs/QmbLWKg7qNkUtRuWFbKmJmpoFEFzGWkpCDyk6vAsJLLrp5?filename=4.jpg",
"/ipfs/QmXSR72TtbVQmFtEctUoW16Va7hisqPDEgfSsBqkd4Dcw6?filename=40.jpg",
"/ipfs/QmUr24g2c54hFK1yjmVwa1fnfMFeLQjS4TiwS62LLYF5Fy?filename=41.jpg",
"/ipfs/QmSyp2RWbjWH6eAfzfEJfSNQeC9BTrJpqMXx23jZkTfVQ7?filename=42.jpg",
"/ipfs/QmQ3Rz6QQBm4oWBRiT53NykvcUedcdRnj2cCpg27YgwMFg?filename=43.jpg",
"/ipfs/QmeULLRRrAR9BBw4QwbittXRavFgSyb2MdcU6WNeRmoza1?filename=44.jpg",
"/ipfs/QmS3Qas2zwsyQeLbmYzSQjiwfhKpbv5Q6TewBpWi6d9aDJ?filename=45.jpg",
"/ipfs/Qme4qFRp1Zf2vgTfgNf7Kuq1zxkxGJfGQJDwe7WHniLfDy?filename=46.jpg",
"/ipfs/Qma4n74QPSqKMQDQ4AMMuyCmrUMmQipXDkE4HeyVxohjNz?filename=47.jpg",
"/ipfs/QmSv3jZSGzc65W2Pbu9EUuNrUAVsbVjt4e45Wx3enikgiA?filename=48.jpg",
"/ipfs/QmURD8cMsFA2D5MHuYt1HoWm5SdnrDxKHE2LWgf6iiaSsr?filename=49.jpg",
"/ipfs/QmSxyhtqY3tdHsv4ZUB8ZffKCqNWDPwWwj2MoJJTigukc1?filename=5.jpg",
"/ipfs/QmUL579YiQ9KxtdMMiAuvJs38gtnfkJrfJZDfq421Gy8oN?filename=50.jpg",
"/ipfs/QmQCftgs6GAGNT8AjkfBgqy9Y42Sb2VU61vv4U1ffoksFd?filename=51.jpg",
"/ipfs/QmSu4CALYU8juPGfUDijb5D99gbxiaTXhyCqe4sczPwHMd?filename=52.jpg",
"/ipfs/Qme485kzxc47afDd9r7k4Fdz9v5X5JiuUKsoHxWD8dAiHh?filename=53.jpg",
"/ipfs/QmaE65Rw3udEhPZwMc4pfiH5R79YAhcRqDwZf8dtapZn7T?filename=54.jpg",
"/ipfs/QmPAGye2AmaPdfwEhJ1yx416QhtFJhQ8kmKVhRnNuWo5fV?filename=55.jpg",
"/ipfs/QmXyxRq9seL3NyNZ6ryR5B9nBSaEqUhVDDgoD2etHLef4z?filename=56.jpg",
"/ipfs/QmUdP7CzRt23hubhe2ETxw1B3WpfoJiFVukZV9UXJLiVS3?filename=57.jpg",
"/ipfs/QmXaVZqh7FLyB96vmaZK36SbdzNSNWURjeWpafBqwpKqq3?filename=58.jpg",
"/ipfs/QmVRJb1GrVMiGAUQ45ZL2sanrwMtX348q7B3gko6JrLbqZ?filename=59.jpg",
"/ipfs/Qmesf12ZQX63iMxdCQRqcBD5HtA3CRkNQynXxaqCMbyf9L?filename=6.jpg",
"/ipfs/QmQY25qXUnZr6CuUBoctMh4i6H4vCkEowB6w7gerfN98jZ?filename=60.jpg",
"/ipfs/QmbGNx3VmzSPDNmWUwpynVPDS7Pvm8uaPD8yMvkcPe2JTa?filename=61.jpg",
"/ipfs/QmR4DPEbxWJpeFfR1L2puQvRuyxttLMgu1XVrHvtxGBN6x?filename=62.jpg",
"/ipfs/QmfEs1cVdmBF5eoMBs2GUJ9WFi9YKfDk79QWB4ZDKKPCDG?filename=63.jpg",
"/ipfs/QmZ2XymnhVT9r1sx1m1LzQyyNs2APBAGhK7qYuW6ZyFFSz?filename=64.jpg",
"/ipfs/QmYdQUcy2n6gkzRfj4JeU3ABTzJjfxDjLTW9S2En7iicdu?filename=65.jpg",
"/ipfs/QmYEXcq9mqgptymu65BZS3dYuWYDgqvEVwBmS66pnrZLjD?filename=66.jpg",
"/ipfs/QmT6rnt7HW4Zc3oeHa6Gqaie6GuvhnSNdHRfxGNrPbyTML?filename=67.jpg",
"/ipfs/QmNxmk5BwNVKCBxqcszAfPvKnSxAPwGZUYUthbTHNGJX7k?filename=68.jpg",
"/ipfs/QmUb8yo6JSo2fZK6eswWn8AE71fpkbmY9Gt9tQWAtC913t?filename=69.jpg",
"/ipfs/Qmdfodyz9EsRhdNUpGTP8Bc8FEBA2eq6E5mmemzaeeUA2H?filename=7.jpg",
"/ipfs/QmYjio6tbK1jUzc7RZRTu6P17bvvNjoUf5DWRimyVayDvh?filename=70.jpg",
"/ipfs/QmTeM2VNLfrEgRDKsrfWFp5NVwyzNuieBb6PvYCtZNvKWX?filename=71.jpg",
"/ipfs/QmY6HnXhEB28ygjEjozKs4koNUPSsbgwadvjsd9FTF7eXX?filename=72.jpg",
"/ipfs/QmQnbmPwAcsoZwDGKHd39pcwVdYzrxp2UcDm2kNqMEj7ac?filename=73.jpg",
"/ipfs/Qmavb9LEVVNDaiMd8s8nnGaiD3EDao7qyuknvfvZuLYyvb?filename=74.jpg",
"/ipfs/QmTaVPGu94zLtqhmTD4EuPv6id62VQfUrJGkew4n1zymR7?filename=75.jpg",
"/ipfs/QmbdUj7dnsbagbmEG8unjE4hEA6inNWu8zbtUscy4rqy11?filename=76.jpg",
"/ipfs/QmUetNai2tK4LDG7AvmiqPtd7hvm6Fgus9hGrTcK7EfPqu?filename=77.jpg",
"/ipfs/QmXhDLTVvzEX6TFovMHzdCMY24ELwtnutRj9g4DGFyWEmW?filename=78.jpg",
"/ipfs/QmQU5jCGnmdaSs3UmKJDTvbADEq8aoCDPiUPih79tnJzGD?filename=79.jpg",
"/ipfs/QmbKGboEGm3DDj3u7gNWxC5KTRAtchAQuuwRQn42eA6MfW?filename=8.jpg",
"/ipfs/QmQQZzFo16CpaFBNbNBZR5y2bqZQNfqYAvZzwpYW7YVEAX?filename=80.jpg",
"/ipfs/QmeHUi9rsnU6q8zYrGRdBo4Ff6rfDdfqs172y6av2YSX4V?filename=81.jpg",
"/ipfs/Qmd15wELAkYeh8JLX1nqKc3FLH77mrpLP85rLaGHRLB484?filename=82.jpg",
"/ipfs/QmTWTydJdvtVJ8MTsPRHydHwpPatSAEKK76PHcjuE8gNnr?filename=83.jpg",
"/ipfs/QmV5Xh8vF5hpnzRaPbjDTGaAM6fMqc7b5zEXwknixf3pVT?filename=84.jpg",
"/ipfs/QmbKEG7pNT2NhruBDX4wr5iaCjJomBia6e7nfnTtoEAdJq?filename=85.jpg",
"/ipfs/QmQYKaeYeWfhA4y7oBrpAwnmXAB1CZf55K3kGeBHSZDuWz?filename=86.jpg",
"/ipfs/QmR8oj8YWTgL4hQk7rTLQKqu1oAm5DkaMYMNmjVUDHCuve?filename=87.jpg",
"/ipfs/QmVrqpVPz7TMBHauzTTEuD8hCBmB1W2dsFzExJzsrTNY3n?filename=88.jpg",
"/ipfs/QmNTiSt5p5ggJq6ahvs4mqqDCe1isvh5rSx2K8zZdnfdhV?filename=89.jpg",
"/ipfs/QmRnYz9aEAM27PJBDL4yHBBtR23cE21fMtGxURvbMJaYBn?filename=9.jpg",
"/ipfs/QmfCyJehEVFF8QhWhU26ozvjHBxintq1Pj6X5fQm6MURNS?filename=90.jpg",
"/ipfs/QmYCXjphASCMovGhdRrBv5nSzrc7mZhxPYtxuXHyQdRqpA?filename=91.jpg",
"/ipfs/QmdbuceSHzPGWZNCaw1FvYrJgtDv2zUb5N9jyAxVvzeK3d?filename=92.jpg",
"/ipfs/QmTE8MQcwcDytQXQd2X2YHTJiGkkgjBGTCXVj3gE1e7QY4?filename=93.jpg",
"/ipfs/QmYpXALDQpYBaBBLN7fmrBYty1eSydfFbyQrejNrSBmSVg?filename=94.jpg",
"/ipfs/QmVtTYCBr8XGRE8v2sQAue5nscnYiQqALMYaRWiySpY88B?filename=95.jpg",
"/ipfs/QmRde1SjBrGRY7kqXYXxr4W696Jozej13e4AmzYuAhH3Gc?filename=96.jpg",
"/ipfs/QmVpLn7caihwy3QGHd4Chdpt8cvKgEtwckZDdtjucoXaQt?filename=97.jpg",
"/ipfs/QmX4G1MEFrwZHeLqnfGWABH9ctKYByZakJgYxv958wJ2mq?filename=98.jpg",
"/ipfs/Qmehi1SBK6zCDwPhvVY4s14AG7gMn6aw5Epo2sqGbW1CtY?filename=99.jpg"]
const BN_ONE_GWEI = ethers.BigNumber.from("1000000000000000");

describe("Metaborg Stars", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deploySmartContract() {

    // Contracts are deployed using the first signer/account by default
    const [owner, address1, address2, address3] = await ethers.getSigners();

    const MetaborgStars = await ethers.getContractFactory("MetaborgStars");
    const metaborgStars = await MetaborgStars.deploy();
    await metaborgStars.initialize(IPFS_CONNECTION_LIST);

    return { metaborgStars, owner, address1, address2, address3 };
  }

  describe("Deployment and Settings", function () {
    it("Check the owner address", async function () {
      const {metaborgStars, owner} = await loadFixture(deploySmartContract);
      expect(await metaborgStars.owner()).to.equals(owner.address);
    });

    it("Check the pages availables", async function () {
      const {metaborgStars} = await loadFixture(deploySmartContract);
      expect(await metaborgStars.pagesAvailable()).to.equals(IPFS_CONNECTION_LIST.length);
    });

    it("Set properly how many NFT can be mint based on a predefined price", async function () {
      const {metaborgStars} = await loadFixture(deploySmartContract);
      await metaborgStars.setPriceToPackNumber(BN_ONE_GWEI,1);
      expect(await metaborgStars.getPackNumber(BN_ONE_GWEI)).to.equals(ethers.BigNumber.from("1"));
    });

  });

  describe("Customers Buying System", function () {
      it("Single pack", async function () {
        const {metaborgStars, address1} = await loadFixture(deploySmartContract);
        await metaborgStars.setPriceToPackNumber(BN_ONE_GWEI,1);
        const pageDetected = await metaborgStars.connect(address1).buyMetaborgStars({value: BN_ONE_GWEI});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from("1"));
      });

      it("Multiple pack", async function () {
        const pagesOnPack = 5;
        const {metaborgStars, address1} = await loadFixture(deploySmartContract);
        await metaborgStars.setPriceToPackNumber(BN_ONE_GWEI,pagesOnPack);
        const pageDetected = await metaborgStars.connect(address1).buyMetaborgStars({value: BN_ONE_GWEI});
        expect(await metaborgStars.balanceOf(address1.address)).to.equals(ethers.BigNumber.from(pagesOnPack));

      });

      it("Withdraw owner balance", async function () {
        const {metaborgStars, owner, address1, address2} = await loadFixture(deploySmartContract);
        const oldBalance = await ethers.provider.getBalance(address2.address);
        await metaborgStars.setPriceToPackNumber(BN_ONE_GWEI,1);
        await metaborgStars.connect(address1).buyMetaborgStars({value: BN_ONE_GWEI});
        await metaborgStars.withdrawOwnerBalance(address2.address);
        const newBalance = await ethers.provider.getBalance(address2.address);
        expect(newBalance).to.equals(oldBalance.add(BN_ONE_GWEI));
      });
  });
});
