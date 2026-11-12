# NetCheck

See which plans your local hospitals actually take.

NetCheck will show which New Jersey marketplace health plans are in-network at
hospitals near a ZIP code. Version 1 covers Middlesex and Mercer counties.

**Status:** schema and project structure only. No plan or hospital data yet.
A full README (data sources, limitations, plan matching) comes in build step 6.

## Layout

- `data/` - static JSON, one file per table
- `src/lib/types.ts` - the data schema
- `src/lib/data/repository.ts` - the interface pages use to read data
- `scripts/validate-data.mjs` - integrity checks; runs before every build

## Commands

    npm run dev
    npm run validate-data
    npm run build
