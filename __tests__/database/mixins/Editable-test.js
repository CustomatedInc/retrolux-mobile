// import { Editable } from 'RetroluxMobile/app/database/mixins/Editable';
import { Editable } from './../../database/mixins/Editable';

// ============================================================================
// SETUP
// ============================================================================

class Base {}
class EmptyTargetClass extends Editable(Base) {}

const sampleObjects = [
  { server_id: 1, mobile_id: 2, some_other_el: 'a' },
  { server_id: 2, mobile_id: 3, some_other_el: 'a' },
  { server_id: 3, mobile_id: 4, some_other_el: 'a' },
  { server_id: 4, mobile_id: 5, some_other_el: 'a' },
]

// ============================================================================
// Static
// ============================================================================

describe('serverMobileIdLookup()', () => {
  Object.assign(EmptyTargetClass, { allArray: sampleObjects })

  it("produces the correct object", async () => {
    const lookup = await EmptyTargetClass.serverMobileIdLookup()

    expect(Object.keys(lookup)).toEqual(["1", "2", "3", "4"])
    expect(lookup.hasOwnProperty('1')).toEqual(true)
    expect(lookup.hasOwnProperty('5')).toEqual(false)
    expect(lookup['1']).toEqual(2)
    expect(lookup[1]).toEqual(2)
    expect(lookup[10]).toEqual(undefined)
  })
})

// ============================================================================
// Instance
// ============================================================================

describe('toVitalsObject()', () => {
  const instance = new EmptyTargetClass()

  it("ignores unneeded attributes", () => {
    Object.assign(instance, { mobile_id: 1, server_id: 2, company_id: 3 })

    expect(instance.toVitalsObject()).toEqual({ mobile_id: 1, server_id: 2 })
  })
})

describe('isfullSyncWorthy()', () => {
  const instance = new EmptyTargetClass()

  it("returns true when edited", () => {
    Object.assign(instance, { mobile_id: 1, server_id: 2, edited: true, another_attribute: 12 })
    expect(instance.isfullSyncWorthy()).toBeTruthy()
  })

  it("returns true when new", () => {
    Object.assign(instance, { mobile_id: 1, server_id: null, edited: true, another_attribute: 12 })
    expect(instance.isfullSyncWorthy()).toBeTruthy()
  })

  it("returns false when unedited", () => {
    Object.assign(instance, { mobile_id: 1, server_id: 1, edited: false, another_attribute: 12 })
    expect(instance.isfullSyncWorthy()).toBeFalsy()
  })
})

describe('toSyncableFormat()', () => {
  it("returns full object when edited", () => {
    const instance = new EmptyTargetClass()
    Object.assign(instance, { mobile_id: 1, server_id: 2, edited: true, another_attribute: 12, toPlainObject: function() { return Object.assign({}, this) } })

    expect(instance.toSyncableFormat()).toEqual(instance.toPlainObject())
  })

  it("returns vitals object when not edited or new", () => {
    const instance = new EmptyTargetClass()
    Object.assign(instance, { mobile_id: 1, server_id: 2, edited: false, another_attribute: 12, toPlainObject: function() { return Object.assign({}, this) } })

    expect(instance.isfullSyncWorthy()).toBeFalsy()
    expect(instance.toSyncableFormat()).toEqual({ mobile_id: 1, server_id: 2 })
  })
})

