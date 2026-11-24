# Next 16 keeps serving 500 when instrumentation register() throws

Co sie stalo: `register()` w `instrumentation.ts` rzuca `EnvValidationError` przy braku `DATABASE_URL`, ale `next start` nie konczy procesu. Loguje "Failed to prepare server", dalej nasluchuje i odpowiada 500 na wszystkie zadania, takze `/api/health`.

Przyczyna: Next traktuje blad hooka jako blad przygotowania serwera, nie jako fatalny.

Wniosek: fail-fast na poziomie procesu wymaga jawnego `process.exit(1)` (decyzja wlasciciela). Test integracyjny sprawdza komunikat w logu i status 500, nie kod wyjscia.
