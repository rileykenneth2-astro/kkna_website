/* ==========================================================================
   Site behavior: mobile menu, next-meeting card, upcoming events, calendar
   embed, signup. Settings come from src/_data/site.yml (served to the browser
   as /js/site-config.js); nothing here should need editing.
   Every feature degrades gracefully: without JavaScript, or without a
   calendar key, the page still shows the meeting schedule and calendar link.
   ========================================================================== */

(function () {
  "use strict";

  var cfg = window.KKNA || {};
  var TZ = "America/Indiana/Indianapolis";

  /* ---- Mobile menu ------------------------------------------------------ */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* ---- Footer year ------------------------------------------------------ */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Date helpers ----------------------------------------------------- */

  function pad(n) { return String(n).padStart(2, "0"); }

  function fmt(date, opts) {
    return new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: TZ }, opts)).format(date);
  }

  // "18:30" -> "6:30"; "19:00" -> "7". Used for the configured meeting time.
  function clock(hhmm) {
    var p = hhmm.split(":").map(Number);
    var h = p[0] % 12 || 12;
    return p[1] ? h + ":" + pad(p[1]) : String(h);
  }

  function meridiem(hhmm) { return Number(hhmm.split(":")[0]) < 12 ? "am" : "pm"; }

  function timeRange(start, end) {
    var sameHalf = meridiem(start) === meridiem(end);
    return clock(start) + (sameHalf ? "" : " " + meridiem(start)) + "–" + clock(end) + " " + meridiem(end);
  }

  function lastMondayOf(year, month) {
    var d = new Date(year, month + 1, 0);
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
    return d;
  }

  // Next last-Monday meeting that hasn't ended yet.
  function nextScheduledMeeting(now) {
    var end = cfg.meeting.end.split(":").map(Number);
    var d = lastMondayOf(now.getFullYear(), now.getMonth());
    d.setHours(end[0], end[1]);
    if (d < now) d = lastMondayOf(now.getFullYear(), now.getMonth() + 1);
    return d;
  }

  function fullAddress(m) {
    return m.place + ", " + m.address + (m.cityStateZip ? ", " + m.cityStateZip : "");
  }

  function googleCalendarLink(title, startStamp, endStamp, location, zoned) {
    var url = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + startStamp + "/" + endStamp +
      "&location=" + encodeURIComponent(location);
    return zoned ? url + "&ctz=" + encodeURIComponent(TZ) : url;
  }

  function utcStamp(date) { return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }

  /* ---- Next meeting card ------------------------------------------------ */

  var card = document.getElementById("next-meeting");

  function setMeeting(parts) {
    if (!card) return;
    Object.keys(parts).forEach(function (key) {
      var el = card.querySelector('[data-meeting="' + key + '"]');
      if (!el) return;
      if (key === "gcal") {
        // Only now does this point at Google Calendar, so mark it as leaving the site.
        el.href = parts[key];
        el.target = "_blank";
        el.rel = "noopener";
        if (!el.querySelector(".visually-hidden")) {
          var hint = document.createElement("span");
          hint.className = "visually-hidden";
          hint.textContent = " (opens in a new tab)";
          el.appendChild(hint);
        }
      } else {
        el.textContent = parts[key];
      }
    });
    var tile = card.querySelector(".date-tile");
    if (tile) tile.hidden = false;
  }

  function showScheduledMeeting() {
    if (!card || !cfg.meeting) return;
    var m = cfg.meeting;
    var d = nextScheduledMeeting(new Date());
    var stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    setMeeting({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      day: d.getDate(),
      when: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      time: timeRange(m.start, m.end),
      gcal: googleCalendarLink(
        "Kennedy-King neighborhood meeting",
        stamp + "T" + m.start.replace(":", "") + "00",
        stamp + "T" + m.end.replace(":", "") + "00",
        fullAddress(m),
        true
      ),
    });
  }

  function showCalendarMeeting(ev) {
    var start = new Date(ev.start.dateTime);
    var end = new Date(ev.end.dateTime);
    setMeeting({
      month: fmt(start, { month: "short" }),
      day: fmt(start, { day: "numeric" }),
      when: fmt(start, { weekday: "long", month: "long", day: "numeric" }),
      time: fmt(start, { hour: "numeric", minute: "2-digit" }) + "–" + fmt(end, { hour: "numeric", minute: "2-digit" }),
      place: ev.location || (cfg.meeting.place + ", " + cfg.meeting.address),
      gcal: googleCalendarLink(ev.summary, utcStamp(start), utcStamp(end), ev.location || fullAddress(cfg.meeting), false),
    });
  }

  showScheduledMeeting();

  /* ---- Upcoming events from Google Calendar ----------------------------- */

  var list = document.getElementById("event-list");
  var fallback = document.getElementById("events-fallback");

  function eventItem(ev) {
    var allDay = !ev.start.dateTime;
    var start = allDay ? new Date(ev.start.date + "T12:00:00") : new Date(ev.start.dateTime);
    var li = document.createElement("li");
    li.className = "event";

    var tile = document.createElement("div");
    tile.className = "date-tile";
    tile.setAttribute("aria-hidden", "true");
    tile.innerHTML = '<span class="date-tile__month"></span><span class="date-tile__day"></span>';
    tile.children[0].textContent = fmt(start, { month: "short" });
    tile.children[1].textContent = fmt(start, { day: "numeric" });

    var body = document.createElement("div");
    var h3 = document.createElement("h3");
    var a = document.createElement("a");
    a.href = ev.htmlLink;
    a.target = "_blank";          // event details live on Google Calendar
    a.rel = "noopener";
    a.textContent = ev.summary || "Untitled event";
    var hint = document.createElement("span");
    hint.className = "visually-hidden";
    hint.textContent = " (opens in a new tab)";
    a.appendChild(hint);
    h3.appendChild(a);
    var when = document.createElement("p");
    when.textContent = fmt(start, { weekday: "long", month: "long", day: "numeric" }) +
      (allDay ? "" : ", " + fmt(start, { hour: "numeric", minute: "2-digit" }));
    body.appendChild(h3);
    body.appendChild(when);
    if (ev.location) {
      var where = document.createElement("p");
      where.textContent = ev.location;
      body.appendChild(where);
    }

    li.appendChild(tile);
    li.appendChild(body);
    return li;
  }

  function loadCalendar() {
    var c = cfg.calendar || {};
    if (!c.apiKey || !c.id) return; // not connected yet: keep the schedule + fallback link

    var url = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(c.id) +
      "/events?singleEvents=true&orderBy=startTime&maxResults=10" +
      "&timeMin=" + encodeURIComponent(new Date().toISOString()) +
      "&fields=items(summary,start,end,location,htmlLink)" +
      "&key=" + encodeURIComponent(c.apiKey);

    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("Calendar returned " + r.status); return r.json(); })
      .then(function (data) {
        var items = data.items || [];
        var keyword = (c.meetingKeyword || "meeting").toLowerCase();
        var meeting = items.find(function (ev) {
          return ev.start.dateTime && (ev.summary || "").toLowerCase().indexOf(keyword) !== -1;
        });
        if (meeting) showCalendarMeeting(meeting);

        var others = items.filter(function (ev) { return ev !== meeting; }).slice(0, 3);
        if (!list || !others.length) return;
        others.forEach(function (ev) { list.appendChild(eventItem(ev)); });
        list.hidden = false;
        if (fallback) fallback.hidden = true;
      })
      .catch(function (err) { console.warn("Community calendar unavailable:", err); });
  }

  loadCalendar();

  /* ---- Community calendar embed (Events page) --------------------------- */

  // A list view reads better on phones; the month grid suits wider screens.
  var embed = document.querySelector(".calendar-embed iframe[data-src-agenda]");
  if (embed) {
    var wide = window.matchMedia("(min-width: 48em)").matches;
    embed.src = wide ? embed.dataset.srcMonth : embed.dataset.srcAgenda;
    embed.parentElement.classList.toggle("calendar-embed--month", wide);
  }

  /* ---- Interest form ----------------------------------------------------- */

  var interestForm = document.getElementById("interest-form");
  var topicSelect = document.getElementById("f-topic");

  // "Join this committee" and friends jump to the form with the topic filled in.
  // Scrolling and focus are handled here: moving focus mid-scroll cancels it,
  // so the field is focused only once the page has settled.
  document.querySelectorAll("[data-topic]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var target = document.getElementById("contact-form");
      if (!topicSelect || !target) return; // no form on this page: follow the link normally
      e.preventDefault();

      var wanted = link.getAttribute("data-topic");
      var match = Array.prototype.filter.call(topicSelect.options, function (o) { return o.value === wanted; })[0];
      if (match) topicSelect.value = match.value;

      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      window.setTimeout(function () {
        var name = document.getElementById("f-name");
        if (name) name.focus({ preventScroll: true });
      }, still ? 0 : 700);
    });
  });

  if (interestForm) {
    var forms = cfg.forms || {};
    if (forms.accessKey) {
      var key = document.createElement("input");
      key.type = "hidden";
      key.name = "access_key";
      key.value = forms.accessKey;
      interestForm.appendChild(key);
    }

    interestForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("form-status");
      var button = interestForm.querySelector('button[type="submit"]');

      // Web3Forms needs its access key; without it the service would reject the post.
      if (!forms.endpoint || (forms.endpoint.indexOf("web3forms") !== -1 && !forms.accessKey)) {
        status.textContent = "This form isn't connected yet. Please email " +
          (cfg.contactEmail || "us") + " instead.";
        return;
      }

      button.disabled = true;
      status.textContent = "Sending…";
      fetch(forms.endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(interestForm),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("Form service returned " + r.status);
          interestForm.reset();
          status.textContent = "Thanks! Someone will get back to you within two or three days.";
        })
        .catch(function (err) {
          console.warn("Form submission failed:", err);
          status.textContent = "Sorry, that didn't send. Please email " +
            (cfg.contactEmail || "us") + " instead.";
        })
        .then(function () { button.disabled = false; });
    });
  }

  /* ---- Banner dismissal --------------------------------------------------- */

  var dismiss = document.querySelector("[data-banner-dismiss]");
  if (dismiss) {
    dismiss.addEventListener("click", function () {
      var banner = dismiss.closest(".announce");
      if (banner) banner.hidden = true;
      try {
        localStorage.setItem("kkna-banner-hidden", dismiss.getAttribute("data-banner-dismiss"));
      } catch (e) {
        // Storage blocked: the banner closes now but returns on the next visit.
      }
    });
  }

  /* ---- Banner link to the signup band ------------------------------------ */

  document.querySelectorAll("[data-jump-signup]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var target = document.getElementById("signup-form");
      if (!target) return;
      e.preventDefault();
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
      window.setTimeout(function () {
        var email = document.getElementById("signup-email");
        if (email) email.focus({ preventScroll: true });
      }, still ? 0 : 700);
    });
  });

  /* ---- Email signup (Mailchimp) ----------------------------------------- */
  /* Runs for every form marked data-signup: the banner box and the band at
     the foot of the page both use this. */

  var mailchimp = (cfg.mailchimp && cfg.mailchimp.formAction) || "";

  document.querySelectorAll("[data-signup]").forEach(function (form) {
    var status = form.parentElement.querySelector("[data-signup-status]") ||
                 form.querySelector("[data-signup-status]");

    if (mailchimp) {
      form.action = mailchimp;
      form.method = "post";
      form.target = "_blank";
      // Mailchimp's spam trap field is named b_<u>_<id>, taken from the form URL.
      var q = new URL(mailchimp).searchParams;
      if (q.get("u") && q.get("id")) {
        var trap = document.createElement("input");
        trap.type = "text";
        trap.name = "b_" + q.get("u") + "_" + q.get("id");
        trap.tabIndex = -1;
        trap.autocomplete = "off";
        trap.className = "visually-hidden";
        trap.setAttribute("aria-hidden", "true");
        form.appendChild(trap);
      }
      form.addEventListener("submit", function () {
        if (status) status.textContent = "Thanks! Check your inbox to confirm.";
      });
    } else {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (status) {
          status.textContent = "Email signup is almost ready. Until then, write to " +
            (cfg.contactEmail || "us") + " and we'll add you.";
        }
      });
    }
  });
})();
