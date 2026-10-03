// Runs before every test file, inside workerd. Keep it empty of behavior: fakes are opt-in per test
// (test/fakes/ and `env.__deps`), so a test that does not inject anything exercises the real wiring.
export {};
