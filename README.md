# playground

This is a mono-repo housing different projects that I am using to learn and play.

## [Demo](https://playground.writebetacode.com)

## Deployment

A push to `main` runs `.github/workflows/deploy.yml`, which builds the site with
Vite and publishes it through GitHub's first-party Pages actions, committing no
build output to any branch and instead publishing the built site as an
artifact. Repository Settings > Pages > Source is set to "GitHub Actions". A
full setup and contributor walkthrough lands with the documentation rewrite in
a later task.
