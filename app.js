(() => {
  "use strict";

  const config = window.REVIEW_CONFIG || {};
  const state = { rating: null, liked: [], reviews: [], currentSuggestion: 0, toastTimer: null };
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    businessName: $("#business-name"), logo: $("#logo"), ratingControl: $("#rating-control"), tagList: $("#tag-list"), comment: $("#comment"), charCount: $("#char-count"), form: $("#review-form"), generate: $("#generate-button"), generation: $("#generation-state"), editor: $("#editor-area"), message: $("#form-message"), suggestions: $("#suggestions-section"), suggestionCard: $("#suggestion-card"), suggestionCount: $("#suggestion-count"), previous: $("#previous-suggestion"), next: $("#next-suggestion"), copyToast: $("#copy-toast"), submit: $("#submit-review-button"), modal: $("#almost-done-modal"), closeModal: $("#close-modal-button"), editReview: $("#edit-review-button"), openGoogle: $("#open-google-button"),
  };

  elements.businessName.textContent = config.businessName || "Your shop";
  elements.logo.src = config.logoUrl || "assets/chai-gallery-logo.png";
  document.title = `${config.businessName || "Your shop"} Review`;

  for (let value = 1; value <= 5; value += 1) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "star-button"; button.textContent = "☆";
    button.setAttribute("role", "radio"); button.setAttribute("aria-label", `${value} out of 5 stars`); button.setAttribute("aria-checked", "false");
    button.addEventListener("click", () => selectRating(value)); elements.ratingControl.append(button);
  }
  (config.tags || []).forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "tag-button"; button.textContent = tag; button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      const included = state.liked.includes(tag);
      state.liked = included ? state.liked.filter((item) => item !== tag) : [...state.liked, tag];
      button.setAttribute("aria-pressed", String(!included));
    });
    elements.tagList.append(button);
  });

  elements.form.addEventListener("submit", generateReviews);
  elements.comment.addEventListener("input", () => { elements.charCount.textContent = elements.comment.value.length; });
  elements.previous.addEventListener("click", () => selectSuggestion(state.currentSuggestion - 1));
  elements.next.addEventListener("click", () => selectSuggestion(state.currentSuggestion + 1));
  elements.submit.addEventListener("click", submitReview);
  elements.closeModal.addEventListener("click", closeModal);
  elements.editReview.addEventListener("click", closeModal);
  elements.openGoogle.addEventListener("click", () => { window.location.assign(config.googleReviewUrl); });

  function selectRating(value) {
    state.rating = value;
    [...elements.ratingControl.children].forEach((button, index) => {
      const active = index < value;
      button.textContent = active ? "★" : "☆";
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-checked", String(index === value - 1));
    });
  }

  function payload() { return { rating: state.rating, liked: state.liked, comment: elements.comment.value.trim() }; }
  function isConfiguredUrl(value) { return typeof value === "string" && /^https:\/\//.test(value) && !value.includes("REPLACE_ME"); }
  function setGenerating(generating) {
    elements.generate.disabled = generating;
    elements.generation.hidden = !generating;
    elements.generate.textContent = generating ? "Writing your draft…" : "Write my draft";
  }

  async function generateReviews(event) {
    event.preventDefault();
    elements.message.textContent = "";
    const data = payload();
    if (!data.rating && data.liked.length === 0 && !data.comment) { elements.message.textContent = "Select a rating, choose a highlight, or write a short note first."; return; }
    if (!isConfiguredUrl(config.apiUrl)) { elements.message.textContent = "The AI service has not been configured yet."; return; }
    setGenerating(true);
    try {
      const response = await fetch(config.apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json().catch(() => ({}));
      const reviews = Array.isArray(body.reviews) ? body.reviews : body.review ? [body.review] : [];
      if (!response.ok || reviews.length === 0) throw new Error(body.error || "We could not create review suggestions right now. Please try again.");
      state.reviews = reviews.slice(0, 4); state.currentSuggestion = 0;
      elements.suggestions.hidden = false;
      elements.editor.hidden = false;
      selectSuggestion(0, false);
      elements.suggestions.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) { elements.message.textContent = error.message || "We could not create review suggestions right now. Please try again."; }
    finally { setGenerating(false); }
  }

  function selectSuggestion(index, shouldCopy = true) {
    if (!state.reviews.length) return;
    state.currentSuggestion = (index + state.reviews.length) % state.reviews.length;
    const review = state.reviews[state.currentSuggestion];
    elements.suggestionCard.textContent = review;
    elements.suggestionCount.textContent = `${state.currentSuggestion + 1} of ${state.reviews.length} suggestions`;
    elements.comment.value = review;
    elements.charCount.textContent = review.length;
    if (shouldCopy) copyToClipboard(review);
  }

  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); showCopyToast(); }
    catch { elements.message.textContent = "Select and copy the review manually before continuing."; }
  }
  function showCopyToast() {
    window.clearTimeout(state.toastTimer);
    elements.copyToast.hidden = false;
    state.toastTimer = window.setTimeout(() => { elements.copyToast.hidden = true; }, 2000);
  }

  async function submitReview() {
    const review = elements.comment.value.trim();
    if (!review) { elements.message.textContent = "Generate or write a review first."; return; }
    if (!isConfiguredUrl(config.googleReviewUrl)) { elements.message.textContent = "The Google review link has not been configured yet."; return; }
    await copyToClipboard(review);
    elements.modal.hidden = false;
    elements.openGoogle.focus();
  }
  function closeModal() { elements.modal.hidden = true; }
})();
