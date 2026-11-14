# Deploy the website

The website is a static HTML, CSS, and JavaScript project. No backend, package installation, or build command is needed.

## Before publishing

Make sure the publish folder contains these files at its top level:

```text
index.html
styles.css
script.js
favicon.svg
```

The `index.html` file must be at the host's published root. The `c-version/` folder is the separate C console program; it is not used by the website.

## GitHub Pages

For GitHub Pages, select the repository root (`/`) as the branch publishing source. GitHub Pages uses a top-level `index.html` as the entry file. See [GitHub's publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [site creation guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). If you select a different publish folder, place the four website files above at that folder's top level.

## Netlify or similar static hosts

Drag the project root folder into the host's manual deploy area, or connect the repository and set the publish directory to the project root. Leave the build command empty. The host's [build settings](https://docs.netlify.com/build/configure-builds/overview/) define the build command and directory containing files to publish.

## Data behavior

Student changes are saved to browser `localStorage`. Each visitor has a separate local roster. This demo has no shared server database, authentication, or synchronization between devices.
