import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
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
} from "../generated/swag/swag"

export function createAdminAddedEvent(admin: Address): AdminAdded {
  let adminAddedEvent = changetype<AdminAdded>(newMockEvent())

  adminAddedEvent.parameters = new Array()

  adminAddedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return adminAddedEvent
}

export function createAdminRemovedEvent(admin: Address): AdminRemoved {
  let adminRemovedEvent = changetype<AdminRemoved>(newMockEvent())

  adminRemovedEvent.parameters = new Array()

  adminRemovedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return adminRemovedEvent
}

export function createApprovalForAllEvent(
  account: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createDiscountAppliedEvent(
  buyer: Address,
  tokenId: BigInt,
  originalPrice: BigInt,
  finalPrice: BigInt
): DiscountApplied {
  let discountAppliedEvent = changetype<DiscountApplied>(newMockEvent())

  discountAppliedEvent.parameters = new Array()

  discountAppliedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  discountAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  discountAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "originalPrice",
      ethereum.Value.fromUnsignedBigInt(originalPrice)
    )
  )
  discountAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "finalPrice",
      ethereum.Value.fromUnsignedBigInt(finalPrice)
    )
  )

  return discountAppliedEvent
}

export function createHolderDiscountAddedEvent(
  tokenId: BigInt,
  token: Address,
  discountType: i32,
  value: BigInt
): HolderDiscountAdded {
  let holderDiscountAddedEvent = changetype<HolderDiscountAdded>(newMockEvent())

  holderDiscountAddedEvent.parameters = new Array()

  holderDiscountAddedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  holderDiscountAddedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  holderDiscountAddedEvent.parameters.push(
    new ethereum.EventParam(
      "discountType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(discountType))
    )
  )
  holderDiscountAddedEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return holderDiscountAddedEvent
}

export function createHolderDiscountRemovedEvent(
  tokenId: BigInt,
  token: Address
): HolderDiscountRemoved {
  let holderDiscountRemovedEvent =
    changetype<HolderDiscountRemoved>(newMockEvent())

  holderDiscountRemovedEvent.parameters = new Array()

  holderDiscountRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  holderDiscountRemovedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )

  return holderDiscountRemovedEvent
}

export function createPoapDiscountAddedEvent(
  tokenId: BigInt,
  eventId: BigInt,
  discountBps: BigInt
): PoapDiscountAdded {
  let poapDiscountAddedEvent = changetype<PoapDiscountAdded>(newMockEvent())

  poapDiscountAddedEvent.parameters = new Array()

  poapDiscountAddedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  poapDiscountAddedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  poapDiscountAddedEvent.parameters.push(
    new ethereum.EventParam(
      "discountBps",
      ethereum.Value.fromUnsignedBigInt(discountBps)
    )
  )

  return poapDiscountAddedEvent
}

export function createPoapDiscountRemovedEvent(
  tokenId: BigInt,
  eventId: BigInt
): PoapDiscountRemoved {
  let poapDiscountRemovedEvent = changetype<PoapDiscountRemoved>(newMockEvent())

  poapDiscountRemovedEvent.parameters = new Array()

  poapDiscountRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  poapDiscountRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )

  return poapDiscountRemovedEvent
}

export function createPurchasedEvent(
  buyer: Address,
  tokenId: BigInt,
  quantity: BigInt,
  unitPrice: BigInt,
  totalPrice: BigInt
): Purchased {
  let purchasedEvent = changetype<Purchased>(newMockEvent())

  purchasedEvent.parameters = new Array()

  purchasedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam(
      "quantity",
      ethereum.Value.fromUnsignedBigInt(quantity)
    )
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam(
      "unitPrice",
      ethereum.Value.fromUnsignedBigInt(unitPrice)
    )
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam(
      "totalPrice",
      ethereum.Value.fromUnsignedBigInt(totalPrice)
    )
  )

  return purchasedEvent
}

export function createPurchasedBatchEvent(
  buyer: Address,
  tokenIds: Array<BigInt>,
  quantities: Array<BigInt>,
  totalPrice: BigInt
): PurchasedBatch {
  let purchasedBatchEvent = changetype<PurchasedBatch>(newMockEvent())

  purchasedBatchEvent.parameters = new Array()

  purchasedBatchEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  purchasedBatchEvent.parameters.push(
    new ethereum.EventParam(
      "tokenIds",
      ethereum.Value.fromUnsignedBigIntArray(tokenIds)
    )
  )
  purchasedBatchEvent.parameters.push(
    new ethereum.EventParam(
      "quantities",
      ethereum.Value.fromUnsignedBigIntArray(quantities)
    )
  )
  purchasedBatchEvent.parameters.push(
    new ethereum.EventParam(
      "totalPrice",
      ethereum.Value.fromUnsignedBigInt(totalPrice)
    )
  )

  return purchasedBatchEvent
}

export function createRedemptionFulfilledEvent(
  owner: Address,
  tokenId: BigInt,
  admin: Address
): RedemptionFulfilled {
  let redemptionFulfilledEvent = changetype<RedemptionFulfilled>(newMockEvent())

  redemptionFulfilledEvent.parameters = new Array()

  redemptionFulfilledEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  redemptionFulfilledEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  redemptionFulfilledEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return redemptionFulfilledEvent
}

export function createRedemptionRequestedEvent(
  owner: Address,
  tokenId: BigInt
): RedemptionRequested {
  let redemptionRequestedEvent = changetype<RedemptionRequested>(newMockEvent())

  redemptionRequestedEvent.parameters = new Array()

  redemptionRequestedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  redemptionRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return redemptionRequestedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createRoyaltiesClearedEvent(tokenId: BigInt): RoyaltiesCleared {
  let royaltiesClearedEvent = changetype<RoyaltiesCleared>(newMockEvent())

  royaltiesClearedEvent.parameters = new Array()

  royaltiesClearedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return royaltiesClearedEvent
}

export function createRoyaltyAddedEvent(
  tokenId: BigInt,
  recipient: Address,
  percentage: BigInt
): RoyaltyAdded {
  let royaltyAddedEvent = changetype<RoyaltyAdded>(newMockEvent())

  royaltyAddedEvent.parameters = new Array()

  royaltyAddedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  royaltyAddedEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  royaltyAddedEvent.parameters.push(
    new ethereum.EventParam(
      "percentage",
      ethereum.Value.fromUnsignedBigInt(percentage)
    )
  )

  return royaltyAddedEvent
}

export function createTransferBatchEvent(
  operator: Address,
  from: Address,
  to: Address,
  ids: Array<BigInt>,
  values: Array<BigInt>
): TransferBatch {
  let transferBatchEvent = changetype<TransferBatch>(newMockEvent())

  transferBatchEvent.parameters = new Array()

  transferBatchEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("ids", ethereum.Value.fromUnsignedBigIntArray(ids))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam(
      "values",
      ethereum.Value.fromUnsignedBigIntArray(values)
    )
  )

  return transferBatchEvent
}

export function createTransferSingleEvent(
  operator: Address,
  from: Address,
  to: Address,
  id: BigInt,
  value: BigInt
): TransferSingle {
  let transferSingleEvent = changetype<TransferSingle>(newMockEvent())

  transferSingleEvent.parameters = new Array()

  transferSingleEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferSingleEvent
}

export function createTreasuryUpdatedEvent(
  newTreasury: Address
): TreasuryUpdated {
  let treasuryUpdatedEvent = changetype<TreasuryUpdated>(newMockEvent())

  treasuryUpdatedEvent.parameters = new Array()

  treasuryUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newTreasury",
      ethereum.Value.fromAddress(newTreasury)
    )
  )

  return treasuryUpdatedEvent
}

export function createURIEvent(value: string, id: BigInt): URI {
  let uriEvent = changetype<URI>(newMockEvent())

  uriEvent.parameters = new Array()

  uriEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromString(value))
  )
  uriEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return uriEvent
}

export function createUSDCUpdatedEvent(newUSDC: Address): USDCUpdated {
  let usdcUpdatedEvent = changetype<USDCUpdated>(newMockEvent())

  usdcUpdatedEvent.parameters = new Array()

  usdcUpdatedEvent.parameters.push(
    new ethereum.EventParam("newUSDC", ethereum.Value.fromAddress(newUSDC))
  )

  return usdcUpdatedEvent
}

export function createVariantURISetEvent(
  tokenId: BigInt,
  uri: string
): VariantURISet {
  let variantUriSetEvent = changetype<VariantURISet>(newMockEvent())

  variantUriSetEvent.parameters = new Array()

  variantUriSetEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  variantUriSetEvent.parameters.push(
    new ethereum.EventParam("uri", ethereum.Value.fromString(uri))
  )

  return variantUriSetEvent
}

export function createVariantUpdatedEvent(
  tokenId: BigInt,
  price: BigInt,
  maxSupply: BigInt,
  active: boolean
): VariantUpdated {
  let variantUpdatedEvent = changetype<VariantUpdated>(newMockEvent())

  variantUpdatedEvent.parameters = new Array()

  variantUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  variantUpdatedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  variantUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxSupply",
      ethereum.Value.fromUnsignedBigInt(maxSupply)
    )
  )
  variantUpdatedEvent.parameters.push(
    new ethereum.EventParam("active", ethereum.Value.fromBoolean(active))
  )

  return variantUpdatedEvent
}
