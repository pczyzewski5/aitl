# The shadcn CLI imported a stray `cn` npm package

## Co się stało
After `shadcn add button` the generated code imported `cn` from the placeholder `"cn"`, and a `cn` (^0.5.2) dependency landed in `packages/ui/package.json`. It is an unrelated npm package, not our helper (`src/lib/utils.ts`); nothing imported it, and it stayed unnoticed through several PRs.

## Przyczyna
The registry code uses the literal module name `cn` as a placeholder for the project's utils alias. When the alias cannot be resolved, the CLI treats the name as a real package and installs it.

## Wniosek
After every `shadcn add`, diff `package.json` and `package-lock.json` and remove any dependency that is not in the approved plan; grep for imports before deleting (here: zero imports of the `cn` package, removed in the Checkbox PR). Never keep an unused dependency "because the CLI added it".
