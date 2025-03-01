import { parse } from "node-html-parser";

import he from "he";

async function parseNewsToInstaView(url: string): Promise<string[]> {
  const page = await fetch(url);
  const html = await page.text();
  const root = parse(html);
  const posts = root.querySelectorAll(".post-content");

  const news = posts.map((postDiv) => {
    let title = postDiv.querySelector(".post-title")?.innerText.trim();
    if (!title) {
      title = "";
    }
    title = formatString(title);
    let excerpt = postDiv.querySelector(".post-excerpt")?.innerText.trim();
    if (!excerpt) {
      excerpt = title?.slice(0, 20) || "";
    }
    excerpt = formatString(excerpt);
    const link = postDiv.querySelector(".post-title > a")?.getAttribute("href");
    const instaViewLink = "t.me/iv?url=" + link + "&rhash=384831a77e21e3"; //iv template
    let postDate = postDiv.querySelector(".post-date")?.innerText.trim();
    if (!postDate) {
      postDate = new Date().toDateString(); //might have to fix this, maybe just push further back?
    }
    return {
      title,
      excerpt,
      link,
      instaViewLink,
      postDate,
    };
  });
  news.sort(
    (a, b) => parseDate(b.postDate).getTime() - parseDate(a.postDate).getTime()
  );

  return news.map(
    (a) =>
      `\n\n[*${a.title}*](${a.instaViewLink})\n${a.excerpt}\n_${formatString(a.postDate)}_\n[Visit Page](${a.link})\n\n`
  );
}
const formatString = (text: string) =>
  he.decode(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

const parseDate = (dateStr: string) => {
  const cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
  return new Date(cleanedDate);
};

export async function getLatestNews(): Promise<string[]> {
  const url = "https://punchng.com/all-posts/";
  return await parseNewsToInstaView(url);
}

//should look further into this
export async function getTopStories(): Promise<string[]> {
  const url = "https://punchng.com/topics/top-stories/";
  return await parseNewsToInstaView(url);
}

