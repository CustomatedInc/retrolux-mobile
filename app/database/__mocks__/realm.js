const mock = jest.fn().mockImplementation(() => {
  return {
    write: jest.fn(realmFunction => realmFunction()),
    create: jest.fn(),
    // objects: jest.fn(),
    // filtered: jest.fn(),
  };
});

export default mock;
