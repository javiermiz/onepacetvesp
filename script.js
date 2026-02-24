const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const axios = require("axios");
const metadata = require("./metadata");

const ensure_dirs = ({ dirs }) => {
  dirs.forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d);
  });
};

const get_document = ({ input_path }) => {
  const html = fs.readFileSync(input_path, "utf8");
  const dom = new JSDOM(html);
  return dom.window.document;
};

const get_season_poster = ({ index }) =>
  index < metadata.seasonPosters.length
    ? metadata.seasonPosters[index]
    : metadata.seriesInfo.logo;

const text_content = (el) =>
  el && el.textContent ? el.textContent.trim() : "";

const find_prev_heading = ({ node, tag }) => {
  let cur = node;
  while (cur && cur.previousElementSibling === null) cur = cur.parentElement;
  while (cur) {
    cur = cur.previousElementSibling;
    if (!cur) break;
    if (cur.tagName && cur.tagName.toLowerCase() === tag) return cur;
    const nested = cur.querySelector && cur.querySelector(tag);
    if (nested) return nested;
  }
  return null;
};

const collect_links = ({ document }) => {
  const anchors = Array.from(
    document.querySelectorAll('a[href*="pixeldrain.net"]'),
  );
  const arcs = [];
  const seen = new Set();
  anchors.forEach((a) => {
    const h2 = find_prev_heading({ node: a, tag: "h2" });
    const arc = text_content(h2) || "Unknown";
    if (!seen.has(arc)) {
      arcs.push(arc);
      seen.add(arc);
    }
  });

  const items = anchors.map((a) => {
    const h2 = find_prev_heading({ node: a, tag: "h2" });
    const h3 = find_prev_heading({ node: a, tag: "h3" });
    const arc = text_content(h2) || "Unknown";
    const version_title = text_content(h3);
    const resolution = text_content(a.querySelector("span.grow"));
    return { arc, version_title, resolution, href: a.href };
  });
  return { arcs, items };
};

const classify_version = ({ version_title }) => {
  const vt = version_title || "";
  if (vt.toLowerCase().includes("sub"))
    return {
      type: "subtitulado",
      name: metadata.versions.types.subtitulado.identifier,
      extended: vt.toLowerCase().includes("extended"),
    };
  if (vt.toLowerCase().includes("dobl"))
    return {
      type: "doblaje",
      name: metadata.versions.types.doblaje.identifier,
      extended: vt.toLowerCase().includes("extended"),
    };
  return {
    type: "unknown",
    name: "",
    extended: vt.toLowerCase().includes("extended"),
  };
};

const fetch_pixeldrain_files = async ({ list_id }) => {
  const url = `https://pixeldrain.net/api/list/${list_id}`;
  const res = await axios.get(url);
  if (!res.data || !res.data.success || !Array.isArray(res.data.files))
    return [];
  return res.data.files;
};

const extract_episode_number = ({ file_name, index }) => {
  const cleaned_name = (file_name || "").replace(/\[[^\]]*]/g, " ");
  const match = cleaned_name.match(/(\d{1,3})/);
  return match ? parseInt(match[1], 10) : index + 1;
};

const create_one_pace_addon = async () => {
  try {
    console.log("[onepace] Starting addon generation");
    ensure_dirs({
      dirs: [
        metadata.paths.dataDir,
        metadata.paths.srcDir,
        metadata.paths.publicDir,
      ],
    });
    console.log("[onepace] Ensured directories:", {
      data_dir: metadata.paths.dataDir,
      src_dir: metadata.paths.srcDir,
      public_dir: metadata.paths.publicDir,
    });

    const document = get_document({ input_path: metadata.paths.inputFile });
    console.log("[onepace] Loaded HTML from", metadata.paths.inputFile);

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "series_info.json"),
      JSON.stringify(metadata.seriesInfo, null, 2),
      "utf8",
    );
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "season_posters.json"),
      JSON.stringify(metadata.seasonPosters, null, 2),
      "utf8",
    );

    const videos = [];
    const streams = {};
    const seasons = [];

    let arc_nodes = Array.from(
      document.querySelectorAll('div[role="listitem"][id]') || [],
    );
    if (arc_nodes.length === 0) {
      arc_nodes = Array.from(document.querySelectorAll("ol > li[id]") || []);
    }

    let season_number = 1;
    let poster_index = 0;

    if (arc_nodes.length > 0) {
      console.log("[onepace] Found arc containers:", arc_nodes.length);
      for (const arc_element of arc_nodes) {
        const arc_name = text_content(arc_element.querySelector("h2"));
        console.log(
          "[onepace] Processing season",
          season_number,
          "arc:",
          arc_name,
        );

        const not_available = arc_element.querySelector(
          "p.italic.text-gray-400",
        );
        const poster = get_season_poster({ index: poster_index++ });
        seasons.push({
          id: String(season_number),
          title: arc_name,
          season: season_number,
          poster,
        });
        if (
          not_available &&
          text_content(not_available).includes("Not yet available")
        ) {
          console.log(
            "[onepace] Skipping unavailable arc",
            arc_name,
            "(season",
            season_number,
            ")",
          );
          season_number++;
          continue;
        }

        const version_streams = {};
        const version_elements_old =
          arc_element.querySelectorAll("h3.flex.grow") || [];

        if (version_elements_old.length > 0) {
          console.log(
            "[onepace] Found versions (old layout) for arc",
            arc_name,
            ":",
            version_elements_old.length,
          );
          for (const ve of version_elements_old) {
            const version_title = text_content(ve);
            const cls = classify_version({ version_title });
            if (cls.type === "unknown") continue;
            const links = ve.parentElement
              ? ve.parentElement.querySelectorAll('a[href*="pixeldrain.net"]')
              : [];
            if (!links || links.length === 0) continue;
            const link = links[links.length - 1];
            const resolution = text_content(link.querySelector("span.grow"));
            const list_id = (link.href || "").split("/").pop();
            try {
              const files = await fetch_pixeldrain_files({ list_id });
              console.log(
                "[onepace] Pixeldrain list",
                list_id,
                "has",
                files.length,
                "files for",
                arc_name,
                "version",
                version_title,
              );
              for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const episode = extract_episode_number({
                  file_name: f.name,
                  index: i,
                });
                const video_id = `op:${season_number}:${episode}`;
                const stream_obj = {
                  url: `https://pd.1drv.eu.org/${f.id}`,
                  title: cls.name + (cls.extended ? " (Extended)" : ""),
                  name: `${resolution} ${cls.type === "doblaje" ? "Doblado" : "Subtitulado"}${cls.extended ? " Extended" : ""}`,
                };
                if (!version_streams[video_id]) version_streams[video_id] = [];
                version_streams[video_id].push(stream_obj);
                if (!streams[video_id]) {
                  const video = {
                    id: video_id,
                    title: `${arc_name} - Episodio ${episode}`,
                    season: season_number,
                    episode: episode,
                    thumbnail: poster,
                  };
                  if (!videos.find((v) => v.id === video_id)) {
                    videos.push(video);
                  }
                }
              }
            } catch (e) {
              console.error(
                "[onepace] Error fetching Pixeldrain list",
                list_id,
                "for arc",
                arc_name,
                "version",
                version_title,
                e.message,
              );
            }
          }
        } else {
          const version_blocks = Array.from(
            arc_element.querySelectorAll("ul li"),
          ).filter((li) => {
            if (!li.parentElement || !li.parentElement.parentElement)
              return false;
            if (li.parentElement.parentElement !== arc_element) return false;
            return [...li.querySelectorAll("a")].some((a) =>
              String(a.href || "").includes("pixeldrain.net"),
            );
          });

          console.log(
            "[onepace] Found versions (new layout) for arc",
            arc_name,
            ":",
            version_blocks.length,
          );

          for (const block of version_blocks) {
            const raw_title = text_content(block);
            const pix_index = raw_title.indexOf("Pixeldrain");
            const version_title =
              pix_index >= 0 ? raw_title.slice(0, pix_index).trim() : raw_title;
            const cls = classify_version({ version_title });
            if (cls.type === "unknown") continue;

            const anchors = [...block.querySelectorAll("a")].filter((a) =>
              String(a.href || "").includes("pixeldrain.net"),
            );
            if (!anchors.length) continue;

            const link = anchors[anchors.length - 1];
            const label = text_content(link);
            const match = label.match(/(\\d{3,4}p)/i);
            const resolution = match ? match[1] : label;
            const list_id = (link.href || "").split("/").pop();

            try {
              const files = await fetch_pixeldrain_files({ list_id });
              console.log(
                "[onepace] Pixeldrain list",
                list_id,
                "has",
                files.length,
                "files for",
                arc_name,
                "version",
                version_title,
              );
              for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const episode = extract_episode_number({
                  file_name: f.name,
                  index: i,
                });
                const video_id = `op:${season_number}:${episode}`;
                const stream_obj = {
                  url: `https://pd.1drv.eu.org/${f.id}?download`,
                  title: cls.name + (cls.extended ? " (Extended)" : ""),
                  name: `${resolution} ${cls.type === "doblaje" ? "Doblado" : "Subtitulado"}${cls.extended ? " Extended" : ""}`,
                };
                if (!version_streams[video_id]) version_streams[video_id] = [];
                version_streams[video_id].push(stream_obj);
                if (!streams[video_id]) {
                  const video = {
                    id: video_id,
                    title: `${arc_name} - Episodio ${episode}`,
                    season: season_number,
                    episode: episode,
                    thumbnail: poster,
                  };
                  if (!videos.find((v) => v.id === video_id)) {
                    videos.push(video);
                  }
                }
              }
            } catch (e) {
              console.error(
                "[onepace] Error fetching Pixeldrain list",
                list_id,
                "for arc",
                arc_name,
                "version",
                version_title,
                e.message,
              );
            }
          }
        }
        Object.keys(version_streams).forEach((vid) => {
          streams[vid] = version_streams[vid];
        });
        season_number++;
      }
    } else {
      console.log(
        "[onepace] No arc containers found, falling back to anchor scan",
      );
      const { arcs, items } = collect_links({ document });
      console.log(
        "[onepace] Anchor scan arcs:",
        arcs.length,
        "items:",
        items.length,
      );
      const arc_order = arcs;
      const grouped = new Map();
      items.forEach((it) => {
        if (!grouped.has(it.arc)) grouped.set(it.arc, []);
        grouped.get(it.arc).push(it);
      });
      for (const arc_name of arc_order) {
        const poster = get_season_poster({ index: poster_index++ });
        seasons.push({
          id: String(season_number),
          title: arc_name,
          season: season_number,
          poster,
        });
        console.log(
          "[onepace] Processing season",
          season_number,
          "arc:",
          arc_name,
        );
        const list = grouped.get(arc_name) || [];
        const version_streams = {};
        for (const it of list) {
          const cls = classify_version({ version_title: it.version_title });
          if (cls.type === "unknown") continue;
          const list_id = (it.href || "").split("/").pop();
          try {
            const files = await fetch_pixeldrain_files({ list_id });
            console.log(
              "[onepace] Pixeldrain list",
              list_id,
              "has",
              files.length,
              "files for",
              arc_name,
              "version",
              it.version_title,
            );
            for (let i = 0; i < files.length; i++) {
              const f = files[i];
              const episode = extract_episode_number({
                file_name: f.name,
                index: i,
              });
              const video_id = `op:${season_number}:${episode}`;
              const stream_obj = {
                url: `https://pd.1drv.eu.org/${f.id}?download`,
                title: cls.name + (cls.extended ? " (Extended)" : ""),
                name: `${it.resolution || ""} ${cls.type === "doblaje" ? "Doblado" : "Subtitulado"}${cls.extended ? " Extended" : ""}`,
              };
              if (!version_streams[video_id]) version_streams[video_id] = [];
              version_streams[video_id].push(stream_obj);
              if (!streams[video_id]) {
                const video = {
                  id: video_id,
                  title: `${arc_name} - Episodio ${episode}`,
                  season: season_number,
                  episode: episode,
                  thumbnail: poster,
                };
                if (!videos.find((v) => v.id === video_id)) videos.push(video);
              }
            }
          } catch (e) {
            console.error(
              "[onepace] Error fetching Pixeldrain list",
              list_id,
              "for arc",
              arc_name,
              "version",
              it.version_title,
              e.message,
            );
          }
        }
        Object.keys(version_streams).forEach((vid) => {
          streams[vid] = version_streams[vid];
        });
        season_number++;
      }
    }

    videos.sort((a, b) =>
      a.season !== b.season ? a.season - b.season : a.episode - b.episode,
    );

    console.log("[onepace] Summary:");
    console.log("[onepace] Seasons:", seasons.length);
    console.log("[onepace] Videos:", videos.length);
    console.log(
      "[onepace] Episodes with streams:",
      Object.keys(streams).length,
    );

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "videos.json"),
      JSON.stringify(videos, null, 2),
      "utf8",
    );
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "streams.json"),
      JSON.stringify(streams, null, 2),
      "utf8",
    );
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "seasons.json"),
      JSON.stringify(seasons, null, 2),
      "utf8",
    );

    console.log("[onepace] Wrote data files to", metadata.paths.dataDir);

    const manifest = {
      ...metadata.manifest,
      logo: metadata.seriesInfo.logo,
      background: metadata.seriesInfo.background,
      resources: ["catalog", "meta", "stream"],
      types: ["series"],
      catalogs: [
        {
          type: "series",
          id: "one_pace_catalog",
          name: metadata.manifest.name,
          extra: [{ name: "search", isRequired: false }],
        },
      ],
    };

    const meta_obj = {
      id: metadata.seriesInfo.id,
      type: "series",
      name: metadata.seriesInfo.name,
      poster: metadata.seriesInfo.poster,
      background: metadata.seriesInfo.background,
      logo: metadata.seriesInfo.logo,
      description: metadata.seriesInfo.description,
      releaseInfo: metadata.seriesInfo.releaseInfo,
      genres: metadata.seriesInfo.genres,
      videos: videos,
      seasons: seasons,
    };

    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
    fs.writeFileSync(
      path.join(metadata.paths.dataDir, "meta.json"),
      JSON.stringify(meta_obj, null, 2),
      "utf8",
    );

    console.log("[onepace] Wrote manifest and meta to", metadata.paths.dataDir);

    const addon_code = `
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const manifest = require('./data/manifest.json');
const meta = require('./data/meta.json');
const streams = require('./data/streams.json');
const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(({ type, id }) => {
  if (type === 'series' && id === 'one_pace_catalog') {
    return Promise.resolve({ metas: [{ id: "${metadata.seriesInfo.id}", type: "series", name: "${metadata.seriesInfo.name}", poster: meta.poster, posterShape: "regular", description: "${metadata.seriesInfo.description}" }] });
  }
  return Promise.resolve({ metas: [] });
});
builder.defineMetaHandler(({ type, id }) => {
  if (type === 'series' && id === '${metadata.seriesInfo.id}') return Promise.resolve({ meta });
  return Promise.resolve({ meta: null });
});
builder.defineStreamHandler(({ type, id }) => {
  if (streams[id]) return Promise.resolve({ streams: streams[id] });
  return Promise.resolve({ streams: [] });
});
const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log("Addon ${metadata.manifest.name} corriendo en http://localhost:" + port);
`;

    fs.writeFileSync("addon.js", addon_code, "utf8");

    const package_json = {
      name: "one-pace-espanol-addon",
      version: metadata.manifest.version,
      description: metadata.manifest.description,
      main: "addon.js",
      scripts: { start: "node addon.js", build: "node script.js" },
      dependencies: {
        "stremio-addon-sdk": "^1.6.10",
        axios: "^0.21.1",
        jsdom: "^20.0.0",
      },
    };
    fs.writeFileSync(
      "package.json",
      JSON.stringify(package_json, null, 2),
      "utf8",
    );
    console.log("[onepace] Wrote addon.js and package.json");
    console.log("[onepace] Addon generation finished successfully");
  } catch (e) {
    console.error("Error al crear el addon:", e);
  }
};

if (require.main === module) create_one_pace_addon();

module.exports = { create_one_pace_addon };
