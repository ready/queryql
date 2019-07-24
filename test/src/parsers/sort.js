const SortParser = require('../../../src/parsers/sort')
const Schema = require('../../../src/schema')
const ValidationError = require('../../../src/errors/validation')

describe('DEFAULTS', () => {
  test('returns `null` as the default field', () => {
    expect(SortParser.DEFAULTS.field).toBeNull()
  })

  test('returns `asc` as the default order', () => {
    expect(SortParser.DEFAULTS.order).toBe('asc')
  })
})

describe('buildKey', () => {
  test('builds/returns a string to use as a key', () => {
    const key = SortParser.buildKey({
      field: 'test',
      order: 'asc',
    })

    expect(key).toBe('test')
  })
})

describe('validation', () => {
  describe('`sort=field`', () => {
    test('throws if the field is not whitelisted in the schema', () => {
      const parser = new SortParser('sort', 'invalid', new Schema())

      expect(() => parser.validate()).toThrow(
        new ValidationError('sort must be one of []')
      )
    })
  })

  describe('`sort[]=field`', () => {
    test('throws if the field is not whitelisted in the schema', () => {
      const parser = new SortParser('sort', ['invalid'], new Schema())

      expect(() => parser.validate()).toThrow(
        new ValidationError('sort:0 must be one of []')
      )
    })

    test('throws if the field appears more than once', () => {
      const parser = new SortParser(
        'sort',
        ['invalid', 'invalid'],
        new Schema().sort('invalid')
      )

      expect(() => parser.validate()).toThrow(
        new ValidationError('sort:1 position 1 contains a duplicate value')
      )
    })
  })

  describe('`sort[field]=order`', () => {
    test('throws if the field is not whitelisted in the schema', () => {
      const parser = new SortParser('sort', { invalid: 'asc' }, new Schema())

      expect(() => parser.validate()).toThrow(
        new ValidationError('sort:invalid is not allowed')
      )
    })

    test('throws if the order is not `asc` or `desc`', () => {
      const parser = new SortParser(
        'sort',
        { invalid: 'test' },
        new Schema().sort('invalid')
      )

      expect(() => parser.validate()).toThrow(
        new ValidationError('sort:invalid must be one of [asc, desc]')
      )
    })

    test('permits case-insensitive `asc` or `desc` order', () => {
      const parser = new SortParser(
        'sort',
        { valid: 'ASC' },
        new Schema().sort('valid')
      )

      expect(() => parser.validate()).not.toThrow()
    })
  })
})

describe('parse', () => {
  test('`sort=field`', () => {
    const parser = new SortParser('sort', 'test', new Schema().sort('test'))

    expect(parser.parse().get('test')).toEqual({
      field: 'test',
      order: 'asc',
    })
  })

  test('`sort[]=field` with one field', () => {
    const parser = new SortParser('sort', ['test'], new Schema().sort('test'))

    expect(parser.parse().get('test')).toEqual({
      field: 'test',
      order: 'asc',
    })
  })

  test('`sort[]=field` with multiple fields', () => {
    const parser = new SortParser(
      'sort',
      ['test1', 'test2'],
      new Schema().sort('test1').sort('test2')
    )

    const parsed = parser.parse()

    expect(parsed.get('test1')).toEqual({
      field: 'test1',
      order: 'asc',
    })

    expect(parsed.get('test2')).toEqual({
      field: 'test2',
      order: 'asc',
    })
  })

  test('`sort[field]=order` with one field', () => {
    const parser = new SortParser(
      'sort',
      { test: 'desc' },
      new Schema().sort('test')
    )

    expect(parser.parse().get('test')).toEqual({
      field: 'test',
      order: 'desc',
    })
  })

  test('`sort[field]=order` with multiple fields', () => {
    const parser = new SortParser(
      'sort',
      {
        test1: 'desc',
        test2: 'asc',
      },
      new Schema().sort('test1').sort('test2')
    )

    const parsed = parser.parse()

    expect(parsed.get('test1')).toEqual({
      field: 'test1',
      order: 'desc',
    })

    expect(parsed.get('test2')).toEqual({
      field: 'test2',
      order: 'asc',
    })
  })

  test('returns an empty `Map` if no query', () => {
    const parser = new SortParser('sort', undefined, new Schema())

    expect(parser.parse().size).toBe(0)
  })

  test('throws `ValidationError` if invalid', () => {
    const parser = new SortParser('sort', 'invalid', new Schema())

    expect(() => parser.parse()).toThrow(
      new ValidationError('sort must be one of []')
    )
  })
})
