DeleteCreatorCardRequest {
  path /creator-cards/:slug
  method DELETE

  params {
    slug string<trim|minLength:1|maxLength:50>
  }

  body {
    creator_reference string<trim|length:20> // must match the creator_reference on the card
  }

  response.ok {
    http.code 200
    status success
    message "Creator Card Deleted Successfully."
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
      access_code? string // null for public cards; value present for private cards
      created number
      updated number
      deleted number // Unix epoch milliseconds of deletion; always set on success
    }
  }

  response.error {
    http.code 404
    status error
    message "Creator card not found"
    code string // NF01
    data {}
  }
}