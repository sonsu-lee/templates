# sonsu.dev

Static Cloudflare Pages site in the `sonsu` Pages project. The production branch is `main`. [Deploy homepage](.github/workflows/deploy-site.yml) checks the site on pull requests and deploys it when `site/` or the workflow changes on `main`. The `site/` directory contains only public assets, so Wrangler can upload it directly without a build or staging step.

Configure the repository variable `CLOUDFLARE_ACCOUNT_ID` for the Cloudflare account that owns the project and the repository secret `CLOUDFLARE_API_TOKEN` with **Account → Cloudflare Pages → Edit** permission scoped to that account. The project uses Direct Upload, so this workflow deploys with Wrangler rather than Cloudflare's Git integration.

`sonsu.dev` is the project's custom domain. The `_redirects` file sends `/install` to the repository's `install.sh` on `main` with a 302 response; the CLI binaries remain in GitHub Releases. After a deployment, check the home page and `curl -I https://sonsu.dev/install`.

The workflow filters for homepage and workflow changes to avoid deploying unrelated repository updates. Pull requests run the asset check; only a push to `main` runs the deployment step. `ubuntu-26.04` already includes Node.js for the syntax check and Wrangler. Checkout does not retain its GitHub token, and the workflow grants only read access to repository contents.
