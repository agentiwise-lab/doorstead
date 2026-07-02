import type {
  InquiryInput,
  InquiryService,
  InquiryWithListing,
} from '@/lib/inquiries/contract'

export class FakeInquiryService implements InquiryService {
  createCalls: InquiryInput[] = []
  createImpl: (input: InquiryInput) => Promise<void> = async () => {}
  listAllImpl: () => Promise<InquiryWithListing[]> = async () => []
  listForBuyerCalls: string[] = []
  listForBuyerImpl: (email: string) => Promise<InquiryWithListing[]> =
    async () => []

  async create(input: InquiryInput): Promise<void> {
    this.createCalls.push(input)
    return this.createImpl(input)
  }

  async listAll(): Promise<InquiryWithListing[]> {
    return this.listAllImpl()
  }

  async listForBuyer(email: string): Promise<InquiryWithListing[]> {
    this.listForBuyerCalls.push(email)
    return this.listForBuyerImpl(email)
  }
}
