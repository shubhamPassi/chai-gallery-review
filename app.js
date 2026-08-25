(() => {
  "use strict";
  const config = window.REVIEW_CONFIG || {};
  const state = { rating: null, liked: [] };
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    businessName: $("#business-name"), tagline: $("#tagline"), logo: $("#logo"), ratingControl: $("#rating-control"), tagList: $("#tag-list"), comment: $("#comment"), charCount: $("#char-count"), form: $("#review-form"), message: $("#form-message"), generate: $("#generate-button"), googleDirectLink: $("#google-direct-link"), draftSection: $("#draft-section"), draft: $("#draft"), regenerate: $("#regenerate-button"), copy: $("#copy-button"), googleLink: $("#google-link"), copyMessage: $("#copy-message"),
  };
  elements.businessName.textContent = config.businessName || "Your shop";
  elements.tagline.textContent = config.tagline || "Your honest feedback helps us improve.";
  elements.logo.src = config.logoUrl || "assets/chai-gallery-logo.png";
  elements.googleDirectLink.href = config.googleReviewUrl || "#";
  document.title = `Share your experience | ${config.businessName || "Your shop"}`;
  elements.googleLink.href = config.googleReviewUrl || "#";
  for (let value = 1; value <= 5; value += 1) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "star-button"; button.textContent = "★"; button.setAttribute("role", "radio"); button.setAttribute("aria-label", `${value} out of 5 stars`); button.setAttribute("aria-checked", "false");
    button.addEventListener("click", () => selectRating(value)); elements.ratingControl.append(button);
  }
  function selectRating(value) {
    state.rating = value;
    [...elements.ratingControl.children].forEach((button, index) => { const selected = index < value; button.classList.toggle("is-selected", selected); button.setAttribute("aria-checked", String(index === value - 1)); });
  }
  (config.tags || []).forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "tag-button"; button.textContent = tag; button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => { const included = state.liked.includes(tag); state.liked = included ? state.liked.filter((item) => item !== tag) : [...state.liked, tag]; button.setAttribute("aria-pressed", String(!included)); });
    elements.tagList.append(button);
  });
  elements.comment.addEventListener("input", () => { elements.charCount.textContent = elements.comment.value.length; });
  elements.form.addEventListener("submit", generateDraft); elements.regenerate.addEventListener("click", generateDraft); elements.copy.addEventListener("click", copyReview);
  elements.googleLink.addEventListener("click", async (event) => { if (!isConfiguredUrl(config.googleReviewUrl)) { event.preventDefault(); elements.copyMessage.textContent = "The Google review link has not been configured yet."; return; } if (elements.draft.value.trim()) await copyReview(); });
  function payload() { return { rating: state.rating, liked: state.liked, comment: elements.comment.value.trim() }; }
  function isConfiguredUrl(value) { return typeof value === "string" && /^https:\/\//.test(value) && !value.includes("REPLACE_ME"); }
  function setBusy(busy) { elements.generate.disabled = busy; elements.generate.textContent = busy ? "Writing your draft…" : "✨ Write my draft"; elements.regenerate.disabled = busy; }
  async function generateDraft(event) {
    if (event) event.preventDefault(); elements.message.textContent = "";
    const data = payload();
    if (!data.rating && data.liked.length === 0 && !data.comment) { elements.message.textContent = "Choose a rating, a topic, or write a short note first."; return; }
    if (!isConfiguredUrl(config.apiUrl)) { elements.message.textContent = "The AI service has not been configured yet."; return; }
    setBusy(true);
    try {
      const response = await fetch(config.apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || typeof body.review !== "string") throw new Error(body.error || "We could not create a draft right now. Please try again.");
      elements.draft.value = body.review; elements.draftSection.hidden = false; elements.draftSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) { elements.message.textContent = error.message || "We could not create a draft right now. Please try again."; } finally { setBusy(false); }
  }
  async function copyReview() {
    const text = elements.draft.value.trim();
    if (!text) { elements.copyMessage.textContent = "Write or generate a review first."; return false; }
    try { await navigator.clipboard.writeText(text); elements.copyMessage.textContent = "Copied. Paste it into Google and post only if it reflects your experience."; return true; }
    catch { elements.draft.focus(); elements.draft.select(); elements.copyMessage.textContent = "Select and copy the review manually."; return false; }
  }
})();
