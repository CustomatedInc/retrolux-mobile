jest.mock('RetroluxMobile/app/database/realm', () => {});

// import { ExistingCategoryTreeEntry } from 'RetroluxMobile/app/database/models/ExistingCategoryTreeEntry';
import { ExistingCategoryTreeEntry } from './../models/ExistingCategoryTreeEntry';

describe('productFilter', () => {
  entry = new ExistingCategoryTreeEntry();

  test('translates JSON objects to realm filtered format', () => {
    entry.product_query = JSON.stringify({ category_id: 1, product_type_id: 2 });
    expect(entry.productFilter).toBe("category_id = 1 AND product_type_id = 2");
  })

  test('works with a single query', () => {
    entry.product_query = JSON.stringify({ category_id: 1 });
    expect(entry.productFilter).toBe("category_id = 1");
  })
})
