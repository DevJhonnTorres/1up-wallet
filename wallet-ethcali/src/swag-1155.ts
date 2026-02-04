import {
  AdminAdded as AdminAddedEvent,
  AdminRemoved as AdminRemovedEvent,
  ApprovalForAll as ApprovalForAllEvent,
  DiscountApplied as DiscountAppliedEvent,
  HolderDiscountAdded as HolderDiscountAddedEvent,
  HolderDiscountRemoved as HolderDiscountRemovedEvent,
  PoapDiscountAdded as PoapDiscountAddedEvent,
  PoapDiscountRemoved as PoapDiscountRemovedEvent,
  Purchased as PurchasedEvent,
  PurchasedBatch as PurchasedBatchEvent,
  RedemptionFulfilled as RedemptionFulfilledEvent,
  RedemptionRequested as RedemptionRequestedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  RoyaltiesCleared as RoyaltiesClearedEvent,
  RoyaltyAdded as RoyaltyAddedEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  TreasuryUpdated as TreasuryUpdatedEvent,
  URI as URIEvent,
  USDCUpdated as USDCUpdatedEvent,
  VariantURISet as VariantURISetEvent,
  VariantUpdated as VariantUpdatedEvent
} from "../generated/Swag1155/Swag1155"
import {
  AdminAdded,
  AdminRemoved,
  ApprovalForAll,
  DiscountApplied,
  HolderDiscountAdded,
  HolderDiscountRemoved,
  PoapDiscountAdded,
  PoapDiscountRemoved,
  Purchased,
  PurchasedBatch,
  RedemptionFulfilled,
  RedemptionRequested,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  RoyaltiesCleared,
  RoyaltyAdded,
  TransferBatch,
  TransferSingle,
  TreasuryUpdated,
  URI,
  USDCUpdated,
  VariantURISet,
  VariantUpdated
} from "../generated/schema"

export function handleAdminAdded(event: AdminAddedEvent): void {
  let entity = new AdminAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAdminRemoved(event: AdminRemovedEvent): void {
  let entity = new AdminRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDiscountApplied(event: DiscountAppliedEvent): void {
  let entity = new DiscountApplied(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.tokenId = event.params.tokenId
  entity.originalPrice = event.params.originalPrice
  entity.finalPrice = event.params.finalPrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHolderDiscountAdded(
  event: HolderDiscountAddedEvent
): void {
  let entity = new HolderDiscountAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.token = event.params.token
  entity.discountType = event.params.discountType
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHolderDiscountRemoved(
  event: HolderDiscountRemovedEvent
): void {
  let entity = new HolderDiscountRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.token = event.params.token

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePoapDiscountAdded(event: PoapDiscountAddedEvent): void {
  let entity = new PoapDiscountAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.eventId = event.params.eventId
  entity.discountBps = event.params.discountBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePoapDiscountRemoved(
  event: PoapDiscountRemovedEvent
): void {
  let entity = new PoapDiscountRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.eventId = event.params.eventId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePurchased(event: PurchasedEvent): void {
  let entity = new Purchased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.tokenId = event.params.tokenId
  entity.quantity = event.params.quantity
  entity.unitPrice = event.params.unitPrice
  entity.totalPrice = event.params.totalPrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePurchasedBatch(event: PurchasedBatchEvent): void {
  let entity = new PurchasedBatch(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.tokenIds = event.params.tokenIds
  entity.quantities = event.params.quantities
  entity.totalPrice = event.params.totalPrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedemptionFulfilled(
  event: RedemptionFulfilledEvent
): void {
  let entity = new RedemptionFulfilled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.tokenId = event.params.tokenId
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedemptionRequested(
  event: RedemptionRequestedEvent
): void {
  let entity = new RedemptionRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoyaltiesCleared(event: RoyaltiesClearedEvent): void {
  let entity = new RoyaltiesCleared(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoyaltyAdded(event: RoyaltyAddedEvent): void {
  let entity = new RoyaltyAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.recipient = event.params.recipient
  entity.percentage = event.params.percentage

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let entity = new TransferBatch(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.ids = event.params.ids
  entity.values = event.params.values

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  let entity = new TransferSingle(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.internal_id = event.params.id
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasuryUpdated(event: TreasuryUpdatedEvent): void {
  let entity = new TreasuryUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newTreasury = event.params.newTreasury

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleURI(event: URIEvent): void {
  let entity = new URI(event.transaction.hash.concatI32(event.logIndex.toI32()))
  entity.value = event.params.value
  entity.internal_id = event.params.id

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUSDCUpdated(event: USDCUpdatedEvent): void {
  let entity = new USDCUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newUSDC = event.params.newUSDC

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVariantURISet(event: VariantURISetEvent): void {
  let entity = new VariantURISet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.uri = event.params.uri

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVariantUpdated(event: VariantUpdatedEvent): void {
  let entity = new VariantUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.maxSupply = event.params.maxSupply
  entity.active = event.params.active

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
