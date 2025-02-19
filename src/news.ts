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
    title = he
      .decode(title!)
      .replace(/-/g, "\\-")
      .replace(/\./g, "\\.")
      .replace(/#/g, "\\#");

    let excerpt = postDiv.querySelector(".post-excerpt")?.innerText.trim();
    excerpt = he
      .decode(excerpt!)
      .replace(/-/g, "\\-")
      .replace(/\./g, "\\.")
      .replace(/#/g, "\\#");
    const link = postDiv.querySelector(".post-title > a")?.getAttribute("href");
    const instaViewLink = "t.me/iv?url=" + link + "&rhash=384831a77e21e3"; //iv template
    const postDate = postDiv.querySelector(".post-date")?.innerText.trim();
    return `\n\n[*${title}*](${instaViewLink})\n${excerpt}\n_${postDate}_\n[Visit Page](${link})\n\n`;
  });
  return postJSON;
}
