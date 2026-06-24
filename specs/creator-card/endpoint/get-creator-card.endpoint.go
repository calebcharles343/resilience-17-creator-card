GetPublicCreatorCardRequest {
  path /creator-cards/:slug
  method GET

  params {
    slug string<trim|minLength:1|maxLength:50>
  }

  query {
    access_code? string<trim> // Required for private cards; omit for public cards
  }

  // Access rules applied in this order:
  // 1. No card with slug → HTTP 404, NF01
  // 2. Card exists but status is draft → HTTP 404, NF02
  // 3. Card is private and no access_code supplied → HTTP 403, AC03
  // 4. Card is private and access_code does not match → HTTP 403, AC04
  // 5. Otherwise → HTTP 200 with card data

  response.ok {
    http.code 200
    status success
    message "Creator Card Retrieved Successfully."
    data {
      id string
      title string
      description? string
      slug string
      creator_reference string
      links[] {
        title string
        url string
      }
      service_rates? {
        currency string
        rates[] {
          name string
          description? string
          amount number
        }
      }
      status string
      access_type string
      // access_code intentionally omitted from retrieval response - even for private cards with correct pin
      created number
      updated number
      deleted number // null; soft-deleted cards are never returned (treated as NF01)
    }
  }

  response.error {
    http.code 404 | 403
    status error
    message "Creator card not found" | "This card is private. An access code is required" | "Invalid access code"
    code string // NF01 | NF02 | AC03 | AC04
    data {}
  }
}