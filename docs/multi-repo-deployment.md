# Multi-repo / multi-language deployment

Each language is hosted as its own GitHub repo, deployed to its own custom
domain. **All content (theme, plugins, posts in every language) lives in this
master repo.** The other repos are *shells* — they hold nothing but a workflow
that re-builds against the master.

```
┌────────────────────────────────────────────────────────────┐
│  ZhgChgLi/zhgchgli.github.io                               │
│  → zhgchg.li      (zh-tw, default)                         │
│                                                            │
│  • _layouts/, _includes/, _plugins/, _data/, assets/       │  ← single source of truth
│  • _config.yml + _config.{zh-tw,zh-cn,en,jp}.yml          │
│  • L10n/posts/{zh-tw,zh-cn,en,jp}/                        │  ← all translations live here
│  • bin/lang, bin/unify-tags                                │
│  • .github/workflows/pages.yml      ← deploys zh-tw       │
└─────┬──────────────────────────────────────────────────────┘
      │ on push (or repository_dispatch)
      ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌─────────────────────┐
│ ZhgChgLi/<en-repo>     │  │ ZhgChgLi/<cn-repo>     │  │ ZhgChgLi/<jp-repo>  │
│ → en.zhgchg.li         │  │ → zh-hans.zhgchg.li    │  │ → jp.zhgchg.li      │
│                        │  │                        │  │                     │
│ ONLY a workflow file:  │  │ ONLY a workflow file:  │  │ ONLY a workflow:    │
│ .github/workflows/     │  │ .github/workflows/     │  │ .github/workflows/  │
│   pages.yml            │  │   pages.yml            │  │   pages.yml         │
│ DEPLOY_LANG: en        │  │ DEPLOY_LANG: zh-cn     │  │ DEPLOY_LANG: jp     │
└────────────────────────┘  └────────────────────────┘  └─────────────────────┘
```

## Setting up a shell repo (the easy way)

1. Create a new empty GitHub repo, e.g. `ZhgChgLi/zhgchgli-en.github.io`.
2. Copy `.github/workflow-templates/shell-deploy.yml` from this master repo
   into the new repo at `.github/workflows/pages.yml`.
3. Edit the new file's `env:` block:
   ```yaml
   env:
     DEPLOY_LANG: en
     MASTER_REPO: ZhgChgLi/zhgchgli.github.io
     MASTER_REF:  main
   ```
4. In the shell repo's GitHub settings:
   - Pages → Source: **GitHub Actions**
   - Pages → Custom domain: `en.zhgchg.li` (and add the corresponding DNS
     CNAME at the registrar)
5. Commit & push. The workflow will:
   - clone the master repo,
   - run `bin/lang en build`,
   - upload `_site/` as the Pages artifact and deploy.

That's it — the shell repo never holds posts, theme files, or plugins.
Everything is pulled from master at build time.

## Auto-rebuild on master push

The master workflow's `notify-shells` job fans out a `repository_dispatch`
event to every shell repo when zh-tw deploys successfully — they then rebuild
against the new commit automatically. To enable:

1. In the master repo (this one): **Settings → Variables → Actions → New
   repository variable**:
   - `SHELL_REPOS` (Variable, JSON array):
     ```json
     ["ZhgChgLi/zhgchgli-en.github.io", "ZhgChgLi/zhgchgli-cn.github.io", "ZhgChgLi/zhgchgli-jp.github.io"]
     ```
2. Create a fine-grained PAT (Settings → Developer settings → Personal access
   tokens → Fine-grained):
   - Repository access: each shell repo above
   - Permissions: `Contents: read`, `Actions: write`
3. Save it as `DISPATCH_TOKEN` under **Settings → Secrets → Actions**.
4. The `notify-shells` job is gated by `if: vars.SHELL_REPOS != ''` — without
   the variable it's silently skipped, so the master keeps working solo.

The shell template already has `repository_dispatch: types: [master-updated]`
in its `on:` triggers, so no further wiring needed on that side.

## When to bump the shell repo

Almost never. The shell repo only needs a manual change when **its own
deployment config** changes (e.g. swapping the custom domain, updating CI
runner version). Theme tweaks, layout updates, new posts, new translations —
all happen in the master repo and propagate via the dispatch.

## If a shell repo has overrides

You *can* override per-shell-repo by committing files alongside the workflow
that get layered on top of master after the checkout step. Add a step like:

```yaml
- name: Layer shell-repo overrides on top of master
  run: |
    if [[ -d ./overrides ]]; then
      cp -R overrides/* .
    fi
```

before the build. Use sparingly — the whole point of this architecture is
that there's only one source of truth.

## Local development

For local preview, work in the master repo as normal:

```bash
bin/lang zh-tw serve     # http://127.0.0.1:4000  (default)
bin/lang en   serve      # if you want to preview the English build
```

The shell repos aren't involved in local dev — they only matter at deploy.
