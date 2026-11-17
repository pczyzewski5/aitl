# The shadcn CLI writes into a literal `@/` directory without a tsconfig alias

## Co się stało
`npx shadcn@4.23.0 add button --cwd packages/ui --yes` ran non-interactively, but created `packages/ui/@/components/ui/button.tsx` (a real directory named `@`) because `components.json` used `@/` aliases and the package tsconfig has no `paths`. The generated file also imported `cn` from the placeholder `"cn"` instead of a real module.

## Przyczyna
The CLI resolves the aliases from `components.json` against tsconfig `paths`; when none exist it treats the alias as a relative path. The registry item for utils is only a placeholder re-export.

## Wniosek
After `shadcn add`, move the file to its real location (`src/components/ui/`), switch to relative imports, create the `cn` helper by hand and delete the stray `@/` directory. Always diff `package.json` and `git status` after a CLI run. Related: shadcn classes such as `rounded-md`, `shadow-xs`, `bg-secondary`, `text-white` silently produce no styles (or fail `check:tokens`) because the Tailwind namespaces are zeroed, and tailwind-merge needs `extendTailwindMerge` to know the `rounded-control/card/pill` and `h-control` names. `user-event` hover does not trigger CSS `:hover`, so hover is covered by the `data-preview-state` preview and by checking the generated CSS.
