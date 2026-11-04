import { productionOrigin } from "../src/config/site.ts";

const value = process.env.NEXT_PUBLIC_SITE_URL;

if (value !== productionOrigin) {
  console.error(
    `assert-site-url: NEXT_PUBLIC_SITE_URL must be ${productionOrigin} for a production build, got ${value ?? "nothing"}`,
  );
  process.exit(1);
}
console.log(`assert-site-url: ok (${productionOrigin})`);
