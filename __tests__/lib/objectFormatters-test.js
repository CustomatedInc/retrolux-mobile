import { apiToRealmGeneral, apiToRealmBasic, addDate } from '../../app/lib/objectFormatters';

describe('apiToRealmGeneral()', () => {
  test('returns a correctly formatted object', () => {
    const model = { id: 1, created_at: '2018-12-01', updated_at: null }
    const expected = { server_id: 1, edited: false, updated_at: null, created_at: new Date('2018-12-01') }

    expect(apiToRealmGeneral(model)).toEqual(expected)
  })
})

describe('apiToRealmBasic()', () => {
  test('returns a correctly formatted object', () => {
    const model = { id: 1  }
    const expected = { server_id: 1, edited: false }

    expect(apiToRealmBasic(model)).toEqual(expected)
  })
})

describe('parseDate()', () => {
  test('doesnt attempt to parse null dates', () => {
    const model = { created_at: null }
    expect(addDate(model, 'created_at')).toEqual({ created_at: null })
  })

  test('parses date strings', () => {
    const model = { created_at: '2018-12-01' }
    expect(addDate(model, 'created_at')).toEqual({ created_at: new Date('2018-12-01') })
  })

  test('doesnt add keys that arent in the original object', () => {
    const model = { server_id: 1 }
    expect(addDate(model, 'created_at')).toEqual({ server_id: 1 })
  })
})
