CreatorCard {
  _id string<isUnique|indexed> // Unique identifier (ULID)
  title string<indexed> // Display name of the creator card (3-100 characters)
  description? string // Optional description of the creator (max 500 characters)
  slug string<isUnique|indexed> // URL-friendly identifier; letters, numbers, hyphens, underscores; 5-50 chars
  creator_reference string<indexed> // External reference ID of the card owner (exactly 20 characters)
  links[]? { // Optional list of external links
    title string // Link display text (1-100 characters)
    url string // Link destination URL; must start with http:// or https:// (max 200 characters)
  }
  service_rates? { // Optional service pricing information
    currency string // Currency code; enum: NGN, USD, GBP, GHS
    rates[] { // List of service rate entries; non-empty if service_rates is present
      name string // Name of the service (3-100 characters)
      description? string // Optional description of the service (max 250 characters)
      amount number // Price in minor units; positive integer (min 1, no zero, no decimals)
    }
  }
  status string<indexed> // Card visibility status: published, draft
  access_type string // Access control type: public, private; defaults to public
  access_code? string // Required when access_type is private; exactly 6 alphanumeric characters
  created number // Unix epoch milliseconds of creation
  updated number // Unix epoch milliseconds of last update
  deleted? number // Unix epoch milliseconds of soft deletion (null unless deleted)
}