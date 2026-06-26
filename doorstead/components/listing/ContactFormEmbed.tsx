const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd_qVi6y03Gplh-93rR-7nMgDS0bV0h5VsYwMRm92quNxi3IQ/viewform?embedded=true'

export function ContactFormEmbed() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      <iframe
        src={GOOGLE_FORM_URL}
        title="Enquire about this property"
        className="block w-full"
        style={{ minHeight: '900px', border: 0 }}
        loading="lazy"
      >
        Loading enquiry form…
      </iframe>
    </div>
  )
}
