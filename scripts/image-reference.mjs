// Job outputs containing a registry owner's name can be suppressed by GitHub's secret masking.
// Reconstruct the reference from the Docker Hub context and pass only the digest between jobs.
const owner = process.env.DOCKERHUB_USERNAME ?? "";
const digest = process.env.IMAGE_DIGEST ?? "";
if (!/^[a-z0-9][a-z0-9_-]*$/.test(owner) || !/^sha256:[a-f0-9]{64}$/.test(digest)) {
  console.error("Missing or invalid Docker Hub owner / candidate digest");
  process.exit(1);
}
process.stdout.write(`docker.io/${owner}/navelix@${digest}`);
