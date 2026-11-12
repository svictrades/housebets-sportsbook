# Housebets Sportsbook · "Tideline" prototype

A clickable front-end prototype for the Housebets sportsbook design contest. Five linked pages (Sports home, Live, Football, Match page, Bet slip + My bets), built for 390px phones and 1440px desktops. Singles only, decimal odds, stakes in USDT. All fixtures, prices, players and bets are sample data; there is no real money.

## Live

https://svictrades.github.io/housebets-sportsbook/ (no login). Phone-sized preview: https://svictrades.github.io/housebets-sportsbook/phone-preview.html

## Run

    npm install
    npm run dev      # http://localhost:5183
    npm run build    # static site in dist/

## Routes

`#/` Sports home · `#/live` Live · `#/football` Football · `#/match/ars-bha` Match page · `#/bets` Bet slip + My bets · `#/stats` the signed-in player's statistics

Reviewer shortcuts: **Demo controls** (bottom of the side panel, the `.` key, or the Menu tab on phones) triggers a goal, a penalty check, a price change, a suspension, a failed bet, a declined cash-out and a "nothing live" state. Deep links: `#/match/ars-bha?scene=goal`, `#/match/ars-bha?scene=slip`, `#/live?scene=lull`, `#/stats`, `#/?scene=wallet`, `#/?scene=loggedout`, `#/bets?scene=card`, `#/?scene=demo`, `#/?rail=open`, `#/?panel=closed`. `phone-preview.html` shows the app in a 390px frame.

## Credits

Built with Claude (Anthropic) as the coding assistant. Libraries: React, Vite, TypeScript, Zustand, wouter, NumberFlow, Phosphor Icons. Fonts: Figtree and Red Hat Display (SIL OFL).

Motion data for the football figure: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217." (subject 10, take 01, via the B. Hahne BVH conversion; baked by `scripts/bake-kick.mjs`).

The Housebets logo and brand belong to Housebets.
