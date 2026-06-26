export interface Inquiry {
  id: string
  listingId: string
  name: string
  email: string
  phone: string
  createdAt: string
}

export interface InquiryWithListing extends Inquiry {
  listingAddress: string | null
}

export interface InquiryInput {
  listingId: string
  name: string
  email: string
  phone: string
}

export interface InquiryService {
  create(input: InquiryInput): Promise<void>
  listAll(): Promise<InquiryWithListing[]>
}
