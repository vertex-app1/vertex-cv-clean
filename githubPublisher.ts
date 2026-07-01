// githubPublisher.ts
// Publishes a rendered CV HTML page to a GitHub repository via the GitHub REST API,
// so it can be served statically through GitHub Pages.

const GITHUB_API = "https://api.github.com";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "vertex-app1";
const GITHUB_REPO = process.env.GITHUB_REPO || "CV_file";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

interface PublishResult {
  url: string;
}

export async function publishCVToGitHub(username: string, htmlContent: string): Promise<PublishResult> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GitHub publishing is not configured. Missing GITHUB_TOKEN environment variable.");
  }

  const filePath = `${username}/index.html`;
  const apiUrl = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "SmartCV-Publisher",
  };

  // Check if the file already exists, to get its SHA (required for updates)
  let sha: string | undefined;
  const existingRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers });
  if (existingRes.ok) {
    const existingData = await existingRes.json();
    sha = existingData.sha;
  }

  const contentBase64 = Buffer.from(htmlContent, "utf-8").toString("base64");

  const body: Record<string, any> = {
    message: `Publish CV for ${username}`,
    content: contentBase64,
    branch: GITHUB_BRANCH,
  };
  if (sha) {
    body.sha = sha;
  }

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub publish failed (${putRes.status}): ${errText}`);
  }

  const publishedUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/${username}/`;
  return { url: publishedUrl };
}