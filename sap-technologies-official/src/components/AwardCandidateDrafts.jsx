import React, { useEffect, useState } from "react";
import apiService from "../services/api";
import { Swal } from "../utils/alerts";
import "../styles/AwardCandidateDrafts.css";

const emptyForm = {
  nomineeName: "",
  nomineeTitle: "",
  nomineeCompany: "",
  nomineeCountry: "",
  category: "",
  rationale: "",
  sourcesText: "",
  photoUrl: "",
  photoSourceUrl: "",
  photoLicense: "",
  photoAttribution: "",
  photoReuseConfirmed: false,
  eligibilityVerified: false,
  consentConfirmed: false
};

const readSources = (text) => text
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const separator = line.indexOf("|");
    if (separator < 0) return { label: line, url: line };
    return {
      label: line.slice(0, separator).trim(),
      url: line.slice(separator + 1).trim()
    };
  });

const writeSources = (sources = []) => sources
  .map(({ label, url }) => `${label} | ${url}`)
  .join("\n");

const toForm = (draft) => ({
  nomineeName: draft.nomineeName || "",
  nomineeTitle: draft.nomineeTitle || "",
  nomineeCompany: draft.nomineeCompany || "",
  nomineeCountry: draft.nomineeCountry || "",
  category: draft.category?._id || draft.category || "",
  rationale: draft.rationale || "",
  sourcesText: writeSources(draft.sources),
  photoUrl: draft.photoUrl || "",
  photoSourceUrl: draft.photoSourceUrl || "",
  photoLicense: draft.photoLicense || "",
  photoAttribution: draft.photoAttribution || "",
  photoReuseConfirmed: Boolean(draft.photoReuseConfirmed),
  eligibilityVerified: Boolean(draft.eligibilityVerified),
  consentConfirmed: Boolean(draft.consentConfirmed)
});

const AwardCandidateDrafts = ({ categories }) => {
  const [drafts, setDrafts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDrafts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiService.getAwardCandidateDrafts();
      setDrafts(response.data?.drafts || []);
    } catch (loadError) {
      console.error("Failed to load award candidate drafts:", loadError);
      setError(loadError.message || "Could not load candidate drafts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (draft) => {
    setForm(toForm(draft));
    setEditingId(draft._id);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const sources = readSources(form.sourcesText);
    if (!sources.length || sources.some(({ label, url }) => !label || !url)) {
      setError("Add at least one source using: Source name | https://example.com");
      setSaving(false);
      return;
    }

    if (form.photoUrl && (!form.photoSourceUrl || !form.photoLicense || !form.photoAttribution)) {
      setError("A photo needs its source, reuse license, and attribution.");
      setSaving(false);
      return;
    }

    const payload = {
      nomineeName: form.nomineeName.trim(),
      nomineeTitle: form.nomineeTitle.trim(),
      nomineeCompany: form.nomineeCompany.trim(),
      nomineeCountry: form.nomineeCountry.trim(),
      category: form.category,
      rationale: form.rationale.trim(),
      sources,
      photoUrl: form.photoUrl.trim(),
      photoSourceUrl: form.photoSourceUrl.trim(),
      photoLicense: form.photoLicense.trim(),
      photoAttribution: form.photoAttribution.trim(),
      photoReuseConfirmed: form.photoReuseConfirmed,
      eligibilityVerified: form.eligibilityVerified,
      consentConfirmed: form.consentConfirmed
    };

    try {
      if (editingId) {
        await apiService.updateAwardCandidateDraft(editingId, payload);
      } else {
        await apiService.createAwardCandidateDraft(payload);
      }
      closeForm();
      await loadDrafts();
    } catch (saveError) {
      console.error("Failed to save award candidate draft:", saveError);
      setError(saveError.response?.data?.message || saveError.message || "Could not save this draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (draft) => {
    const result = await Swal.fire({
      title: "Delete candidate draft?",
      text: `${draft.nomineeName} will be removed from the private shortlist.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete draft",
      confirmButtonColor: "#dc2626"
    });
    if (!result.isConfirmed) return;

    try {
      await apiService.deleteAwardCandidateDraft(draft._id);
      await loadDrafts();
    } catch (deleteError) {
      console.error("Failed to delete award candidate draft:", deleteError);
      setError(deleteError.response?.data?.message || deleteError.message || "Could not delete this draft.");
    }
  };

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <section className="candidate-drafts">
      <header className="candidate-drafts-header">
        <div>
          <h3>Private Candidate Shortlist</h3>
          <p>Research drafts only. They are separate from submitted nominations and are never shown publicly.</p>
        </div>
        <button type="button" className="create-btn" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
          Add Candidate Draft
        </button>
      </header>

      {error && <div className="candidate-drafts-error" role="alert">{error}</div>}

      {showForm && (
        <form className="candidate-draft-form" onSubmit={handleSubmit}>
          <h4>{editingId ? "Edit candidate draft" : "New candidate draft"}</h4>
          <div className="candidate-draft-fields">
            <label>
              Candidate name *
              <input name="nomineeName" value={form.nomineeName} onChange={updateField} required maxLength={100} />
            </label>
            <label>
              Country *
              <input name="nomineeCountry" value={form.nomineeCountry} onChange={updateField} required maxLength={100} />
            </label>
            <label>
              Award category *
              <select name="category" value={form.category} onChange={updateField} required>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              Title or role
              <input name="nomineeTitle" value={form.nomineeTitle} onChange={updateField} maxLength={150} />
            </label>
            <label>
              Organization
              <input name="nomineeCompany" value={form.nomineeCompany} onChange={updateField} maxLength={100} />
            </label>
            <label className="candidate-draft-wide">
              Why this candidate fits *
              <textarea name="rationale" value={form.rationale} onChange={updateField} required maxLength={1500} rows={4} />
            </label>
            <label className="candidate-draft-wide">
              Evidence sources * (one per line: Source name | https://...)
              <textarea name="sourcesText" value={form.sourcesText} onChange={updateField} required rows={4} placeholder="Official biography | https://example.org/profile" />
            </label>
            <label>
              Photo URL (optional)
              <input name="photoUrl" type="url" value={form.photoUrl} onChange={updateField} />
            </label>
            <label>
              Photo source URL
              <input name="photoSourceUrl" type="url" value={form.photoSourceUrl} onChange={updateField} />
            </label>
            <label>
              Reuse license
              <input name="photoLicense" value={form.photoLicense} onChange={updateField} maxLength={200} placeholder="e.g. CC BY 4.0" />
            </label>
            <label>
              Required attribution
              <input name="photoAttribution" value={form.photoAttribution} onChange={updateField} maxLength={300} />
            </label>
          </div>

          <div className="candidate-draft-checks">
            <label><input name="eligibilityVerified" type="checkbox" checked={form.eligibilityVerified} onChange={updateField} /> Eligibility checked</label>
            <label><input name="consentConfirmed" type="checkbox" checked={form.consentConfirmed} onChange={updateField} /> Permission to nominate confirmed</label>
            <label><input name="photoReuseConfirmed" type="checkbox" checked={form.photoReuseConfirmed} onChange={updateField} /> Photo reuse rights confirmed</label>
          </div>
          <div className="candidate-draft-actions">
            <button type="button" className="candidate-draft-cancel" onClick={closeForm}>Cancel</button>
            <button type="submit" className="create-btn" disabled={saving}>{saving ? "Saving..." : "Save private draft"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-state">Loading candidate drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="empty-state"><p>No candidate drafts yet.</p><p>Only add candidates after recording evidence and checking eligibility.</p></div>
      ) : (
        <div className="candidate-drafts-grid">
          {drafts.map((draft) => (
            <article className="candidate-draft-card" key={draft._id}>
              {draft.photoUrl && draft.photoReuseConfirmed ? (
                <img className="candidate-draft-photo" src={draft.photoUrl} alt="" loading="lazy" />
              ) : (
                <div className="candidate-draft-photo-placeholder" aria-hidden="true">Photo rights not confirmed</div>
              )}
              <div className="candidate-draft-content">
                <span className="candidate-draft-category">{draft.category?.name || "Category unavailable"}</span>
                <h4>{draft.nomineeName}</h4>
                <p className="candidate-draft-meta">{[draft.nomineeTitle, draft.nomineeCompany, draft.nomineeCountry].filter(Boolean).join(" · ")}</p>
                <p>{draft.rationale}</p>
                <div className="candidate-draft-source-list">
                  {draft.sources?.map((source) => (
                    <a key={`${source.url}-${source.label}`} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                  ))}
                </div>
                {draft.photoUrl && (
                  <p className="candidate-draft-photo-note">
                    Photo: {draft.photoReuseConfirmed ? draft.photoAttribution : "reuse rights still need confirmation"}
                    {draft.photoSourceUrl && <> · <a href={draft.photoSourceUrl} target="_blank" rel="noreferrer">source and license</a></>}
                  </p>
                )}
                <div className="candidate-draft-badges">
                  <span>{draft.eligibilityVerified ? "Eligibility checked" : "Eligibility to verify"}</span>
                  <span>{draft.consentConfirmed ? "Permission confirmed" : "Permission to confirm"}</span>
                </div>
                <div className="candidate-draft-actions">
                  <button type="button" onClick={() => handleEdit(draft)}>Edit</button>
                  <button type="button" className="candidate-draft-delete" onClick={() => handleDelete(draft)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AwardCandidateDrafts;
