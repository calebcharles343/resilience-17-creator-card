CreateCreatorCardRequest {
  path /creator-cards
  method POST

  body {
    title string<trim|minLength:3|maxLength:100>
    description? string<trim|maxLength:500>
    slug? string<trim|minLength:5|maxLength:50|lowercase> // letters, numbers, hyphens, underscores only
    creator_reference string<trim|length:20>
    links[]? {
      title string<trim|minLength:1|maxLength:100>
      url string<trim|minLength:1|maxLength:200> // must start with http:// or https://
    }
    service_rates? {
      currency string(NGN|USD|GBP|GHS)
      rates[] { // non-empty if service_rates is present
        name string<trim|minLength:3|maxLength:100>
        description? string<trim|maxLength:250>
        amount number<min:1> // positive integer only; no zero, no decimals
      }
    }
    status string(published|draft)
    access_type? string(public|private) // defaults to public when omitted
    access_code? string<length:6> // exactly 6 alphanumeric characters; required if access_type is private; must NOT be set if access_type is public
  }

  response.ok {
    http.code 200
    status success
    message "Creator Card Created Successfully."
    data {
      id string // ULID; serialized as id, never _id
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
      access_code? string // returned in creation response so creator can record it; null for public cards
      created number
      updated number
      deleted number // null at creation time
    }
  }

  response.error {
    http.code 400
    status error
    message "Validation failed"
    code string // SL02 | AC01 | AC05 | VL01 | or validator DSL error code
    data {}
  }
}