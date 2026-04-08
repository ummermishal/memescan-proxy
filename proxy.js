// proxy.js — MEMESCAN proxy using DexScreener (no API key needed)
// Deploy free: railway.app → New Project → Deploy from GitHub repo

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── New Pump.fun pairs on Solana (sorted by creation time)
app.get("/api/new-tokens", async (req, res) => {
  try {
    const r = await fetch(
      "https://api.dexscreener.com/token-profiles/latest/v1",
      { headers: { "Accept": "application/json" } }
    );
    const data = await r.json();
    // Filter Solana only
    const solana = (Array.isArray(data) ? data : [])
      .filter(t => t.chainId === "solana")
      .slice(0, 20);
    res.json({ tokens: solana });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── New pairs specifically from Pump.fun
app.get("/api/pumpfun-tokens", async (req, res) => {
  try {
    const r = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=pump.fun&chainIds=solana",
      { headers: { "Accept": "application/json" } }
    );
    const data = await r.json();
    const pairs = (data?.pairs || [])
      .filter(p => p.chainId === "solana")
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
      .slice(0, 20);
    res.json({ pairs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get token detail by contract address
app.get("/api/token/:address", async (req, res) => {
  try {
    const r = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${req.params.address}`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await r.json();
    // Return best pair (highest liquidity)
    const pairs = data?.pairs || [];
    const best = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    res.json({ pair: best, allPairs: pairs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Search tokens by name/symbol
app.get("/api/search/:query", async (req, res) => {
  try {
    const r = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(req.params.query)}`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await r.json();
    const solana = (data?.pairs || []).filter(p => p.chainId === "solana").slice(0, 10);
    res.json({ pairs: solana });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dip buy coins from CoinGecko (no key needed)
app.get("/api/dip-coins", async (req, res) => {
  try {
    const ids = "peanut-the-squirrel,fartcoin,dogwifcoin,goatseus-maximus,moo-deng";
    const r = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h,7d,30d`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health check
app.get("/health", (_, res) =>
  res.json({ ok: true, time: new Date().toISOString(), note: "No API key needed - using DexScreener" })
);

app.listen(PORT, () =>
  console.log(`MEMESCAN proxy running on port ${PORT} — no API key needed!`)
);
