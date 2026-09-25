# sonsu.dev

Static Cloudflare Pages site in the `sonsu` Pages project. The production branch is `main`. [Deploy homepage](../.github/workflows/deploy-site.yml) checks the site on pull requests and deploys it when `site/` or the workflow changes on `main`. It can also be run manually from `main` in GitHub Actions. The workflow uploads only `index.html`, `styles.css`, `script.js`, `favicon.svg`, and `_redirects`; no build command is needed.

Configure the repository variable `CLOUDFLARE_ACCOUNT_ID` for the Cloudflare account that owns the project and the repository secret `CLOUDFLARE_API_TOKEN` with **Account → Cloudflare Pages → Edit** permission scoped to that account. The project uses Direct Upload, so this workflow deploys with Wrangler rather than Cloudflare's Git integration.

`sonsu.dev` is the project's custom domain. The `_redirects` file sends `/install` to the repository's `install.sh` on `main` with a 302 response; the CLI binaries remain in GitHub Releases. After a deployment, check the home page and `curl -I https://sonsu.dev/install`.
