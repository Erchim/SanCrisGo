import Link from "next/link";
import { savePlace } from "@/app/admin/places/actions";
import {
  PLACE_TYPES,
  type AdminPlaceRow,
} from "@/lib/places/admin-places";

function dateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function placeTypeLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PlaceForm({
  place,
  status,
  error,
}: {
  place: AdminPlaceRow | null;
  status?: string;
  error?: string;
}) {
  return (
    <article className="admin-page admin-editor">
      <Link className="back-link" href="/admin/places">← Places</Link>
      <header className="admin-editor-heading">
        <div>
          <p className="eyebrow">Structured local information</p>
          <h1>{place ? place.name : "New Place"}</h1>
        </div>
        {place?.publication_status === "published" && (
          <Link href={`/places/${place.slug}`} target="_blank">View public page ↗</Link>
        )}
      </header>

      {status === "saved" && <p className="admin-success">Place saved.</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}

      <form action={savePlace} className="admin-form admin-place-form">
        {place && <input name="place_id" type="hidden" value={place.id} />}

        <fieldset>
          <legend>Identity and publication</legend>
          <label className="admin-field-wide">
            Name
            <input name="name" defaultValue={place?.name ?? ""} required />
          </label>
          <label>
            Place type
            <select name="place_type" defaultValue={place?.place_type ?? "other"}>
              {PLACE_TYPES.map((type) => (
                <option key={type} value={type}>{placeTypeLabel(type)}</option>
              ))}
            </select>
          </label>
          <label>
            Publication status
            <select name="publication_status" defaultValue={place?.publication_status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <small>Publishing requires useful content and location context.</small>
          </label>
          <label className="admin-field-wide">
            URL slug
            <input name="slug" defaultValue={place?.slug ?? ""} placeholder="Generated from the name" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Public content</legend>
          <label className="admin-field-wide">
            Summary
            <textarea name="summary" rows={3} defaultValue={place?.summary ?? ""} />
          </label>
          <label className="admin-field-wide">
            Description
            <textarea name="description" rows={10} defaultValue={place?.description ?? ""} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Location</legend>
          <label>
            Address
            <input name="address" defaultValue={place?.address ?? ""} />
          </label>
          <label>
            Neighborhood
            <input name="neighborhood" defaultValue={place?.neighborhood ?? ""} />
          </label>
          <label>
            Latitude
            <input name="latitude" type="number" step="any" defaultValue={place?.latitude ?? ""} />
          </label>
          <label>
            Longitude
            <input name="longitude" type="number" step="any" defaultValue={place?.longitude ?? ""} />
          </label>
          <label className="admin-field-wide">
            Google Maps URL
            <input name="google_maps_url" type="url" defaultValue={place?.google_maps_url ?? ""} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Contact and official links</legend>
          <label>
            Phone
            <input name="phone" inputMode="tel" defaultValue={place?.phone ?? ""} />
          </label>
          <label>
            WhatsApp
            <input name="whatsapp" inputMode="tel" defaultValue={place?.whatsapp ?? ""} />
          </label>
          <label>
            Website
            <input name="website_url" type="url" defaultValue={place?.website_url ?? ""} />
          </label>
          <label>
            Instagram
            <input name="instagram_url" type="url" defaultValue={place?.instagram_url ?? ""} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Verification and SEO</legend>
          <label>
            Source URL
            <input name="source_url" type="url" defaultValue={place?.source_url ?? ""} />
          </label>
          <label>
            Last verified
            <input name="last_verified_at" type="date" defaultValue={dateInput(place?.last_verified_at)} />
          </label>
          <label>
            Source language
            <select name="source_language" defaultValue={place?.source_language ?? "en"}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </label>
          <label className="admin-field-wide">
            SEO title
            <input name="seo_title" defaultValue={place?.seo_title ?? ""} />
          </label>
          <label className="admin-field-wide">
            SEO description
            <textarea name="seo_description" rows={3} defaultValue={place?.seo_description ?? ""} />
          </label>
        </fieldset>

        <div className="admin-publish-actions">
          <button type="submit">Save Place</button>
        </div>
      </form>
    </article>
  );
}
