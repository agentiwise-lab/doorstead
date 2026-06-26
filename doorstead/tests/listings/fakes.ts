import type {
  Listing,
  ListingInput,
  ListingService,
  ListingStatus,
} from '@/lib/listings/contract'

export type CreateCall = { input: ListingInput; status: ListingStatus }
export type UpdateCall = {
  id: string
  input: ListingInput
  status: ListingStatus
}

export class FakeListingService implements ListingService {
  createCalls: CreateCall[] = []
  updateCalls: UpdateCall[] = []
  updateImpl: (
    id: string,
    input: ListingInput,
    status: ListingStatus,
  ) => Promise<Listing | null> = async (id, input, status) => ({
    id,
    address: input.address,
    type: input.type,
    priceGbp: input.priceGbp,
    beds: input.beds,
    baths: input.baths,
    areaSqft: input.areaSqft,
    status,
    description: input.description,
    photoUrls: input.photoUrls,
    createdAt: '2026-06-26T00:00:00Z',
    updatedAt: '2026-06-26T00:00:00Z',
  })
  createImpl: (input: ListingInput, status: ListingStatus) => Promise<Listing> =
    async (input, status) => ({
      id: '00000000-0000-0000-0000-000000000001',
      address: input.address,
      type: input.type,
      priceGbp: input.priceGbp,
      beds: input.beds,
      baths: input.baths,
      areaSqft: input.areaSqft,
      status,
      description: input.description,
      photoUrls: input.photoUrls,
      createdAt: '2026-06-26T00:00:00Z',
      updatedAt: '2026-06-26T00:00:00Z',
    })

  async listLive(): Promise<Listing[]> {
    throw new Error('FakeListingService.listLive not stubbed')
  }
  async listAll(): Promise<Listing[]> {
    throw new Error('FakeListingService.listAll not stubbed')
  }
  async getById(_id: string): Promise<Listing | null> {
    throw new Error('FakeListingService.getById not stubbed')
  }
  async create(input: ListingInput, status: ListingStatus): Promise<Listing> {
    this.createCalls.push({ input, status })
    return this.createImpl(input, status)
  }
  async update(
    id: string,
    input: ListingInput,
    status: ListingStatus,
  ): Promise<Listing | null> {
    this.updateCalls.push({ id, input, status })
    return this.updateImpl(id, input, status)
  }
  async setStatus(
    _id: string,
    _status: ListingStatus,
  ): Promise<Listing | null> {
    throw new Error('FakeListingService.setStatus not stubbed')
  }
  async delete(_id: string): Promise<void> {
    throw new Error('FakeListingService.delete not stubbed')
  }
}
