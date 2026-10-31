---
marp: true
title: DNS Shield Home AI — Pitch (EN)
paginate: true
---

<!--
Shark Tank pitch — 3 minutes, 7 slides.
DNS Shield Home AI — The Smart Guardian of the Connected Home.
Bullets on screen; the narrative goes in the presenter notes.
Render: marp docs/pitch-home-ai-en.md --pdf
-->

# 🛡️ DNS Shield Home AI
## The Smart Guardian of the Connected Home

**Connect. Protect. Control.**

<!--
OPENING / THE STORY (30s) — tell it, don't read:
"It's 10pm. Your kids are asleep. The bedroom camera, the smart speaker, the
Smart TV, the game console, the robot vacuum — all on. Everything feels safe. But
who is protecting your DIGITAL home? Everyone has locks, alarms and cameras for
the outside. Almost no one knows what happens INSIDE their own network."
-->

---

# 1 · The problem

Homes got smart — and **vulnerable**.

- **45%** of smart homes in Brazil have ≥1 vulnerable device
- **66%** of home routers are at risk
- The targets: **cameras, TVs, assistants, printers, IoT** — on 24/7

> The danger isn't only the computer. It's everything that stays "always on".

<!--
(25s) Source: Avast (Brazil study, 2M+ networks). Have the source ready — the
Shark will ask. Emphasize: devices nobody updates or watches, on all day.
-->

---

# 2 · The insight

In the **physical** home, you notice when something's wrong.
In the **digital** home, you don't.

Current tools show: `logs`, `IPs`, `ports`, `DNS`, `alerts`.
And nobody understands that.

> The problem isn't a lack of information.
> It's a lack of **interpretation**.

<!--
(25s) The pivot of the pitch. Blocking is a free commodity. What's missing is
TRANSLATING the technical into human. That's our product.
-->

---

# 3 · The solution — AI First

## DNS Shield Home AI
An appliance with **local AI** that watches the network and **translates** it
into human language.

| Competitors show | We say |
|---|---|
| `192.168.0.105` | "A new device joined your network 15 min ago." |
| `Blocked Request` | "We blocked a connection to a suspicious site." |
| `Firmware Outdated` | "A device is outdated and more vulnerable." |

Setup: **plug in → join the "DNS-Shield" Wi-Fi → done.**
No router changes. No technician.

<!--
(40s) SHOW THE DEMO: panel blocking doubleclick.net/ads.google.com live
(http://localhost:8088). "Plug in, join Wi-Fi, protected" — hostapd creates the
network, no modem changes.
-->

---

# 4 · Real privacy (the differentiator)

We don't read messages. We don't read e-mail. We don't listen to conversations.
We analyze **only network behavior**.

- **Local AI (Llama)** — runs inside the home
- **Data stays in the house** — no mandatory cloud
- **Intelligence flows down; customer data never flows up**
- No data selling. No invasive monitoring.

> "We can't violate privacy with data we never receive."

<!--
(30s) Our edge vs. big tech. The central AI only CURATES intelligence (threats,
parental control); the customer's data is analyzed locally. Model confirmed by
the industry (NextDNS/Cloudflare).
-->

---

# 5 · Competition & Business

| | Pi-hole | NextDNS | Firewalla | **Home AI** |
|---|:---:|:---:|:---:|:---:|
| Natural language | ❌ | ❌ | ❌ | ✅ |
| Local AI | ❌ | ❌ | ❌ | ✅ |
| Privacy by default | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Zero config / families | ❌ | ❌ | ⚠️ | ✅ |

**Model:** hardware **R$ 699** (one-time) + recurring add-ons:
Remote (secure remote access) · Care (SLA support) · Extended updates.
**The data stays the customer's.**

<!--
(30s) We don't sell a firewall/blocker/dashboard — we sell PEACE OF MIND. The
hardware covers CAC; the recurring services are the margin. Open source under the
hood lowers cost and builds trust.
-->

---

# 6 · Roadmap, vision & the ask

**MVP in 6 weeks** (1 AI + 1 full stack) · **Beta**: 10 homes in 30 days.
**Goal:** *95% install with no human help — if they need a technician, we failed.*

Today we protect the network. Tomorrow we answer:
*"Is my home safe? What changed? Is there a device I don't recognize?"*

> Most companies use AI to **learn about the user**.
> We use AI so the **user understands their own technology**.

**DNS Shield Home AI — the guardian that was missing.** 🛡️

<!--
(30s) Close with the ask (investment/partnership) and the vision. Ready answer to
"what's your differentiator?": "We don't sell a firewall or a dashboard. We sell
peace of mind: we turn invisible risks into explanations anyone understands —
without giving up privacy."
Real proof in the demo: ~76k blocked domains, ~23% of queries filtered, local AI
with fallback, open source at github.com/LiviaMor/dns-shield.
-->

---

## Data source

Vulnerability stats: **Avast** — study of 2M+ Brazilian home networks (45% of
smart homes with ≥1 vulnerable device; 66% of routers at risk). *Content
rephrased for license compliance.*
- https://blog.avast.com/pt-br/45-das-resid%C3%AAncias-inteligentes-no-brasil-possuem-dispositivos-vulner%C3%A1veis
