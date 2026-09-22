import { load as loadYaml } from "js-yaml";

// Mirrors timeRange() in src/js/main.js: ("18:30", "19:30") -> "6:30–7:30 pm"
function timeRange(start, end) {
  const half = (t) => (Number(t.split(":")[0]) < 12 ? "am" : "pm");
  const clock = (t) => {
    const [h, m] = t.split(":").map(Number);
    return (h % 12 || 12) + (m ? ":" + String(m).padStart(2, "0") : "");
  };
  const sameHalf = half(start) === half(end);
  return `${clock(start)}${sameHalf ? "" : " " + half(start)}–${clock(end)} ${half(end)}`;
}

export default function (eleventyConfig) {
  // Content files (src/_data/*.yml) are YAML so they're easy to read and edit.
  eleventyConfig.addDataExtension("yml,yaml", (contents) => loadYaml(contents));

  // Copied to the site as-is.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/js/main.js");

  eleventyConfig.addFilter("timeRange", timeRange);
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // YAML dates arrive as UTC midnight, so format them in UTC to avoid an off-by-one day.
  eleventyConfig.addFilter("longDate", (value) =>
    new Date(value).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    })
  );

  eleventyConfig.addFilter("isoDate", (value) => new Date(value).toISOString().slice(0, 10));

  // Google Calendar "subscribe" links identify the calendar by its base64-encoded ID.
  eleventyConfig.addFilter("base64", (value) => Buffer.from(String(value)).toString("base64"));

  // "(317) 327-4622" -> "tel:+13173274622" so phones can dial it.
  eleventyConfig.addFilter("telHref", (value) => "tel:+1" + String(value).replace(/\D/g, ""));

  eleventyConfig.addFilter("mailto", (email, subject) =>
    `mailto:${email}?subject=${encodeURIComponent(subject)}`
  );

  // Settings the browser needs (calendar, meeting, signup), taken from site.yml.
  eleventyConfig.addFilter("clientConfig", (site) =>
    JSON.stringify({ meeting: site.meeting, calendar: site.calendar, mailchimp: site.mailchimp, forms: site.forms, contactEmail: site.email }, null, 2)
  );

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
