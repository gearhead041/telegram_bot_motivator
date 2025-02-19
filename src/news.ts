import { parse } from "node-html-parser";
import he from "he";
export async function getLatestNews() {
  const url = "https://punchng.com/all-posts/";
  const page = await fetch(url);
  const html = await page.text();
  const root = parse(html);
  const posts = root.querySelectorAll(".post-content");
  const postJSON = posts.map((postDiv) => {
    let title = postDiv.querySelector(".post-title")?.innerText.trim();
    title = he.decode(title!).replace(/-/g, "\\-").replace(/\./g, "\\.").replace(/#/g,'\\#');

    let excerpt = postDiv.querySelector(".post-excerpt")?.innerText.trim();
    excerpt = he.decode(excerpt!).replace(/-/g, "\\-").replace(/\./g, "\\.").replace(/#/g,'\\#');

    const link = postDiv.querySelector(".post-title > a")?.getAttribute('href');
    const postDate = postDiv.querySelector(".post-date")?.innerText.trim();
    return `[${title}](${link})\n${excerpt}\n_${postDate}_`;
  });
  return postJSON;
}
