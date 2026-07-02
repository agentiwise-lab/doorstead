import type {
  AdminImage,
  Listing,
  ListingInput,
  ListingService,
  ListingStatus,
  MediaContext,
  RenderImage,
} from '@/lib/listings/contract'

export type CreateCall = { input: ListingInput; status: ListingStatus }
export type UpdateCall = {
  id: string
  input: ListingInput
  status: ListingStatus
}
export type SetStatusCall = { id: string; status: ListingStatus }

export class FakeListingService implements ListingService {
  createCalls: CreateCall[] = []
  updateCalls: UpdateCall[] = []
  setStatusCalls: SetStatusCall[] = []
  deleteCalls: string[] = []
  getByIdImpl: (id: string) => Promise<Listing | null> = async () => null
  getImagesForRenderImpl: (
    id: string,
    context: MediaContext,
  ) => Promise<RenderImage[]> = async () => []
  getAdminImagesImpl: (id: string) => Promise<AdminImage[]> = async () => []
  setStatusImpl: (
    id: string,
    status: ListingStatus,
  ) => Promise<Listing | null> = async (id, status) => ({
    id,
    address: '12 Baker Street',
    type: 'House',
    priceGbp: 500000,
    beds: 3,
    baths: 2,
    areaSqft: 1200,
    status,
    description: 'A lovely home.',
    photoUrls: ['https://example.com/x.jpg'],
    createdAt: '2026-06-26T00:00:00Z',
    updatedAt: '2026-06-26T00:00:00Z',
  })
  deleteImpl: (id: string) => Promise<void> = async () => {}
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
  async getById(id: string): Promise<Listing | null> {
    return this.getByIdImpl(id)
  }
  async getImagesForRender(
    id: string,
    context: MediaContext,
  ): Promise<RenderImage[]> {
    return this.getImagesForRenderImpl(id, context)
  }
  async getAdminImages(id: string): Promise<AdminImage[]> {
    return this.getAdminImagesImpl(id)
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
    id: string,
    status: ListingStatus,
  ): Promise<Listing | null> {
    this.setStatusCalls.push({ id, status })
    return this.setStatusImpl(id, status)
  }
  async delete(id: string): Promise<void> {
    this.deleteCalls.push(id)
    return this.deleteImpl(id)
  }
}
