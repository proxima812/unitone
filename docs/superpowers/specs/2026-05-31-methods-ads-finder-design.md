# Methods, Ads, and Finder Updates

## Scope

Make three narrowly scoped content and interface updates:

1. Clarify method pages whose catalog entry currently contains only the generic placeholder description.
2. Make the archive article advertising block visually distinct with a green treatment.
3. Add four search actions to every community card on `/finder`.

## Methods

Only entries in `src/data/methods.ts` whose `body` is the existing placeholder text are incomplete.

Replace that placeholder with a section titled `Предположение: как проходить метод`. The text must:

- state that the method author did not specify the process or UnityOne did not find the complete information;
- present a cautious general sequence: find a group or mentor familiar with the method, clarify the format and schedule, agree on a first step, and verify details with the chosen community;
- avoid presenting the assumption as an official instruction.

Methods with concrete descriptions remain unchanged.

## Advertising Block

Update the existing advertising block in `src/pages/archive/[slug].astro`. Preserve its content and layout, but use a green background and green border so it stands out from editorial content.

## Finder Search Actions

Update each community card in `src/pages/finder.astro` to show four search links:

- Google
- Яндекс
- Bing
- DuckDuckGo

Each link opens a new tab and searches for the community title. Keep the existing Wikipedia action and missing-Wikipedia state.

## Validation

Use lightweight checks:

- search the changed method data to confirm only placeholder entries were replaced;
- inspect generated search URLs in the finder template;
- run the project's available lightweight Astro or TypeScript check if configured.
