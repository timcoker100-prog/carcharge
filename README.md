# CarCharge

A first prototype for an EV charger finder that matches chargers to a user's car, charging scheme and provider preferences.

## What this version does

- Saves user preferences in the browser
- Lets the user choose car manufacturer and model
- Lets the user select/clear charging providers
- Filters chargers by connector, speed, payment/app preferences and Volvo/BMW compatibility
- Shows results as cards
- Includes a placeholder for a future Mapbox map
- Uses sample data so the idea can be tested before paying for live charger APIs

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite address shown in the terminal.

## Next steps

1. Replace the map placeholder with a real Mapbox map.
2. Add Supabase tables for cars, providers, chargers and user preferences.
3. Replace sample charger data with live API data.
4. Add authentication so preferences save across devices.
